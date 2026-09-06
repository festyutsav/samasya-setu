const nodemailer = require("nodemailer");

const getTransporter = () => {
  const rawUser = process.env.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || "";

  const SMTP_USER = rawUser
    .trim()
    .replace(/^["']|["']$/g, "");

  const SMTP_PASS = rawPass
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");

  const SMTP_SERVICE = (process.env.SMTP_SERVICE || "")
    .trim()
    .toLowerCase();

  const SMTP_HOST = (process.env.SMTP_HOST || "").trim();

  const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP_USER or SMTP_PASS is missing in the server .env file."
    );
  }

  if (
    SMTP_SERVICE === "gmail" ||
    SMTP_USER.toLowerCase().includes("@gmail.com")
  ) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  throw new Error(
    "SMTP configuration is incomplete. Please configure SMTP_SERVICE or SMTP_HOST."
  );
};

const sendOtpEmail = async ({ to, name, otp }) => {
  try {
    const transporter = getTransporter();

    const SMTP_USER = (process.env.SMTP_USER || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    const fromAddress =
      process.env.SMTP_FROM ||
      `"SamasyaSetu Portal — Govt. of Jharkhand" <${SMTP_USER}>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SamasyaSetu Verification Code</title>
</head>

<body style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;">

  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8e2dc;">

    <div style="background:#0b514a;padding:32px;text-align:center;border-bottom:4px solid #c9933b;">

      <div style="font-size:11px;font-weight:bold;color:#a3d9cf;letter-spacing:2px;">
        GOVERNMENT OF JHARKHAND
      </div>

      <div style="font-size:26px;font-weight:bold;color:#ffffff;margin-top:8px;">
        SamasyaSetu
      </div>

      <div style="font-size:12px;color:#c4e5dc;margin-top:6px;">
        Higher, Technical Education & Skill Development Department
      </div>

    </div>

    <div style="padding:36px 32px;">

      <p style="font-size:17px;font-weight:bold;color:#173d3a;">
        Namaste ${name || "Citizen"},
      </p>

      <p style="font-size:15px;line-height:1.6;color:#4a5c56;">
        Thank you for creating an account on
        <strong>SamasyaSetu</strong>.
        Please use the following 6-digit verification code to verify your email address.
      </p>

      <div style="background:#eaf5f1;border:2px dashed #0b6b60;border-radius:14px;padding:28px;text-align:center;margin:28px 0;">

        <div style="font-size:11px;font-weight:bold;color:#0b6b60;letter-spacing:2px;">
          YOUR VERIFICATION CODE
        </div>

        <div style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#073f3a;font-family:monospace;margin-top:12px;">
          ${otp}
        </div>

        <div style="font-size:12px;color:#5c6f69;margin-top:12px;">
          Valid for <strong>10 minutes</strong> · One-time use only
        </div>

      </div>

      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;color:#92400e;font-size:13px;">
        <strong>Security Advisory:</strong>
        Never share this verification code with anyone.
      </div>

      <p style="font-size:13px;color:#71827c;margin-top:24px;">
        If you did not request this registration, you can safely ignore this email.
      </p>

    </div>

    <div style="background:#f7fbf9;border-top:1px solid #eef2ee;padding:22px;text-align:center;">

      <p style="font-size:12px;font-weight:bold;color:#315d56;">
        Government of Jharkhand · SamasyaSetu Innovation Portal
      </p>

      <p style="font-size:11px;color:#8a9993;">
        Department of Higher & Technical Education · Ranchi, Jharkhand
      </p>

    </div>

  </div>

</body>
</html>
`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: `[SamasyaSetu] Your Verification Code: ${otp}`,
      text:
        `Namaste ${name || "Citizen"},\n\n` +
        `Your SamasyaSetu verification code is: ${otp}\n\n` +
        `This code is valid for 10 minutes.\n\n` +
        `Government of Jharkhand`,
      html: htmlContent,
    };

    console.log(`[EMAIL SERVICE] Sending OTP to ${to}...`);

    const info = await transporter.sendMail(mailOptions);

    console.log(
      `[EMAIL SERVICE] OTP email sent successfully to ${to}`
    );

    console.log(
      `[EMAIL SERVICE] Message ID: ${info.messageId}`
    );

    return {
      sent: true,
      message: "Verification code sent to your email.",
    };

  } catch (error) {
    console.error(
      "[EMAIL SERVICE] Failed to send OTP email:"
    );

    console.error(error);

    throw new Error(
      `Unable to send verification email: ${error.message}`
    );
  }
};

module.exports = {
  sendOtpEmail,
};