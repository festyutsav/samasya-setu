// ========================================
// EMAIL NOTIFICATION SERVICE
// ========================================

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  nodemailer = null;
}

const getTransporter = () => {
  if (!nodemailer) return null;

  const rawUser = process.env.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || "";
  const SMTP_USER = rawUser.trim().replace(/^["']|["']$/g, "");
  // Gmail app passwords are 16 lowercase characters often formatted with spaces like 'zdyd ikdk yqrg pvca'
  const SMTP_PASS = rawPass.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");
  const SMTP_SERVICE = (process.env.SMTP_SERVICE || "").trim().toLowerCase();
  const SMTP_HOST = (process.env.SMTP_HOST || "").trim();
  const SMTP_PORT = process.env.SMTP_PORT;

  // Dedicated direct SSL port 465 for Gmail (works reliably on cloud hosts like Render)
  if (SMTP_USER && SMTP_PASS && (SMTP_SERVICE === "gmail" || !SMTP_HOST || SMTP_USER.includes("@gmail"))) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 8000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    });
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 8000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    });
  }

  return null;
};

const sendOtpEmail = async ({ to, name, otp }) => {
  const transporter = getTransporter();
  const { SMTP_USER } = process.env;
  const fromAddress =
    process.env.SMTP_FROM ||
    (SMTP_USER
      ? `"SamasyaSetu Portal — Govt. of Jharkhand" <${SMTP_USER}>`
      : `"SamasyaSetu Portal — Govt. of Jharkhand" <noreply@samasyasetu.gov.in>`);

  const htmlContent = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>SamasyaSetu Verification Code</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f5; padding: 32px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #d8e2dc; box-shadow: 0 6px 24px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color: #0b514a; padding: 34px 28px; text-align: center; border-bottom: 4px solid #c9933b;">
                  <div style="font-size: 11px; font-weight: 800; color: #a3d9cf; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
                    GOVERNMENT OF JHARKHAND
                  </div>
                  <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; line-height: 1.2;">
                    SamasyaSetu <span style="font-weight: 400; font-size: 20px; color: #d8ebe4;">| समस्या सेतु</span>
                  </div>
                  <div style="font-size: 12px; color: #c4e5dc; margin-top: 6px; font-weight: 500;">
                    Higher, Technical Education &amp; Skill Development Department
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 32px 28px 32px;">
                  <p style="font-size: 17px; font-weight: 700; color: #173d3a; margin: 0 0 14px 0;">
                    Namaste ${name || "Citizen"},
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; color: #4a5c56; margin: 0 0 26px 0;">
                    Thank you for creating an account on <strong>SamasyaSetu</strong>, Jharkhand's digital platform connecting citizen challenges to university innovation and industry collaboration.
                    <br/><br/>
                    Please use the following 6-digit One-Time Password (OTP) to verify your email address:
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 26px 0;">
                    <tr>
                      <td align="center" style="background-color: #eaf5f1; border: 2px dashed #0b6b60; border-radius: 14px; padding: 26px 20px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 800; color: #0b6b60; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                          YOUR VERIFICATION CODE
                        </div>
                        <div style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #073f3a; font-family: 'Courier New', Courier, monospace; line-height: 1; padding: 6px 0;">
                          ${otp}
                        </div>
                        <div style="font-size: 12px; color: #5c6f69; margin-top: 10px; font-weight: 500;">
                          ⏱️ Valid for <strong>10 minutes</strong> &bull; One-time use only
                        </div>
                      </td>
                    </tr>
                  </table>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; margin: 0 0 24px 0;">
                    <tr>
                      <td style="padding: 14px 16px; font-size: 13px; line-height: 1.5; color: #92400e;">
                        <strong>Security Advisory:</strong> Never share this verification code with anyone. Government officials or SamasyaSetu staff will never ask for your password or OTP.
                      </td>
                    </tr>
                  </table>
                  <p style="font-size: 13px; line-height: 1.5; color: #71827c; margin: 0;">
                    If you did not request this registration, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f7fbf9; border-top: 1px solid #eef2ee; padding: 22px 28px; text-align: center;">
                  <p style="font-size: 12px; font-weight: 600; color: #315d56; margin: 0 0 4px 0;">
                    Government of Jharkhand &bull; SamasyaSetu Innovation Portal
                  </p>
                  <p style="font-size: 11px; color: #8a9993; margin: 0; line-height: 1.5;">
                    Department of Higher &amp; Technical Education &bull; Ranchi, Jharkhand
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from: fromAddress,
        replyTo: `"SamasyaSetu Support" <support@samasyasetu.gov.in>`,
        to,
        subject: `🏛️ [SamasyaSetu] Your Verification Code: ${otp} (Govt. of Jharkhand)`,
        text: `Namaste ${name || "Citizen"},\n\nYour SamasyaSetu verification code is: ${otp}.\nThis code is valid for 10 minutes.\n\nGovernment of Jharkhand`,
        html: htmlContent,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SMTP handshake timeout")), 6000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[EMAIL SERVICE] OTP email sent successfully to ${to}`);
      return { sent: true, simulated: false, message: "Verification code sent to your email." };
    } catch (err) {
      console.warn(`[EMAIL SERVICE] SMTP dispatch failed (${err.message}). Falling back to instant code verification.`);
    }
  }

  return {
    sent: false,
    simulated: true,
    message: "Verification code generated (Demo Mode active).",
    demoOtp: otp,
  };
};

module.exports = {
  sendOtpEmail,
};
