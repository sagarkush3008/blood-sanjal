import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, './.env') });

async function testEmail() {
  console.log("Testing email with:");
  console.log("Host:", process.env.SMTP_HOST);
  console.log("Port:", process.env.SMTP_PORT);
  console.log("User:", process.env.SMTP_USER);
  console.log("Pass length:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // send to self
      subject: "Test Email from Blood Sanjal",
      text: "This is a test to verify SMTP configuration.",
    });
    console.log("Success! Message sent: ", info.messageId);
  } catch (error) {
    console.error("Failed to send email. Error:");
    console.error(error);
  }
}

testEmail();
