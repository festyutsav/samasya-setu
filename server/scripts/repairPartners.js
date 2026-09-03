// ========================================
// REPAIR PARTNERS (LIVE DB) — EXPLICIT SURGICAL FIXES
// ========================================
// Repairs the damage caused by the over-greedy dedupe run:
//
//   1. Restores "industry" type on five industry partners that
//      were mistyped as "university".
//   2. Untangles "Ranchi University" (currently holding Amity's
//      original login): Ranchi University gets a fresh
//      seed-convention login; Amity University Ranchi is
//      recreated and relinked to its ORIGINAL login.
//   3. Recreates partners lost in the dedupe: Birsa
//      Agricultural University Ranchi, Jharkhand University of
//      Technology Ranchi, Sarala Birla University Ranchi and
//      the Usha Martin industry partner.
//
// Every operation is explicit (no fuzzy matching). Run:
//   node scripts/repairPartners.js

require("dotenv").config();

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const fs = require("fs");

const path = require("path");

const Partner = require("../models/Partner");

const User = require("../models/User");

const { enrichments } = require("./partnerData");

// ========================================
// SEED CONVENTIONS
// ========================================

const parseSeedOrder = () => {
  const source = fs.readFileSync(path.join(__dirname, "seedPartners.js"), "utf8");

  const dataSection = source.split("// SEED FUNCTION")[0];

  const entries = [];

  const pattern = /name:\s*"([^"]+)",\s*\n\s*type:\s*"([^"]+)"/g;

  let match;

  while ((match = pattern.exec(dataSection)) !== null) {
    entries.push({ name: match[1], type: match[2] });
  }

  return entries;
};

const generateUsername = (name, index) => {
  const slug = name

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, "_")

    .replace(/^_|_$/g, "");

  return `${slug}_${String(index).padStart(2, "0")}`;
};

const generateEmail = (name, type) => {
  const slug = name

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, "_")

    .replace(/^_|_$/g, "");

  const domain = type === "university" ? "edu.in" : "com";

  return `${slug}@${domain}`;
};

const generatePassword = (orgName) => {
  const base = orgName

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, "_")

    .slice(0, 8);

  return `${base}@2025`;
};

// ========================================
// MAIN
// ========================================

