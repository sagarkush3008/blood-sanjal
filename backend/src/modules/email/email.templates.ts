import { env } from '../../config/env.config';

type TemplateFunction = (data: any) => { subject: string; text: string; html: string };

const baseHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; color: #d32f2f; }
    .content { color: #333333; line-height: 1.6; }
    .footer { margin-top: 20px; font-size: 12px; color: #777777; text-align: center; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #d32f2f; color: #ffffff; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Blood Sanjal</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Blood Sanjal, Connecting Donors and Recipients.</p>
    </div>
  </div>
</body>
</html>
`;

export const templates: Record<string, TemplateFunction> = {
  welcome: (data: { name: string; token: string }) => {
    const link = `${env.FRONTEND_BASE_URL}/verify-email?token=${data.token}`;
    return {
      subject: 'Welcome to Blood Sanjal - Verify your email',
      text: `Hi ${data.name},\nWelcome to Blood Sanjal. Please verify your email by visiting: ${link}`,
      html: baseHtml(`<p>Hi ${data.name},</p><p>Welcome to Blood Sanjal. Please verify your email.</p><p><a href="${link}" class="btn">Verify Email</a></p>`)
    };
  },
  otp: (data: { name: string; otp: string }) => ({
    subject: 'Your Blood Sanjal Verification Code',
    text: `Hi ${data.name},\nYour verification code is ${data.otp}. It will expire in 10 minutes.`,
    html: baseHtml(`<p>Hi ${data.name},</p><p>Your verification code is:</p><h2 style="text-align: center; letter-spacing: 5px;">${data.otp}</h2><p>It will expire in 10 minutes.</p>`)
  }),
  passwordReset: (data: { name: string; token: string }) => {
    const link = `${env.FRONTEND_BASE_URL}/reset-password?token=${data.token}`;
    return {
      subject: 'Reset your Blood Sanjal password',
      text: `Hi ${data.name},\nReset your password here: ${link}`,
      html: baseHtml(`<p>Hi ${data.name},</p><p>Click the button below to reset your password.</p><p><a href="${link}" class="btn">Reset Password</a></p>`)
    };
  },
  bloodRequestAlert: (data: { patientName: string; bloodGroup: string; location: string; link: string }) => ({
    subject: `Urgent: ${data.bloodGroup} Blood Needed in ${data.location}`,
    text: `Urgent request for ${data.bloodGroup} blood for ${data.patientName} at ${data.location}. View details: ${data.link}`,
    html: baseHtml(`<p>Urgent request for <b>${data.bloodGroup}</b> blood for ${data.patientName} at ${data.location}.</p><p><a href="${data.link}" class="btn">View Details</a></p>`)
  }),
  adminAlert: (data: { message: string }) => ({
    subject: 'Blood Sanjal System Alert',
    text: `System Alert: ${data.message}`,
    html: baseHtml(`<p>System Alert:</p><p>${data.message}</p>`)
  })
};
