import { supabase } from './supabase';
import { getSessionId } from './session';

export function trackEvent(
  eventType: string,
  page: string,
  metadata?: Record<string, unknown>
) {
  const sessionId = getSessionId();
  if (!sessionId) return;

  // Fire-and-forget
  supabase
    .from('interactions')
    .insert({
      session_id: sessionId,
      event_type: eventType,
      page,
      metadata: metadata || null,
    })
    .then(() => {});
}

export function setupScrollTracking(page: string) {
  if (typeof window === 'undefined') return;

  const thresholds = [25, 50, 75, 100];
  const tracked = new Set<number>();

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((scrollTop / docHeight) * 100);

    for (const t of thresholds) {
      if (percent >= t && !tracked.has(t)) {
        tracked.add(t);
        trackEvent('scroll_depth', page, { depth: t });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

export function trackTimeOnPage(page: string) {
  if (typeof window === 'undefined') return;

  const start = Date.now();
  const handler = () => {
    const seconds = Math.round((Date.now() - start) / 1000);
    trackEvent('time_on_page', page, { seconds });
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}
