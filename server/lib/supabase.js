const { createClient } = require('@supabase/supabase-js');

let _admin = null;
let _anon = null;

exports.getAdminClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_admin) _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
};

exports.getAnonAuthClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY_PUBLISHABLE;
  if (!url || !key) return null;
  if (!_anon) _anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _anon;
};

exports.verifyBearerUser = async (accessToken) => {
  if (!accessToken) return { user: null, error: 'no_token' };

  // Try anon client first (preferred for user-scoped operations)
  const anonClient = exports.getAnonAuthClient();
  if (anonClient) {
    const { data: { user }, error } = await anonClient.auth.getUser(accessToken);
    if (user && !error) return { user, error: null };
  }

  // Fall back to admin (service-role) client — also able to verify JWTs.
  // This handles the common case where SUPABASE_ANON_KEY is not configured.
  const adminClient = exports.getAdminClient();
  if (adminClient) {
    const { data: { user }, error } = await adminClient.auth.getUser(accessToken);
    return { user, error };
  }

  return { user: null, error: 'no_supabase_client' };
};
