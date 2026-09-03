const mongoose = require("mongoose");


const partnerSchema = new mongoose.Schema(

  {

    // ========================================
    // ORGANIZATION INFORMATION
    // ========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },


    type: {
      type: String,

      enum: [
        "university",
        "industry",
        "ngo",
        "government",
      ],

      required: true,
    },


    description: {
      type: String,
      trim: true,
    },


    location: {
      type: String,
      trim: true,
    },


    email: {
      type: String,
      trim: true,
      lowercase: true,
    },


    website: {
      type: String,
      trim: true,
    },


    // ========================================
    // AI ROUTING PROFILE
    // ========================================
    // These fields power the AI routing engine. When a citizen
    // submits a problem, the engine scores every partner against
    // it and recommends the top 3. `expertise` uses the same
    // canonical category keys as CATEGORY_KEYS in
    // services/aiCategoryService.js so tag matching works.

    expertise: {
      type: [String],
      default: [],
    },

    capabilities: {
      type: [String],
      default: [],
    },

    // Districts where the partner can realistically work on
    // the ground. Empty means "open to problems anywhere in
    // Jharkhand" — no geo penalty either way.

    districtsServed: {
      type: [String],
      default: [],
    },


    // ========================================
    // LOGIN ACCOUNT
    // ========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

  },

  {
    timestamps: true,
  }

);


const Partner = mongoose.model(
  "Partner",
  partnerSchema
);


module.exports = Partner;