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