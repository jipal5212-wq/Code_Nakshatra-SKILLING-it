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
  const client = exports.getAnonAuthClient();
  if (!client || !accessToken) return { user: null, error: 'no_client_or_token' };
  const {
    data: { user },
    error
  } = await client.auth.getUser(accessToken);
  return { user, error };
};
