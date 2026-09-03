// ========================================
// RECOVER PARTNER PASSWORDS (LIVE DB)
// ========================================
// The credentials vault (partner_credentials.json) lost the
// plaintext passwords for 49 partners during the enrichment
// reconciliation — their entries read "(unchanged — see prior
// credentials export)". Bcrypt is one-way, so the plaintext
// cannot be read back directly.
//
// Recovery strategy per partner:
//   1. Candidate A: the explicit password in seedPartners.js
//      data (some partners override the convention, e.g.
//      "cuj@2025").
//   2. Candidate B: the deterministic seed convention
//      generatePassword() — slugified name sliced to 8 chars
//      + "@2025".
//   Each candidate is bcrypt-compared against the live hash.
//   On a match the plaintext is written back to the vault.
//   Only if BOTH fail is the password reset to Candidate A —
//   guaranteeing the vault, the database and future seed runs
//   all agree.
//
// Run:  node scripts/recoverPartnerPasswords.js

require("dotenv").config();

const fs = require("fs");

const path = require("path");

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const CREDENTIALS_PATH = path.join(__dirname, "partner_credentials.json");

const SEED_PATH = path.join(__dirname, "seedPartners.js");

// Pull explicit name -> password overrides out of the seed
// source (each seed object declares `name` then `password`).

const extractSeedPasswords = () => {
  const source = fs.readFileSync(SEED_PATH, "utf8");

  const namePattern = /name:\s*"((?:[^"\\]|\\.)*)"/g;

  const passwords = new Map();

  let match;

  while ((match = namePattern.exec(source)) !== null) {
    const name = match[1];

    const nextName = namePattern.exec(source);

    const windowEnd = nextName ? nextName.index : source.length;

    namePattern.lastIndex = match.index + match[0].length;

    const window = source.slice(match.index, windowEnd);

    const passwordMatch = window.match(/password:\s*"([^"]+)"/);

    if (passwordMatch) {
      passwords.set(name, passwordMatch[1]);
    }
  }

  return passwords;
};

const generatePassword = (orgName) => {

  const base = orgName

    .toLowerCase()

    .replace(/[^a-z0-9]+/g, "_")

    .slice(0, 8);

  return `${base}@2025`;
};

// Same normalization the seed/enrich scripts use for name
// matching (the vault may hold older name variants).

const normalizeName = (name) =>

  name

    .toLowerCase()

    .replace(/\blimited\b|\bltd\b/g, "")

    .replace(/&/g, "and")

    .replace(/[^a-z0-9]+/g, "");

const recoverPartnerPasswords = async () => {
  let recovered = 0;

  let reset = 0;

  let alreadyOk = 0;

  let failed = 0;

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const users = mongoose.connection.db.collection("users");

    const partners = mongoose.connection.db.collection("partners");

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

    const seedPasswords = extractSeedPasswords();

    // Live lookup map: normalized partner name -> user doc.

    const liveUsers = new Map();

    const partnerDocs = await partners

      .find({ user: { $ne: null } })

      .toArray();

    for (const partner of partnerDocs) {
      const user = await users.findOne({ _id: partner.user });

      if (user) {
        liveUsers.set(normalizeName(partner.name), user);
      }
    }

    console.log(

      `Vault entries: ${credentials.length}, seed overrides found: ${seedPasswords.size}, live partner logins: ${liveUsers.size}\n`,

    );

    for (const entry of credentials) {
      const needsRecovery =

        !entry.password || entry.password.includes("unchanged");

      if (!needsRecovery) {
        alreadyOk += 1;

        continue;
      }

      const candidates = [];

      if (seedPasswords.has(entry.name)) {
        candidates.push(seedPasswords.get(entry.name));
      }

      const convention = generatePassword(entry.name);

      if (!candidates.includes(convention)) {
        candidates.push(convention);
      }

      const user =

        liveUsers.get(normalizeName(entry.name)) ||

        (await users.findOne({ email: entry.email }));

      if (!user) {
        console.log(`  ✕ ${entry.name}: no linked login user found`);

        failed += 1;

        continue;
      }

      let matched = null;

      for (const candidate of candidates) {
        if (await bcrypt.compare(candidate, user.password)) {
          matched = candidate;

          break;
        }
      }

      if (matched) {
        entry.password = matched;

        recovered += 1;

        console.log(`  ✓ Recovered: ${entry.name}`);
      } else {
        const fallback = candidates[0];

        const hashed = await bcrypt.hash(fallback, 12);

        await users.updateOne(

          { _id: user._id },

          { $set: { password: hashed } },

        );

        entry.password = fallback;

        reset += 1;

        console.log(`  ↺ Reset to convention: ${entry.name}`);
      }
    }

    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));

    console.log(
      `\nDone: ${recovered} recovered, ${reset} reset, ${alreadyOk} already had plaintext, ${failed} failed.`,
    );

    await mongoose.disconnect();

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Recovery failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

recoverPartnerPasswords();
