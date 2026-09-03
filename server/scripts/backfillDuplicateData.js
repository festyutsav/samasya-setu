// ========================================
// BACKFILL DUPLICATE DETECTION DATA
// ========================================
// One-off maintenance script.
//
// Problems created before duplicate detection shipped have
// no `locationPoint` (so the $geoWithin candidate search can
// never match them) and no `embedding` (so semantic scoring
// has nothing to compare). This fills both in from data the
// rows already have.
//
// Safe to re-run: it only writes fields that are missing,
// and it never deletes anything.
//
// Usage:
//   cd server && node scripts/backfillDuplicateData.js

const dotenv = require("dotenv");

dotenv.config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Problem = require("../models/Problem");

const {
  generateProblemEmbedding,
  isUsableEmbedding,
} = require("../services/aiDuplicateService");

// ========================================
// COORDINATE HELPERS
// ========================================

const hasRealCoordinates = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  Number.isFinite(coordinates[0]) &&
  Number.isFinite(coordinates[1]) &&
  !(coordinates[0] === 0 && coordinates[1] === 0);

// ========================================
// MAIN
// ========================================

const run = async () => {
  await connectDB();

  // ========================================
  // ENSURE THE 2DSPHERE INDEX EXISTS
  // ========================================
  // The geo candidate search needs it; older databases were
  // created before the index was declared on the schema.

  console.log("Syncing indexes...");

  await Problem.syncIndexes();

  console.log("Indexes synced.\n");

  // `embedding` is select: false, so ask for it explicitly.
  const problems = await Problem.find().select("+embedding");

  console.log(`Found ${problems.length} problem(s) to check.\n`);

  const summary = {
    locationPointAdded: 0,
    embeddingAdded: 0,
    alreadyComplete: 0,
    missingCoordinates: [],
    failed: [],
  };

  for (const problem of problems) {
    const updates = {};

    // ========================================
    // LOCATION POINT
    // ========================================

    if (!hasRealCoordinates(problem.locationPoint?.coordinates)) {
      const latitude = Number(problem.locationDetails?.latitude);

      const longitude = Number(problem.locationDetails?.longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        // GeoJSON order is [longitude, latitude].
        updates.locationPoint = {
          type: "Point",
          coordinates: [longitude, latitude],
        };

        summary.locationPointAdded += 1;
      } else {
        // Submitted before the map picker was required. Nothing
        // to derive coordinates from — duplicate detection will
        // keep skipping this one.
        summary.missingCoordinates.push({
          id: String(problem._id),
          title: problem.title,
        });
      }
    }

    // ========================================
    // EMBEDDING
    // ========================================

    if (!isUsableEmbedding(problem.embedding)) {
      try {
        updates.embedding = await generateProblemEmbedding(
          problem.title,
          problem.description,
        );

        summary.embeddingAdded += 1;
      } catch (error) {
        summary.failed.push({
          id: String(problem._id),
          title: problem.title,
          reason: error.message,
        });
      }
    }

    // ========================================
    // WRITE
    // ========================================

    if (Object.keys(updates).length === 0) {
      summary.alreadyComplete += 1;

      continue;
    }

    await Problem.updateOne({ _id: problem._id }, { $set: updates });

    console.log(
      `Updated "${problem.title}" (${Object.keys(updates).join(", ")})`,
    );
  }

  // ========================================
  // SUMMARY
  // ========================================

  console.log("\n========================================");
  console.log("BACKFILL SUMMARY");
  console.log("========================================");
  console.log(`Problems checked:        ${problems.length}`);
  console.log(`locationPoint added:     ${summary.locationPointAdded}`);
  console.log(`embedding added:         ${summary.embeddingAdded}`);
  console.log(`Already complete:        ${summary.alreadyComplete}`);

  if (summary.missingCoordinates.length > 0) {
    console.log(
      `\nSkipped — no coordinates to derive (${summary.missingCoordinates.length}):`,
    );

    summary.missingCoordinates.forEach((p) =>
      console.log(`  - ${p.id}  ${p.title}`),
    );

    console.log(
      "\n  These problems have no latitude/longitude at all, so duplicate",
    );
    console.log(
      "  detection cannot place them. Re-submit them with the map picker,",
    );
    console.log("  or set locationDetails.latitude/longitude manually.");
  }

  if (summary.failed.length > 0) {
    console.log(`\nEmbedding failures (${summary.failed.length}):`);

    summary.failed.forEach((p) =>
      console.log(`  - ${p.id}  ${p.title}  →  ${p.reason}`),
    );
  }

  console.log("\nDone.");
};

run()
  .then(async () => {
    await mongoose.connection.close();

    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\nBackfill failed:", error);

    await mongoose.connection.close();

    process.exit(1);
  });
