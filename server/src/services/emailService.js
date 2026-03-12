const { Resend } = require('resend');
const env = require('../config/env');

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

async function sendEmailCode({ to, code, purpose }) {
  const subject =
    purpose === 'signup_verify'
      ? 'Verify your PennyPulse account'
      : 'Reset your PennyPulse password';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>PennyPulse</h2>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:2px">${code}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  if (!resend) {
    console.warn(`RESEND_API_KEY missing. Code for ${to} (${purpose}): ${code}`);
    return;
  }

  await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html
  });
}

module.exports = { sendEmailCode };
