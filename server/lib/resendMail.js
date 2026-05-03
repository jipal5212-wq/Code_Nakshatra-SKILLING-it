const { Resend } = require('resend');

let _resend = null;
function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

exports.sendOtpEmail = async (toEmail, code) => {
  const From = process.env.RESEND_FROM_EMAIL;
  if (!From) return { ok: false, error: 'RESEND_FROM_EMAIL not set (use Resend-verified sender).' };
  const r = client();
  if (!r) return { ok: false, error: 'RESEND_API_KEY not set.' };
  const { data, error } = await r.emails.send({
    from: From,
    to: toEmail,
    subject: `${code} · SKILLING IT verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;line-height:1.5;color:#25282b">
        <p>Your SKILLING IT one-time login code:</p>
        <p style="font-size:32px;font-weight:800;color:#e60000;letter-spacing:6px">${code}</p>
        <p style="font-size:14px;color:#666">Expires in 10 minutes. Ignore if this wasn’t you.</p>
      </div>`
  });
  if (error) return { ok: false, error: error.message || String(error) };
  return { ok: true, id: data?.id };
};
