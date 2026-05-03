require('dotenv').config();
const { getAdminClient } = require('../server/lib/supabase');

async function test() {
  const admin = getAdminClient();
  if (!admin) {
    console.error('❌ Supabase Admin Client not initialized. Check your environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase...');
  try {
    const { data, error } = await admin.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Supabase Query Error:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase connected successfully!');
    console.log(`📊 Profiles table count: ${data === null ? 0 : data.length || 0} (or query succeeded)`);
  } catch (err) {
    console.error('❌ Unexpected Error:', err.message);
    process.exit(1);
  }
}

test();
