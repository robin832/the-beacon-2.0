// Shared URL verification helper used by innovation-analysis and
// ecosystem-matching Edge Functions. Performs a cheap HEAD request (with a
// GET fallback for servers that disallow HEAD) to confirm that a URL actually
// resolves. Called before persisting sources / evidence URLs so the frontend
// never renders broken links.
//
// Failure modes return `false` rather than throwing — verification is
// best-effort and must never break the parent analysis.

const UA =
  "Mozilla/5.0 (compatible; BeaconInnovationBot/1.0; +https://thebeacon.be)";
const DEFAULT_TIMEOUT_MS = 5000;

function isValidUrlString(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function verifyUrl(
  url: string | null | undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  if (!isValidUrlString(url)) return false;

  const headers = { "User-Agent": UA };

  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers,
    });
    if (head.ok) return true;
    // 405 Method Not Allowed / 403 from WAFs that block HEAD but allow GET.
    // A single GET retry catches these cases without exploding cost.
    if (head.status === 405 || head.status === 403) {
      const get = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers,
      });
      return get.ok;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Verifies every URL in an array of source-like objects in parallel and returns
 * a new array where each item has a `verified: boolean` field added.
 * Items without a URL are marked `verified: false`.
 */
export async function verifySourceUrls<T extends { url?: string | null }>(
  items: T[] | undefined | null,
): Promise<Array<T & { verified: boolean }>> {
  if (!items || !Array.isArray(items)) return [];
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      verified: item.url ? await verifyUrl(item.url) : false,
    })),
  );
}
