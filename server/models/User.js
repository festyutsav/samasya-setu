const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },


    // ========================================
    // USER ROLE
    // ========================================

    role: {
      type: String,

      enum: [
        "citizen",
        "partner",
        "admin",
      ],

      default: "citizen",
    },


    // ========================================
    // LINK TO PARTNER ORGANIZATION
    // ========================================

    partner: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Partner",

      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);


const User = mongoose.model(
  "User",
  userSchema
);


module.exports = User;