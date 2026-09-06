// ========================================
// ENRICH PARTNERS (LIVE DB)
// ========================================
// Applies partnerData.js to the existing database WITHOUT
// touching partner login continuity:
//
//   1. Updates enriched profiles (description, website,
//      contact email, location, expertise, capabilities,
//      districts) matched by exact partner name.
//   2. Creates the new partner organizations (research labs,
//      government agencies, NGOs) together with their login
//      accounts, using the exact same username / email /
//      password conventions as seedPartners.js and the same
//      index offsets, so a future seed run produces identical
//      accounts.
//   3. Removes factually incorrect partners (see removals) and
//      their login accounts.
//   4. Merges credentials into partner_credentials.json so the
//      admin credentials download stays consistent.
//
// Run:  node scripts/enrichPartners.js

require("dotenv").config();

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const fs = require("fs");

const path = require("path");

const Partner = require("../models/Partner");

const User = require("../models/User");

const { enrichments, removals, additions } = require("./partnerData");

// ========================================
// SEED CONVENTIONS (must match seedPartners.js)
// ========================================
// seedPartners.js seeds 30 universities + 17 industries with
// index = position in the full list. Additions continue after
// that list, so their indices start at 48. Removals are
// skipped during creation but their original indices are not
// reused, keeping every existing login stable.

const BASE_PARTNER_COUNT = 47;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ========================================
// NAME NORMALIZATION
// ========================================
// The live database contains older name variants ("Tata Steel"
// vs the seed's "Tata Steel Limited"). Matching ignores
// "Limited"/"Ltd", "&" vs "and" and punctuation so every
// enrichment lands on the right partner regardless.

const normalizeName = (name) =>
  name

    .toLowerCase()

    .replace(/&/g, " and ")

    .replace(/\b(limited|ltd)\b/g, "")

    .replace(/[^a-z0-9]+/g, " ")

    .trim();

// ========================================
// CANONICAL SEED ORDER
// ========================================
// Parses seedPartners.js to learn each canonical partner's
// position in the seed list, so partners missing from the live
// DB are created with usernames identical to what the next
// seed run would generate.

