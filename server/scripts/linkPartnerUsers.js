// ========================================
// LINK PARTNER USERS (LIVE DB)
// ========================================
// One-off repair: partner login resolves the user's
// organization through the User.partner field (populated in
// authController). Accounts created or relinked by the
// enrichment scripts never received this link, so their
// logins were rejected with "No organization is linked to
// this account."
//
// For every partner with a login account this script sets
// User.partner to that partner's _id (idempotent), and clears
// stale links that point at deleted partners.
//
// Run:  node scripts/linkPartnerUsers.js

require("dotenv").config();

const mongoose = require("mongoose");

const Partner = require("../models/Partner");

const User = require("../models/User");

const linkPartnerUsers = async () => {
  let linked = 0;

  let verified = 0;

  let cleared = 0;

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const partners = await Partner.find({}).populate("user");

    const livePartnerIds = new Set(

      partners.map((partner) => String(partner._id)),

    );

    for (const partner of partners) {
      if (!partner.user) {
        console.log(`  ! ${partner.name}: no login account linked.`);

        continue;
      }

      const user = partner.user;

      if (user.partner && livePartnerIds.has(String(user.partner))) {
        if (String(user.partner) === String(partner._id)) {
          verified += 1;
        } else {
          // Points at another live partner: repoint to the
          // partner that owns this login.

          await User.findByIdAndUpdate(user._id, {

            partner: partner._id,

          });

          linked += 1;

          console.log(`  ↺ Repointed: ${user.email} → ${partner.name}`);
        }

        continue;
      }

      if (user.partner) {
        console.log(

          `  ✕ Cleared stale link on ${user.email} (partner no longer exists)`,

        );

        cleared += 1;
      }

      await User.findByIdAndUpdate(user._id, {

        partner: partner._id,

      });

      linked += 1;

      console.log(`  ✓ Linked: ${user.email} → ${partner.name}`);
    }

    console.log(
      `\nLink complete: ${linked} linked/repointed, ${verified} already correct, ${cleared} stale links cleared.`,
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Link failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

linkPartnerUsers();
