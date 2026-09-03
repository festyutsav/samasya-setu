const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../services/emailService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ========================================
// REGISTER USER
// ========================================

const registerUser = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
    } = req.body;


    // ========================================
    // VALIDATE INPUT
    // ========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Please provide name, email and password",
      });
    }


    // ========================================
    // CHECK EXISTING USER
    // ========================================

    const existingUser =
      await User.findOne({
        email: email.toLowerCase(),
      });


    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }


    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // ========================================
    // CREATE CITIZEN USER
    // ========================================

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "citizen",
    });


    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({

      message:
        "User registered successfully",

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        organization: null,

      },

    });

  } catch (error) {

    console.error(
      "Register error:",
      error.message
    );


    return res.status(500).json({
      message: "Server error",
    });

  }
};


// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
  try {

    const {
      email,
      password,
    } = req.body;


    // ========================================
    // VALIDATE INPUT
    // ========================================

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Please provide email and password",
      });
    }


    // ========================================
    // FIND USER + ORGANIZATION
    // ========================================

    const user =
      await User.findOne({
        email: email.toLowerCase(),
      })
        .populate({
          path: "partner",

          select:
            "name type description location email website",
        });


    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }


    // ========================================
    // VERIFY PASSWORD
    // ========================================

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }


    // ========================================
    // GENERATE JWT
    // ========================================

    const token = jwt.sign(

      {
        userId: user._id,

        role: user.role,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }

    );


    // ========================================
    // PREPARE USER RESPONSE
    // ========================================

    const userResponse = {

      id: user._id,

      name: user.name,

      email: user.email,

      role: user.role,

      organization: null,

    };


    // ========================================
    // ADD ORGANIZATION INFORMATION
    // ========================================

    if (
      user.role === "partner" &&
      user.partner
    ) {

      userResponse.organization = {

        id: user.partner._id,

        name: user.partner.name,

        type: user.partner.type,

        description:
          user.partner.description,

        location:
          user.partner.location,

        email:
          user.partner.email,

        website:
          user.partner.website,

      };

    }


    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({

      message:
        "Login successful",

      token,

      user: userResponse,

    });

  } catch (error) {

    console.error(
      "Login error:",
      error.message
    );


    return res.status(500).json({
      message: "Server error",
    });

  }
};


// ========================================
// GET PROFILE
// ========================================

const getProfile = async (req, res) => {
  try {

    return res.status(200).json({

      message:
        "Protected profile data",

      user: req.user,

    });

  } catch (error) {

    console.error(
      "Profile error:",
      error.message
    );


    return res.status(500).json({
      message: "Server error",
    });

  }
};


// ========================================
// SEND REGISTRATION OTP
// ========================================

const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert OTP record
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      {
        otp,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // Send email
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      name: name?.trim() || "Citizen",
      otp,
    });

    return res.status(200).json({
      success: true,
      message: emailResult.simulated
        ? "Verification code generated (Demo Mode)."
        : `Verification code sent to ${cleanEmail}.`,
      expiresAt,
      demoOtp: emailResult.simulated ? otp : undefined,
    });
  } catch (error) {
    console.error("sendRegistrationOtp error:", error);
    return res.status(500).json({ message: "Failed to send verification code." });
  }
};


// ========================================
// VERIFY OTP AND REGISTER
// ========================================

const verifyOtpAndRegister = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: "Name, email, password and 6-digit OTP are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists. Please log in." });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ email: cleanEmail });
    if (!otpRecord) {
      return res.status(400).json({ message: "Verification code expired or not requested. Please request a new code." });
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
    }

    // Check attempts limit (max 5 tries)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ message: "Too many incorrect attempts. Please request a new verification code." });
    }

    // Validate OTP
    if (otpRecord.otp !== cleanOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // Code is valid! Hash password and create citizen user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "citizen",
      isEmailVerified: true,
    });

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Email verified and account registered successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        organization: null,
      },
    });
  } catch (error) {
    console.error("verifyOtpAndRegister error:", error);
    return res.status(500).json({ message: "Verification and registration failed." });
  }
};


// ========================================
// EXPORTS
// ========================================

module.exports = {
  registerUser,
  sendRegistrationOtp,
  verifyOtpAndRegister,
  loginUser,
  getProfile,
};