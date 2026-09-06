const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test Gmail connection
transporter.verify((error, success) => {
  if (error) {
    console.error("GMAIL CONNECTION ERROR:");
    console.error(error);
  } else {
    console.log("GMAIL CONNECTION SUCCESSFUL");
  }
});

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"SamasyaSetu" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "SamasyaSetu Email Verification OTP",

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      ">

        <h2 style="color: #0B5CAB;">
          SamasyaSetu Email Verification
        </h2>

        <p>
          Thank you for registering with SamasyaSetu.
        </p>

        <p>
          Your email verification OTP is:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #0B5CAB;
          margin: 25px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for 10 minutes.
        </p>

        <p style="color: #666;">
          If you did not request this verification,
          you can safely ignore this email.
        </p>

        <hr />

        <p style="color: #888; font-size: 12px;">
          SamasyaSetu · Connecting challenges with solutions
        </p>

      </div>
    `,
  });
};

module.exports = sendOtpEmail;