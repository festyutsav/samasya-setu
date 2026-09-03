// ========================================
// DUPLICATE DETECTION TEST
// ========================================
// Runs the real embedding model and the real scoring code in
// services/aiDuplicateService.js against a fixed set of cases,
// with the MongoDB layer stubbed out. No database or .env needed.
//
// Use it to check the thresholds still behave after tuning
// SEARCH_RADIUS_KM, the weights, or the two thresholds.
//
// Usage:
//   cd server && node scripts/testDuplicateDetection.js
//
// Exits non-zero if any case fails.

const path = require("path");

const SERVER_ROOT = path.join(__dirname, "..");

const Problem = require(path.join(SERVER_ROOT, "models/Problem"));

let FIXTURES = [];

// ========================================
// STUB THE MONGO LAYER
// ========================================
// Emulates Problem.find(...).select(...).lean() with the same
// $geoWithin + $ne semantics the real query relies on.

Problem.find = (query) => {
  const center = query.locationPoint.$geoWithin.$centerSphere[0];
  const radiusRad = query.locationPoint.$geoWithin.$centerSphere[1];
  const excludeId = query._id?.$ne;

  const R = 6371;

  const dist = (a, b) => {
    const [lon1, lat1] = a;
    const [lon2, lat2] = b;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  const rows = FIXTURES.filter(
    (p) =>
      String(p._id) !== String(excludeId) &&
      dist(center, p.locationPoint.coordinates) <= radiusRad * R,
  );

  return { select: () => ({ lean: async () => rows.map((r) => ({ ...r })) }) };
};

// Embedding backfill writes are a no-op here.
Problem.updateOne = async () => ({ acknowledged: true });

const {
  detectDuplicates,
  generateProblemEmbedding,
  MATCH_SCORE_THRESHOLD,
  SEMANTIC_SCORE_FLOOR,
} = require(path.join(SERVER_ROOT, "services/aiDuplicateService"));

// ========================================
// FIXTURES
// ========================================

// Ranchi, Jharkhand — [longitude, latitude]
const BASE = [85.3096, 23.3441];

// 0.005 degrees of latitude is roughly 550 m
const near = (dLon, dLat) => [BASE[0] + dLon, BASE[1] + dLat];

// `category` and `aiCategory` deliberately speak different vocabularies,
// the way real rows do: `category` holds the citizen's dropdown slug
// ("water") and `aiCategory` holds the classifier's display label
// ("Water Management"). Setting them equal — as this harness used to —
// hides the cross-category case entirely.
const P = (
  id,
  title,
  description,
  category,
  aiCategory,
  coordinates,
  status = "submitted",
) => ({
  _id: id,
  title,
  description,
  category,
  aiCategory,
  status,
  locationPoint: { type: "Point", coordinates },
  embedding: [],
});

const run = async () => {
  console.log(
    `thresholds: matchScore >= ${MATCH_SCORE_THRESHOLD}, semantic >= ${SEMANTIC_SCORE_FLOOR}\n`,
  );

  const cases = [
    {
      name: "TRUE DUPLICATE — same issue, same street, same category",
      expect: "MATCH",
      subject: P(
        "new1",
        "Handpump in ward 5 is giving dirty water",
        "The handpump near our ward 5 street is releasing yellow contaminated water. Families have no clean drinking water.",
        "water",
        "Water Management",
        near(0, 0),
      ),
      others: [
        P(
          "old1",
          "Dirty water coming from ward 5 handpump",
          "Contaminated yellow water is coming out of the handpump in ward 5. Residents cannot drink it safely.",
          "water",
          "Water Management",
          near(0.004, 0.004),
        ),
      ],
    },
    {
      name: "CROSS-CATEGORY DUPLICATE — same issue, citizen picked wrong category",
      expect: "MATCH",
      expectCategoryScore: 1,
      // The citizen filed this under "Other" but the classifier read it as
      // Water Management. The candidate is filed correctly. Only the
      // canonical-key comparison can see they agree, so this case is what
      // proves the category term is not dead code — expect cat=1.
      subject: P(
        "new2",
        "Handpump in ward 5 is giving dirty water",
        "The handpump near our ward 5 street is releasing yellow contaminated water. Families have no clean drinking water.",
        "other",
        "Water Management",
        near(0, 0),
      ),
      others: [
        P(
          "old2",
          "Dirty water coming from ward 5 handpump",
          "Contaminated yellow water is coming out of the handpump in ward 5. Residents cannot drink it safely.",
          "water",
          "Water Management",
          near(0.002, 0.002),
        ),
      ],
    },
    {
      name: "LEGACY CANDIDATE — slug-only row must still agree with a classified label",
      expect: "MATCH",
      // `aiCategory` defaults to null, so rows submitted before the
      // classifier existed carry only the dropdown slug "water". Agreeing
      // with the subject's classified label "Water Management" is only
      // possible once both sides fold to a canonical key — this case is
      // what the slug-vs-label fix exists for. Expect cat=1.
      expectCategoryScore: 1,
      subject: P(
        "new3",
        "Handpump in ward 5 is giving dirty water",
        "The handpump near our ward 5 street is releasing yellow contaminated water. Families have no clean drinking water.",
        "other",
        "Water Management",
        near(0, 0),
      ),
      others: [
        P(
          "old3",
          "Dirty water coming from ward 5 handpump",
          "Contaminated yellow water is coming out of the handpump in ward 5. Residents cannot drink it safely.",
          "water",
          null,
          near(0.002, 0.002),
        ),
      ],
    },
    {
      name: "RECURRING — near-identical report against an already-solved problem",
      expect: "MATCH (Recurring)",
      subject: P(
        "new4",
        "Garbage is piling up near the market again",
        "The garbage dump near the main market has not been cleared for two weeks and it smells terrible.",
        "waste",
        "Waste Management",
        near(0, 0),
      ),
      others: [
        P(
          "old4",
          "Garbage piling up near main market",
          "Waste is not being collected near the main market for many days and the smell is unbearable.",
          "waste",
          "Waste Management",
          near(0.003, 0.001),
          "solved",
        ),
      ],
    },
    {
      name: "NEGATIVE — unrelated problems at the SAME spot, same category",
      expect: "NO MATCH (this is what the semantic floor guards)",
      // Worst case for the floor on purpose: identical location and
      // identical category hand out WEIGHT_GEO + WEIGHT_CATEGORY = 0.50
      // for free, so only the semantic score can keep these apart.
      subject: P(
        "new5",
        "Streetlight near the bus stand is broken",
        "The streetlight at the bus stand has not worked for a month and the area is pitch dark at night.",
        "other",
        "Other",
        near(0, 0),
      ),
      others: [
        P(
          "old5",
          "Stray dogs are attacking children",
          "A pack of stray dogs near the colony gate has bitten two children this month. Nobody is catching them.",
          "other",
          "Other",
          near(0, 0),
        ),
      ],
    },
    {
      name: "NEGATIVE — same issue but 40 km away (outside the radius)",
      expect: "NO MATCH",
      subject: P(
        "new6",
        "Handpump giving dirty water",
        "The handpump is releasing yellow contaminated water and families have no clean drinking water.",
        "water",
        "Water Management",
        near(0, 0),
      ),
      others: [
        P(
          "old6",
          "Handpump giving dirty water",
          "The handpump is releasing yellow contaminated water and families have no clean drinking water.",
          "water",
          "Water Management",
          near(0.4, 0.36),
        ),
      ],
    },
    {
      name: "EDGE — coordinates never set [0,0] must be skipped, not matched",
      expect: "NO MATCH",
      subject: P(
        "new7",
        "Some problem",
        "Some description here.",
        "other",
        "Other",
        [0, 0],
      ),
      others: [
        P(
          "old7",
          "Some problem",
          "Some description here.",
          "other",
          "Other",
          [0, 0],
        ),
      ],
    },
  ];

  let pass = 0;
  let fail = 0;

  for (const c of cases) {
    FIXTURES = c.others;

    // Pre-compute stored embeddings for the "existing" rows the way
    // createProblem would have, so we exercise the reuse path.
    for (const o of FIXTURES) {
      o.embedding = await generateProblemEmbedding(o.title, o.description);
    }

    const subjectEmbedding = await generateProblemEmbedding(
      c.subject.title,
      c.subject.description,
    );

    const results = await detectDuplicates(c.subject, {
      embedding: subjectEmbedding,
    });

    const matched = results.length > 0;
    const wantMatch = c.expect.startsWith("MATCH");

    // Some cases also assert the category term. A match/no-match assertion
    // alone cannot see the 0.15 category weight silently collapsing to 0 —
    // which is precisely how the slug-vs-label mismatch survived unnoticed.
    const categoryOk =
      c.expectCategoryScore === undefined ||
      results.every((r) => r.categoryScore === c.expectCategoryScore);

    const ok = matched === wantMatch && categoryOk;

    ok ? pass++ : fail++;

    console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}`);
    console.log(`      expected: ${c.expect}`);

    if (!categoryOk) {
      console.log(
        `      FAILED:   expected categoryScore=${c.expectCategoryScore} on every candidate`,
      );
    }

    if (results.length === 0) {
      console.log("      got:      no candidates");
    } else {
      results.forEach((r) =>
        console.log(
          `      got:      "${r.title}"  match=${r.matchScore.toFixed(3)}  semantic=${r.semanticScore.toFixed(3)}  geo=${r.geoScore.toFixed(3)}  cat=${r.categoryScore}  dist=${r.distanceKm.toFixed(2)}km  type=${r.matchType}`,
        ),
      );
    }
    console.log("");
  }

  console.log(`========================================`);
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
};

run().catch((e) => {
  console.error("harness error:", e);
  process.exit(1);
});
