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

  window.SkillingAuth = {
    STORAGE_KEY,
    read,
    readRaw,
    write,
    clear,
    bearerHeaders,
    toLegacy,
    migrateFromLegacy: () => {
      read();
    }
  };
})();
