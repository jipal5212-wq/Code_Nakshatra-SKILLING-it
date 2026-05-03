require('dotenv').config();

const { createApp } = require('./server/createApp');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log('\n  SKILLING IT Server → http://localhost:' + PORT);
  console.log('  Env: SUPABASE_URL, SERVICE_ROLE_KEY, ANON_KEY, RESEND_*, ADMIN_SITE_PASSWORD, ADMIN_JWT_SECRET\n');
});
