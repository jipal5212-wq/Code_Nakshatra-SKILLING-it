/**
 * Supabase JWT session persisted for the SKILLING IT web client.
 */
(function () {
  const STORAGE_KEY = 'skilling_sb_session';
  const LEGACY_KEY = 'skillingit_session';

  function parse(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function readRaw() {
    return parse(localStorage.getItem(STORAGE_KEY) || 'null');
  }

  /** @returns {{ access_token: string, refresh_token?: string, expires_at?: number, user: { id: string, email?: string, displayName?: string, skill_domain?: string, level?: string, points?: number } } | null} */
  function read() {
    let s = readRaw();
    if (!s && localStorage.getItem(LEGACY_KEY)) {
      const old = parse(localStorage.getItem(LEGACY_KEY));
      if (old?.id && old?.token) {
        s = {
          access_token: old.token,
          user: {
            id: old.id,
            email: old.email || '',
            displayName: old.name || '',
            skill_domain: old.skill_domain || '',
            level: old.level || 'Beginner'
          }
        };
      }
      if (old) localStorage.removeItem(LEGACY_KEY);
    }
    return s;
  }

  function write(sess) {
    if (!sess) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    localStorage.removeItem(LEGACY_KEY);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  }

  function bearerHeaders() {
    const s = read();
    const t = s?.access_token;
    const h = { 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }

  /** Backend + inline script expect `{ id, name, email?, access_token }`. */
  function toLegacy(sess) {
    if (!sess?.user?.id || !sess?.access_token) return null;
    const u = sess.user;
    return {
      id: u.id,
      name: u.displayName || u.email?.split('@')[0] || 'Learner',
      email: u.email || '',
      access_token: sess.access_token,
      skill_domain: u.skill_domain,
      level: u.level
    };
  }

  /** Refreshes the access_token if it has expired or is expiring within 5 min.
   *  Returns the valid access_token string, or null if refresh failed (force re-login).
   */
  async function refreshIfNeeded() {
    const s = readRaw();
    if (!s || !s.access_token) return null;

    // expires_at from Supabase is a Unix timestamp in seconds
    const expiresAtMs = s.expires_at ? s.expires_at * 1000 : 0;
    const fiveMin = 5 * 60 * 1000;

    // Token still valid with headroom — return it immediately
    if (expiresAtMs && Date.now() < expiresAtMs - fiveMin) {
      return s.access_token;
    }

    // Token expired or about to — try refresh
    if (!s.refresh_token) return null;
    try {
      const r = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: s.refresh_token })
      });
      const d = await r.json();
      if (d.ok && d.session) {
        const updated = {
          ...s,
          access_token: d.session.access_token,
          refresh_token: d.session.refresh_token,
          expires_at: d.session.expires_at
        };
        write(updated);
        return d.session.access_token;
      }
    } catch (_) {}
    return null; // refresh failed — caller should redirect to login
  }

  window.SkillingAuth = {
    STORAGE_KEY,
    read,
    readRaw,
    write,
    clear,
    bearerHeaders,
    toLegacy,
    refreshIfNeeded,
    migrateFromLegacy: () => {
      read();
    }
  };
})();
