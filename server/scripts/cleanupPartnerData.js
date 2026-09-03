// ========================================
// PARTNER REGISTRY CLEANUP
// ========================================
// One-time cleanup for the demo dataset:
//   1. Deletes dummy partner orgs with no linked login
//      (out-of-state IITs/NITs, "abc", duplicate short-name
//      entries like "Tata Steel Limited" with demo users).
//   2. Removes the demo users attached to those orgs.
//   3. Backfills user.partner on every remaining partner
//      login so the partner portal + notifications work.
//
// Every partner org that survives keeps its own login
// account and full AI routing profile.
//
// Usage: node server/scripts/cleanupPartnerData.js
// ========================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const path = require("path");

const User = require(path.join(__dirname, "..", "models", "User"));
const Partner = require(path.join(__dirname, "..", "models", "Partner"));

const cleanup = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const partners = await Partner.find({}).populate("user", "_id name");

    // ========================================
    // STEP 1: DELETE DUMMY PARTNERS
    // ========================================
    // A partner without a linked login is either a duplicate
    // of a full-name entry or an out-of-state dummy (IIT
    // Bombay, IIT Delhi, "abc", ...). The curated registry
    // from seedPartners.js always has a login attached.

    const dummyPartners = partners.filter((partner) => !partner.user);

    console.log(`\nDeleting ${dummyPartners.length} dummy partner orgs (no linked login):`);

    for (const partner of dummyPartners) {
      console.log(`  ✗ ${partner.name} [${partner.type}]`);

      await Partner.deleteOne({ _id: partner._id });
    }

    // ========================================
    // STEP 2: DELETE ORPHANED / DEMO LOGIN USERS
    // ========================================
    // Demo users from entries like "Tata Steel Limited"
    // (tatasteel.partner.demo@example.com) and "abc".

    const survivingPartners = await Partner.find({}).populate("user", "_id");

    const keepUserIds = new Set(
      survivingPartners
        .filter((partner) => partner.user)
        .map((partner) => String(partner.user._id)),
    );

    const partnerUsers = await User.find({ role: "partner" }).select("name email");

    let deletedUsers = 0;

    for (const user of partnerUsers) {
      if (!keepUserIds.has(String(user._id))) {
        console.log(`  ✗ user: ${user.name} <${user.email}>`);

        await User.deleteOne({ _id: user._id });

        deletedUsers += 1;
      }
    }

    console.log(`\nDeleted ${deletedUsers} orphaned/demo partner users.`);

    // ========================================
    // STEP 3: BACKFILL user.partner LINKS
    // ========================================
    // seedPartners.js set partner.user but never user.partner,
    // so the partner portal and notifyPartnerUser() silently
    // failed for every seeded organization.

    console.log("\nBackfilling user.partner links...");

    let linked = 0;

    for (const partner of survivingPartners) {
      if (!partner.user) continue;

      await User.updateOne(
        { _id: partner.user._id },
        { $set: { partner: partner._id } },
      );

      linked += 1;

      console.log(`  ✓ ${partner.name} → login linked`);
    }

    console.log(`\nLinked ${linked} partner logins to their organizations.`);

    const [partnerCount, partnerUserCount] = await Promise.all([
      Partner.countDocuments(),
      User.countDocuments({ role: "partner" }),
    ]);

    console.log("\n========================================");
    console.log("PARTNER REGISTRY CLEANED");
    console.log("========================================");
    console.log(`Partner orgs:            ${partnerCount}`);
    console.log(`Partner login accounts:  ${partnerUserCount}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

cleanup();
