require('dotenv').config();
const { sendOtpEmail } = require('../server/lib/resendMail');

async function test() {
  console.log('🔄 Attempting to send test email via Resend...');
  const result = await sendOtpEmail('skillingit379@gmail.com', '123456');
  
  if (result.ok) {
    console.log('✅ Email sent successfully! ID:', result.id);
  } else {
    console.error('❌ Email failed:', result.error);
    if (result.error.includes('verified sender')) {
      console.warn('\n⚠️  TIP: Resend requires the "from" email to be a verified domain or email in your Resend dashboard.');
    }
  }
}

test();
