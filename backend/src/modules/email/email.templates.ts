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
  }),
  contactRequest: (data: { donorName: string; requesterName: string; bloodGroup?: string }) => ({
    subject: 'New Blood Sanjal Contact Request',
    text: `Hi ${data.donorName},\n${data.requesterName} has requested your contact information regarding a blood donation. Please review and respond in your app.`,
    html: baseHtml(`<p>Hi ${data.donorName},</p><p><b>${data.requesterName}</b> has sent you a contact request regarding a blood donation inquiry.</p><p>Your contact information will remain completely private until you explicitly accept this request.</p>`)
  }),
  contactReveal: (data: { requesterName: string; donorName: string; phone?: string; email?: string }) => ({
    subject: 'Contact Request Accepted - Blood Sanjal',
    text: `Hi ${data.requesterName},\n${data.donorName} has accepted your contact request. Contact info: ${data.phone || data.email}`,
    html: baseHtml(`<p>Hi ${data.requesterName},</p><p><b>${data.donorName}</b> has accepted your contact request!</p><p><b>Phone:</b> ${data.phone || 'N/A'}<br><b>Email:</b> ${data.email || 'N/A'}</p>`)
  }),
  emergencyAlert: (data: { patientName?: string; bloodGroup: string; hospitalName: string }) => ({
    subject: `EMERGENCY ALERT: ${data.bloodGroup} Blood Needed Urgently`,
    text: `Emergency blood request for ${data.bloodGroup} at ${data.hospitalName}. Please open the Blood Sanjal app if you can donate.`,
    html: baseHtml(`<h3 style="color: #d32f2f;">EMERGENCY BLOOD REQUEST</h3><p>An emergency request for <b>${data.bloodGroup}</b> has been verified at <b>${data.hospitalName}</b>.</p><p>Please open the app to respond if you are eligible to donate.</p>`)
  }),
  donationReminder: (data: { donorName: string; lastDonationDate: string }) => ({
    subject: 'You are eligible to donate blood again! - Blood Sanjal',
    text: `Hi ${data.donorName},\nIt has been 90 days since your last donation on ${data.lastDonationDate}. You are now eligible to save lives again!`,
    html: baseHtml(`<p>Hi ${data.donorName},</p><p>Thank you for being a hero. It has been 90 days since your last donation. You are now eligible to donate blood again!</p>`)
  }),
  rewardAwarded: (data: { donorName: string; badgeTitle: string }) => ({
    subject: 'Congratulations! New Milestone Badge Earned - Blood Sanjal',
    text: `Hi ${data.donorName},\nYou have been awarded the "${data.badgeTitle}" badge for your life-saving donations!`,
    html: baseHtml(`<p>Hi ${data.donorName},</p><p>Congratulations! You have earned the <b>${data.badgeTitle}</b> badge. Thank you for your continued dedication to saving lives.</p>`)
  }),
  certificateIssued: (data: { donorName: string; certificateNumber: string; verifyUrl: string }) => ({
    subject: 'Your Blood Sanjal Donation Certificate is Ready',
    text: `Hi ${data.donorName},\nYour official certificate #${data.certificateNumber} is available. Verify here: ${data.verifyUrl}`,
    html: baseHtml(`<p>Hi ${data.donorName},</p><p>Your verified blood donation certificate <b>#${data.certificateNumber}</b> has been issued.</p><p><a href="${data.verifyUrl}" class="btn">View & Verify Certificate</a></p>`)
  })
};
