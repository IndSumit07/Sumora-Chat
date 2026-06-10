import SibApiV3Sdk from 'sib-api-v3-sdk';
import logger from '../config/logger.js';

let apiInstance = null;

const getBrevoClient = () => {
  if (!apiInstance) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }
  return apiInstance;
};

/**
 * Send email directly via Brevo API
 */
export const sendEmailDirect = async ({ to, subject, html, text }) => {
  const api = getBrevoClient();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.textContent = text || 'Please view this email in an HTML-compatible email client.';
  sendSmtpEmail.sender = { 
    name: "Sumora Chat", 
    email: process.env.EMAIL_FROM || "noreply@yourdomain.com" 
  };
  sendSmtpEmail.to = [{ email: to }];
  
  try {
    const data = await api.sendTransacEmail(sendSmtpEmail);
    logger.info(`Email sent via Brevo: messageId=${data.messageId}, to=${to}`);
    return data;
  } catch (error) {
    logger.error(`Brevo Email failed to send: ${error.message}`);
    throw error;
  }
};

// ============ EMAIL TEMPLATES ============

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sumora Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0f14; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; }
    .header { background: linear-gradient(135deg, #005c4b 0%, #00a884 100%); padding: 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin-top: 4px; font-size: 14px; }
    .body { padding: 32px; }
    .body p { color: #94a3b8; line-height: 1.6; margin-bottom: 16px; font-size: 15px; }
    .body h2 { color: #f1f5f9; font-size: 18px; margin-bottom: 16px; }
    .otp-box { background: #0a0f14; border: 2px dashed #25d366; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #25d366; font-family: 'Courier New', monospace; }
    .otp-expire { font-size: 13px; color: #64748b; margin-top: 8px; }
    .btn { display: inline-block; background: #25d366; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .btn:hover { background: #1ea855; }
    .divider { border: none; border-top: 1px solid #1e293b; margin: 24px 0; }
    .footer { padding: 24px 32px; text-align: center; }
    .footer p { color: #475569; font-size: 12px; line-height: 1.6; }
    .logo { font-size: 20px; font-weight: 800; color: #25d366; }
    .warning { background: #1e2a1e; border-left: 3px solid #25d366; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .warning p { color: #86efac; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">◈ Sumora</div>
        <h1>Sumora Chat</h1>
        <p>Secure. Real-time. Yours.</p>
      </div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} Sumora Chat. All rights reserved.</p>
        <p style="margin-top:8px;">You're receiving this email because you have an account with Sumora Chat. If you did not request this, please ignore this email or <a href="#" style="color:#25d366;">contact support</a>.</p>
        <p style="margin-top:8px;"><a href="#" style="color:#475569;">Unsubscribe</a> · <a href="#" style="color:#475569;">Privacy Policy</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const otpEmailTemplate = ({ otp, purpose, expiryMinutes = 10 }) => {
  const purposeLabels = {
    register: 'Verify Your Email',
    reset: 'Reset Your Password',
    delete: 'Confirm Account Deletion',
    change_password: 'Verify Password Change',
  };

  const label = purposeLabels[purpose] || 'Verify Your Action';

  const content = `
    <div class="body">
      <h2>${label}</h2>
      <p>Use the following one-time password (OTP) to complete your request. This code expires in <strong style="color:#25d366;">${expiryMinutes} minutes</strong>.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-expire">Expires in ${expiryMinutes} minutes</div>
      </div>
      <div class="warning">
        <p>⚠️ Never share this code with anyone. Sumora Chat will never ask for your OTP.</p>
      </div>
      <p>If you didn't request this, you can safely ignore this email. Your account remains secure.</p>
    </div>
  `;

  return baseTemplate(content);
};

export const friendRequestEmailTemplate = ({ senderName, senderUsername, receiverName, acceptLink }) => {
  const content = `
    <div class="body">
      <h2>Friend Request from ${senderName}</h2>
      <p>Hi <strong style="color:#f1f5f9;">${receiverName}</strong>,</p>
      <p><strong style="color:#25d366;">@${senderUsername}</strong> wants to connect with you on Sumora Chat!</p>
      <p>Accept their request to start chatting in real-time with end-to-end encrypted messages.</p>
      <div style="text-align:center;">
        <a href="${acceptLink}" class="btn">✓ Accept Friend Request</a>
      </div>
      <hr class="divider">
      <p style="font-size:13px;">Or log in to your Sumora account to manage your friend requests.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const friendAcceptedEmailTemplate = ({ accepterName, senderName }) => {
  const content = `
    <div class="body">
      <h2>Friend Request Accepted! 🎉</h2>
      <p>Hi <strong style="color:#f1f5f9;">${senderName}</strong>,</p>
      <p>Great news! <strong style="color:#25d366;">${accepterName}</strong> accepted your friend request on Sumora Chat.</p>
      <p>You can now start chatting with real-time messaging, voice notes, and file sharing.</p>
      <div style="text-align:center;">
        <a href="${process.env.FRONTEND_URL}" class="btn">Start Chatting →</a>
      </div>
    </div>
  `;
  return baseTemplate(content);
};

export const groupInviteEmailTemplate = ({ inviterName, groupName, recipientName, inviteLink }) => {
  const content = `
    <div class="body">
      <h2>You've been invited to a group</h2>
      <p>Hi <strong style="color:#f1f5f9;">${recipientName}</strong>,</p>
      <p><strong style="color:#25d366;">${inviterName}</strong> has added you to the group <strong style="color:#f1f5f9;">"${groupName}"</strong> on Sumora Chat.</p>
      <div style="text-align:center;">
        <a href="${inviteLink}" class="btn">Join Group →</a>
      </div>
      <hr class="divider">
      <p style="font-size:13px;">If you don't recognize this, you can ignore this email.</p>
    </div>
  `;
  return baseTemplate(content);
};

export default sendEmailDirect;
