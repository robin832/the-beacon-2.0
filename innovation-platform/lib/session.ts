import { supabase } from './supabase';

const SESSION_KEY = 'beacon_session_id';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function getUTMParams(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
}

export async function getOrCreateSession(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('Session management requires browser');

  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const utm = getUTMParams();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      referrer: document.referrer || null,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      device_type: getDeviceType(),
      last_activity_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;

  localStorage.setItem(SESSION_KEY, data.id);
  return data.id;
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}
