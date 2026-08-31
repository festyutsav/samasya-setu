const User = require("../models/User");
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
// EXPORTS
// ========================================

module.exports = {

  registerUser,

  loginUser,

  getProfile,

};