const repairPartners = async () => {
  const credentialUpdates = new Map();

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const seedOrder = parseSeedOrder();

    const seedMeta = new Map(

      seedOrder.map((entry, i) => [entry.name, { index: i + 1, type: entry.type }]),

    );

    // ========================================
    // 1. RESTORE INDUSTRY TYPE
    // ========================================

    const industryNames = [

      "Tata Steel Limited",

      "Tata Motors Limited",

      "Electrosteel Castings Limited",

      "Uranium Corporation of India Limited",

      "Jindal Steel and Power Limited",

    ];

    for (const name of industryNames) {
      const partner = await Partner.findOne({ name });

      if (!partner) {
        console.log(`  ! ${name}: not found (unexpected).`);

        continue;
      }

      partner.type = "industry";

      await partner.save();

      console.log(`  ✓ Type restored to industry: ${name}`);
    }

    // ========================================
    // 2. UNTANGLE RANCHI UNIVERSITY / AMITY
    // ========================================
    // The "Ranchi University" partner currently holds Amity's
    // original login. Give Ranchi University a fresh
    // seed-convention login, then recreate Amity and relink it
    // to its ORIGINAL user (login continuity preserved).

    const ranchiUniversity = await Partner.findOne({ name: "Ranchi University" });

    const amityUserId = ranchiUniversity?.user;

    if (ranchiUniversity) {
      const ruMeta = seedMeta.get("Ranchi University") || {

        index: seedOrder.length + 1,

        type: "university",

      };

      const ruEmail = generateEmail("Ranchi University", "university");

      let ruUser = await User.findOne({ email: ruEmail });

      if (!ruUser) {
        const ruPassword = generatePassword("Ranchi University");

        ruUser = await User.create({
          username: generateUsername("Ranchi University", ruMeta.index),

          name: "Ranchi University",

          email: ruEmail,

          password: await bcrypt.hash(ruPassword, 12),

          role: "partner",
        });

        credentialUpdates.set("Ranchi University", {
          name: "Ranchi University",

          type: "university",

          username: generateUsername("Ranchi University", ruMeta.index),

          password: ruPassword,

          email: ranchiUniversity.email,

          website: ranchiUniversity.website,
        });
      }

      ranchiUniversity.user = ruUser._id;

      await ranchiUniversity.save();

      console.log("  ✓ Ranchi University relinked to a fresh seed-convention login.");
    }

    // Recreate Amity, relinking its ORIGINAL user.

    if (amityUserId) {
      let amityPartner = await Partner.findOne({ name: "Amity University Ranchi" });

      if (!amityPartner) {
        const data = enrichments["Amity University Ranchi"];

        amityPartner = await Partner.create({
          name: "Amity University Ranchi",

          type: "university",

          description: data.description,

          location: data.location,

          email: data.email,

          website: data.website,

          expertise: data.expertise,

          capabilities: data.capabilities,

          districtsServed: data.districtsServed,

          user: amityUserId,
        });

        console.log("  ✓ Amity University Ranchi recreated with its original login.");
      }
    }

    // ========================================
    // 3. RECREATE LOST PARTNERS
    // ========================================

    const recreate = [

      { name: "Birsa Agricultural University Ranchi", type: "university" },

      { name: "Jharkhand University of Technology Ranchi", type: "university" },

      { name: "Sarala Birla University Ranchi", type: "university" },

      { name: "Usha Martin", type: "industry" },

    ];

    for (const { name, type } of recreate) {
      const existing = await Partner.findOne({ name });

      if (existing) {
        console.log(`  → ${name} already exists, skipping.`);

        continue;
      }

      const data = enrichments[name];

      if (!data) {
        console.log(`  ! No enrichment data for ${name}, skipping.`);

        continue;
      }

      const meta = seedMeta.get(name) || {

        index: seedOrder.length + 1,

        type,

      };

      const email = generateEmail(name, meta.type || type);

      let user = await User.findOne({ email });

      let password = null;

      if (!user) {
        password = generatePassword(name);

        user = await User.create({
          username: generateUsername(name, meta.index),

          name,

          email,

          password: await bcrypt.hash(password, 12),

          role: "partner",
        });
      }

      await Partner.create({
        name,

        type: meta.type || type,

        description: data.description,

        location: data.location,

        email: data.email,

        website: data.website,

        expertise: data.expertise,

        capabilities: data.capabilities,

        districtsServed: data.districtsServed,

        user: user._id,
      });

      if (password) {
        credentialUpdates.set(name, {
          name,

          type: meta.type || type,

          username: generateUsername(name, meta.index),

          password,

          email: data.email,

          website: data.website,
        });
      }

      console.log(`  ✓ Recreated: ${name} (${meta.type || type})`);
    }

    // ========================================
    // 4. MERGE CREDENTIALS FILE
    // ========================================

    const outputPath = path.join(
      __dirname,
      "..",
      "scripts",
      "partner_credentials.json",
    );

    let credentials = [];

    if (fs.existsSync(outputPath)) {
      try {
        credentials = JSON.parse(fs.readFileSync(outputPath, "utf8"));

        if (!Array.isArray(credentials)) {
          credentials = [];
        }
      } catch (parseError) {
        credentials = [];
      }
    }

    // Drop entries for partners that no longer exist and
    // refresh names of survivors.

    const dbPartners = await Partner.find({}).populate("user", "email");

    const dbByEmail = new Map(

      dbPartners

        .filter((partner) => partner.user?.email)

        .map((partner) => [partner.user.email, partner]),

    );

    const kept = credentials.filter(

      (entry) => entry.email && dbByEmail.has(entry.email),

    );

    const keptEmails = new Set(kept.map((entry) => entry.email));

    // Add entries for partners whose credentials are missing
    // (their users were created in this script).

    for (const partner of dbPartners) {
      if (!partner.user?.email || keptEmails.has(partner.user.email)) {
        continue;
      }

      // Partner whose login is not covered by the file: for the
      // relinked/created users we know the generated password.

      const update = credentialUpdates.get(partner.name);

      if (update) {
        kept.push(update);
      } else {
        // Existing user with unknown password (pre-dating this
        // repair): record the entry without a password so the
        // file stays complete; the login itself is unaffected.

        kept.push({
          name: partner.name,

          type: partner.type,

          username: null,

          password: "(unchanged — see prior credentials export)",

          email: partner.email,

          website: partner.website,
        });
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify(kept, null, 2), "utf8");

    console.log("Credentials file reconciled.");

    // ========================================
    // 5. FINAL STATE
    // ========================================

    const finalPartners = await Partner.find({});

    const counts = {};

    finalPartners.forEach((partner) => {
      counts[partner.type] = (counts[partner.type] || 0) + 1;
    });

    console.log("\nFinal state:", counts, "| total:", finalPartners.length);

    // Check for orphaned problem references.

    const problems = mongoose.connection.db.collection("problems");

    const assigned = await problems

      .find({ assignedPartner: { $ne: null } })

      .project({ assignedPartner: 1 })

      .toArray();

    const liveIds = new Set(finalPartners.map((partner) => String(partner._id)));

    const orphans = assigned.filter(

      (problem) => !liveIds.has(String(problem.assignedPartner)),

    );

    console.log(
      `Assigned-problem reference check: ${assigned.length - orphans.length} valid, ${orphans.length} orphaned.`,
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Repair failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

repairPartners();
