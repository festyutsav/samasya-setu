const Partner = require("../models/Partner");
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// ========================================
// CREATE PARTNER
// ========================================

const createPartner = async (req, res) => {
  try {
    const {
      // Organization details
      name,
      type,
      description,
      location,
      email,
      website,

      // Partner login details
      userName,
      userEmail,
      password,
    } = req.body;


    // ========================================
    // VALIDATE ORGANIZATION
    // ========================================

    if (!name || !type) {
      return res.status(400).json({
        message: "Partner name and type are required.",
      });
    }


    // ========================================
    // VALIDATE LOGIN ACCOUNT
    // ========================================

    if (!userName || !userEmail || !password) {
      return res.status(400).json({
        message: "Partner login details are required.",
      });
    }


    // ========================================
    // CHECK USER EMAIL
    // ========================================

    const existingUser = await User.findOne({
      email: userEmail.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }


    // ========================================
    // CREATE PARTNER ORGANIZATION
    // ========================================

    const partner = await Partner.create({
      name,
      type,
      description,
      location,
      email,
      website,
    });


    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // ========================================
    // CREATE PARTNER USER
    // ========================================

    const user = await User.create({
      name: userName,
      email: userEmail.toLowerCase(),
      password: hashedPassword,
      role: "partner",
      partner: partner._id,
    });


    // ========================================
    // LINK USER TO PARTNER
    // ========================================

    partner.user = user._id;

    await partner.save();


    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({
      message:
        "Partner and partner login created successfully.",

      partner: {
        ...partner.toObject(),

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });

  } catch (error) {

    console.error(
      "Create partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while creating partner.",
    });

  }
};


// ========================================
// GET ALL PARTNERS
// ========================================

const getAllPartners = async (req, res) => {
  try {

    const partners = await Partner.find()
      .populate({
        path: "user",
        select: "name email role",
      })
      .sort({
        createdAt: -1,
      });


    return res.status(200).json({
      partners,
    });

  } catch (error) {

    console.error(
      "Get partners error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching partners.",
    });

  }
};


// ========================================
// GET SINGLE PARTNER
// ========================================

const getPartnerById = async (req, res) => {
  try {

    const partner =
      await Partner.findById(req.params.id)
        .populate({
          path: "user",
          select: "name email role",
        });


    if (!partner) {
      return res.status(404).json({
        message: "Partner not found.",
      });
    }


    return res.status(200).json({
      partner,
    });

  } catch (error) {

    console.error(
      "Get partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching partner.",
    });

  }
};


// ========================================
// DELETE PARTNER
// ========================================

const deletePartner = async (req, res) => {
  try {

    const partner =
      await Partner.findByIdAndDelete(
        req.params.id
      );


    if (!partner) {
      return res.status(404).json({
        message: "Partner not found.",
      });
    }


    // Delete the associated partner user
    if (partner.user) {
      await User.findByIdAndDelete(
        partner.user
      );
    }


    return res.status(200).json({
      message:
        "Partner and associated user deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while deleting partner.",
    });

  }
};


// ========================================
// EXPORTS
// ========================================

module.exports = {
  createPartner,
  getAllPartners,
  getPartnerById,
  deletePartner,
};