const parseSeedOrder = () => {
  const source = fs.readFileSync(path.join(__dirname, "seedPartners.js"), "utf8");

  const dataSection = source.split("// SEED FUNCTION")[0];

  const entries = [];

  const pattern =

    /name:\s*"([^"]+)",\s*\n\s*type:\s*"([^"]+)"/g;

  let match;

  while ((match = pattern.exec(dataSection)) !== null) {
    entries.push({ name: match[1], type: match[2] });
  }

  return entries;
};

// ========================================
// MAIN
// ========================================

const enrichPartners = async () => {
  let created = 0;

  let updated = 0;

  let removed = 0;

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const seedOrder = parseSeedOrder();

    const seedMeta = new Map(

      seedOrder.map((entry, i) => [entry.name, { index: i + 1, type: entry.type }]),

    );

    const allPartners = await Partner.find({});

    const byNormalized = new Map(

      allPartners.map((partner) => [normalizeName(partner.name), partner]),

    );

    // Credentials for partners created by this run (so the
    // credentials file can be merged without printing secrets).

    const freshCredentials = new Map();

    // ========================================
    // 1. REMOVE FACTUALLY INCORRECT PARTNERS
    // ========================================

    const removalNormalized = new Set(removals.map(normalizeName));

    for (const [key, partner] of [...byNormalized.entries()]) {
      if (!removalNormalized.has(key)) {
        continue;
      }

      if (partner.user) {
        const removedUser = await User.findById(partner.user);

        if (removedUser && removedUser.role === "partner") {
          await User.findByIdAndDelete(partner.user);
        }
      }

      await Partner.findByIdAndDelete(partner._id);

      byNormalized.delete(key);

      removed += 1;

      console.log(`  - Removed: ${partner.name}`);
    }

    // ========================================
    // 2. APPLY ENRICHMENTS TO EXISTING PARTNERS
    // ========================================
    // Partners are matched by normalized name so older DB name
    // variants still receive the verified profile. Matched
    // partners are renamed to the canonical name and missing
    // canonical partners are created with their seed-order
    // login credentials. Login accounts and partner IDs of
    // existing partners are never changed.

    for (const [name, data] of Object.entries(enrichments)) {
      const key = normalizeName(name);

      let partner = byNormalized.get(key);

      if (!partner) {
        // Canonical partner missing from the live DB: create it
        // exactly as the next seed run would.

        const meta = seedMeta.get(name) || {

          index: seedOrder.length + 1,

          type: "university",

        };

        const username = generateUsername(name, meta.index);

        const password = generatePassword(name);

        const email = generateEmail(name, meta.type);

        const hashedPassword = await bcrypt.hash(password, 12);

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username,

            name,

            email,

            password: hashedPassword,

            role: "partner",
          });
        }

        partner = await Partner.create({
          name,

          type: meta.type,

          description: data.description,

          location: data.location,

          email: data.email,

          website: data.website,

          expertise: data.expertise,

          capabilities: data.capabilities,

          districtsServed: data.districtsServed,

          user: user._id,
        });

        await User.findByIdAndUpdate(user._id, {

          partner: partner._id,

        });

        byNormalized.set(key, partner);

        freshCredentials.set(name, {
          name,

          type: meta.type,

          username,

          password,

          email: data.email,

          website: data.website,
        });

        created += 1;

        console.log(`  ✓ Created missing canonical partner: ${name}`);

        continue;
      }

      partner.name = name;

      partner.description = data.description;

      partner.website = data.website;

      partner.expertise = data.expertise;

      partner.capabilities = data.capabilities;

      partner.districtsServed = data.districtsServed;

      if (data.location) {
        partner.location = data.location;
      }

      if (data.email) {
        partner.email = data.email;
      }

      await partner.save();

      updated += 1;

      console.log(`  ✓ Enriched: ${name}`);
    }

    // ========================================
    // 3. CREATE NEW PARTNERS + LOGIN ACCOUNTS
    // ========================================

    for (let i = 0; i < additions.length; i++) {
      const data = additions[i];

      const index = BASE_PARTNER_COUNT + i + 1;

      const username = generateUsername(data.name, index);

      const password = generatePassword(data.name);

      const email = generateEmail(data.name, data.type);

      const hashedPassword = await bcrypt.hash(password, 12);

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          username,

          name: data.name,

          email,

          password: hashedPassword,

          role: "partner",
        });
      }

      let partner = await Partner.findOne({ name: data.name });

      if (!partner) {
        partner = await Partner.create({
          name: data.name,

          type: data.type,

          description: data.description,

          location: data.location,

          email: data.email,

          website: data.website,

          expertise: data.expertise || [],

          capabilities: data.capabilities || [],

          districtsServed: data.districtsServed || [],

          user: user._id,
        });

        await User.findByIdAndUpdate(user._id, {

          partner: partner._id,

        });

        created += 1;

        console.log(`  ✓ Created: ${data.name} (${data.type})`);
      } else {
        // Partner already exists (e.g. BIT Sindri re-run):
        // refresh profile, keep login link.

        partner.description = data.description;

        partner.location = data.location;

        partner.website = data.website;

        partner.expertise = data.expertise || [];

        partner.capabilities = data.capabilities || [];

        partner.districtsServed = data.districtsServed || [];

        if (!partner.user) {
          partner.user = user._id;
        }

        await partner.save();

        console.log(`  → ${data.name} already exists, profile refreshed.`);
      }

      await sleep(100);
    }

    // ========================================
    // 4. MERGE CREDENTIALS FILE
    // ========================================
    // The credentials file belongs to the app's own tooling
    // (admin credentials download). Entries are merged in
    // place; secrets are never printed to the console.

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
        console.log("  ! Credentials file unreadable, rebuilding entries.");

        credentials = [];
      }
    }

    const credByNormalized = new Map(

      credentials.map((entry) => [normalizeName(entry.name), entry]),

    );

    for (const name of removals) {
      credByNormalized.delete(normalizeName(name));
    }

    for (const [name, data] of Object.entries(enrichments)) {
      const key = normalizeName(name);

      const entry = credByNormalized.get(key);

      if (entry) {
        entry.name = name;

        entry.website = data.website;

        if (data.email) {
          entry.email = data.email;
        }
      } else if (freshCredentials.has(name)) {
        credByNormalized.set(key, freshCredentials.get(name));
      }
    }

    for (let i = 0; i < additions.length; i++) {
      const data = additions[i];

      const index = BASE_PARTNER_COUNT + i + 1;

      credByNormalized.set(normalizeName(data.name), {
        name: data.name,

        type: data.type,

        username: generateUsername(data.name, index),

        password: generatePassword(data.name),

        email: data.email,

        website: data.website,
      });
    }

    fs.writeFileSync(
      outputPath,

      JSON.stringify([...credByNormalized.values()], null, 2),

      "utf8",
    );

    console.log("Credentials file merged.");

    console.log(
      `\nEnrichment complete: ${updated} enriched, ${created} created, ${removed} removed.`,
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Enrichment failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

enrichPartners();
