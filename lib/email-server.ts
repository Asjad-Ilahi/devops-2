// lib/email-server.ts
import nodemailer from "nodemailer";

function ensureString(value: string | undefined, name: string): asserts value is string {
  if (!value) {
    throw new Error(`Please define the ${name} environment variable in .env.local`);
  }
}

const EMAIL_USER = "tester.7804@gmail.com";
const EMAIL_PASS = "fiqgjpnvlosrzhwu";

ensureString(EMAIL_USER, "EMAIL_USER");
ensureString(EMAIL_PASS, "EMAIL_PASS");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Verify Your Email",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response, "to:", to, "with code:", code);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendApprovalEmail(to: string) {
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Account Approved",
    text: "Your account has been approved by the admin. You can now log in.",
    html: "<p>Your account has been approved by the admin. You can now <a href='http://localhost:3000/login'>log in</a>.</p>",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Approval email sent:", info.response, "to:", to);
    return info;
  } catch (error) {
    console.error("Error sending approval email:", error);
    throw new Error("Failed to send approval email");
  }
}