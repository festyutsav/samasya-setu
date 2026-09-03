// ========================================
// AI PRIORITY SCORING TEST SCRIPT
// ========================================
// Labelled cases asserting that representative problems
// land in the expected priority band. Pure function test —
// no database required.
//
// Run:  node scripts/testPriorityScoring.js

const { scorePriority } = require("../services/aiPriorityService");

const now = new Date();

const CASES = [
  {
    name: "Critical contamination, 2000 affected, 4-report cluster",

    problem: {
      title: "Drinking water contaminated",

      description:
        "Tap water smells and is yellow. Several people have fallen ill.",

      severity: "critical",

      affectedPeople: 2000,

      clusterSize: 4,

      status: "submitted",

      createdAt: now,
    },

    expectBand: "urgent",

    expectMinScore: 70,
  },
  {
    name: "High severity crop loss, 500 affected, single report",

    problem: {
      title: "Paddy crop destroyed by pests",

      description: "Insects damaged the standing paddy crop.",

      severity: "high",

      affectedPeople: 500,

      clusterSize: 1,

      status: "submitted",

      createdAt: now,
    },

    expectBand: "elevated",

    expectMinScore: 45,
  },
  {
    name: "Medium pothole, few affected, fresh single report",

    problem: {
      title: "Pothole on main road",

      description: "A pothole is damaging vehicles near the bus stop.",

      severity: "medium",

      affectedPeople: 50,

      clusterSize: 1,

      status: "under_review",

      createdAt: now,
    },

    expectBand: "standard",

    expectMaxScore: 44,
  },
  {
    name: "Low severity signage issue, stale single report ages up only slightly",

    problem: {
      title: "Old signboard fallen",

      description: "The village signboard fell down last week.",

      severity: "low",

      affectedPeople: 0,

      clusterSize: 1,

      status: "under_review",

      createdAt: new Date(now.getTime() - 30 * 86_400_000),
    },

    expectBand: "standard",

    expectMaxScore: 44,
  },
  {
    name: "Medium severity with 5-report cluster escalates without age",

    problem: {
      title: "Street lights not working",

      description:
        "Street lights on the main road are off for weeks, unsafe at night.",

      severity: "medium",

      affectedPeople: 300,

      clusterSize: 5,

      status: "under_review",

      createdAt: now,
    },

    expectBand: "elevated",

    expectMinScore: 45,
  },
];

const run = () => {
  let pass = 0;

  let fail = 0;

  for (const testCase of CASES) {
    const result = scorePriority(testCase.problem);

    let ok = result.band === testCase.expectBand;

    if (ok && testCase.expectMinScore !== undefined) {
      ok = result.score >= testCase.expectMinScore;
    }

    if (ok && testCase.expectMaxScore !== undefined) {
      ok = result.score <= testCase.expectMaxScore;
    }

    console.log(
      `${ok ? "PASS" : "FAIL"} — ${testCase.name}: ${result.score}/100 (${result.band}) — ${result.breakdown}`,
    );

    if (ok) pass += 1;
    else fail += 1;
  }

  console.log(`\n${pass} passed, ${fail} failed of ${CASES.length}.`);

  if (fail > 0) process.exitCode = 1;
};

run();
