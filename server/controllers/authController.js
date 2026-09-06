const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Otp = require("../models/Otp");
const sendOtpEmail = require("../utils/sendOtp");

// ========================================
// REGISTER USER
// ========================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || "citizen",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[REGISTER] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
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
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name.",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP valid for 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Save OTP in MongoDB
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        otp: otp,
        attempts: 0,
        expiresAt: expiresAt,
        createdAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `[OTP] Generated verification code for ${cleanEmail}`
    );

    // Send REAL OTP through Gmail
    await sendOtpEmail(cleanEmail, otp);

    console.log(
      `[OTP] Email sent successfully to ${cleanEmail}`
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      expiresAt: expiresAt,
    });

  } catch (error) {
    console.error(
      "[OTP] Registration OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code. Please check your email configuration and try again.",
    });
  }
};


// ========================================
// VERIFY OTP AND REGISTER
// ========================================

const verifyOtpAndRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      otp,
      role,
    } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and OTP are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find OTP
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "No verification code found. Please request a new OTP.",
      });
    }

    // Check OTP expiration
    if (
      new Date() >
      new Date(otpRecord.expiresAt)
    ) {
      await Otp.deleteOne({
        email: cleanEmail,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new one.",
      });
    }

    // Check OTP
    if (
      String(otpRecord.otp) !==
      String(otp).trim()
    ) {
      otpRecord.attempts =
        (otpRecord.attempts || 0) + 1;

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      await Otp.deleteOne({
        email: cleanEmail,
      });

      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || "citizen",
    });

    // Delete OTP after successful registration
    await Otp.deleteOne({
      email: cleanEmail,
    });

    return res.status(201).json({
      success: true,
      message:
        "Email verified and registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "[VERIFY OTP] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete registration.",
    });
  }
};


// ========================================
// LOGIN USER
// ========================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "[LOGIN] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed. Please try again.",
    });
  }
};


// ========================================
// GET PROFILE
// ========================================

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(
      req.user.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: user,
    });

  } catch (error) {
    console.error(
      "[PROFILE] Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch profile.",
    });
  }
};


// ========================================
// EXPORT
// ========================================

module.exports = {
  registerUser,
  sendRegistrationOtp,
  verifyOtpAndRegister,
  loginUser,
  getProfile,
};