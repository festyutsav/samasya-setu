// ========================================
// SAMASYASETU AI PRIORITY SERVICE
// ========================================
// Scores every problem 0-100 and assigns a band
// (standard / elevated / urgent) so the Admin queue can
// be triaged by urgency instead of arrival order.
//
// Composite of four signals, all already collected by the
// platform — no new citizen inputs required:
//   1. Severity   — the citizen's own assessment
//   2. Scale      — how many people are affected
//   3. Cluster    — how many citizens reported the same
//                   issue nearby (from duplicate detection;
//                   many reports of one problem = escalation)
//   4. Wait age   — time spent unreviewed; nothing should
//                   sit at the bottom of the queue forever
//
// Everything is local and deterministic — same inputs,
// same score — matching the platform's offline AI approach.
// Suggestions only: Admins still decide review order.

// ========================================
// TUNING CONSTANTS
// ========================================

// Max contribution of each signal to the 0-100 score.

const MAX_SEVERITY_POINTS = 45;
const MAX_SCALE_POINTS = 25;
const MAX_CLUSTER_POINTS = 20;
const MAX_AGE_POINTS = 10;

// Age accrual: 2 points per full day waiting, capped.

const AGE_POINTS_PER_DAY = 2;

// Band thresholds on the final 0-100 score.

const URGENT_THRESHOLD = 70;
const ELEVATED_THRESHOLD = 45;

// Severity → points. The citizen's report is trusted but
// critical problems must not max the whole score alone —
// they leave room for scale + cluster to separate two
// critical reports.

const SEVERITY_POINTS = {
  low: 10,
  medium: 22,
  high: 36,
  critical: MAX_SEVERITY_POINTS,
};

// ========================================
// SCALE SCORE
// ========================================
// Log-10 scaling: 10 people ≈ 8 pts, 100 ≈ 17, 1,000 ≈ 25,
// 10,000+ saturates the cap. Linear would make "2,000
// affected" and "200,000 affected" indistinguishable at 25
// points while crushing everything under 500 to noise.

const getScalePoints = (affectedPeople) => {
  if (!affectedPeople || affectedPeople <= 1) return 0;

  const normalized = Math.log10(affectedPeople) / 4; // log10(10000) = 4

  return Math.min(MAX_SCALE_POINTS, normalized * MAX_SCALE_POINTS);
};

// ========================================
// CLUSTER SCORE
// ========================================
// First confirmation beyond self adds the largest jump
// (0 → 1 report is the strongest escalation signal); each
// additional report adds less, saturating at 5 reports.

const getClusterPoints = (clusterSize) => {
  if (!clusterSize || clusterSize <= 1) return 0;

  const extraReports = Math.min(clusterSize - 1, 4);

  return MAX_CLUSTER_POINTS * (1 - Math.pow(0.7, extraReports));
};

// ========================================
// AGE SCORE
// ========================================
// Only unreviewed problems accrue wait points — once an
// admin has triaged (under_review counts as seen), the
// queue-pressure signal should decay away.

const getAgePoints = (problem) => {
  const isWaiting = problem.status === "submitted";

  if (!isWaiting || !problem.createdAt) return 0;

  const daysWaiting = Math.floor(
    (Date.now() - new Date(problem.createdAt).getTime()) / 86_400_000,
  );

  return Math.min(MAX_AGE_POINTS, daysWaiting * AGE_POINTS_PER_DAY);
};

// ========================================
// SCORE A PROBLEM
// ========================================
// Works on a Mongoose document or a plain object (for the
// test script). Returns { score, band, breakdown } where
// breakdown is human-readable so the admin UI can explain
// WHY a problem is urgent.

const scorePriority = (problem) => {
  const severityKey = SEVERITY_POINTS[problem.severity] !== undefined
    ? problem.severity
    : "medium";

  const severityPoints = SEVERITY_POINTS[severityKey];

  const scalePoints = getScalePoints(problem.affectedPeople);

  const clusterPoints = getClusterPoints(problem.clusterSize);

  const agePoints = getAgePoints(problem);

  const rawScore =
    severityPoints + scalePoints + clusterPoints + agePoints;

  const score = Math.round(Math.min(100, rawScore));

  const band =
    score >= URGENT_THRESHOLD
      ? "urgent"
      : score >= ELEVATED_THRESHOLD
        ? "elevated"
        : "standard";

  // ---- EXPLAINABILITY ----

  const parts = [];

  parts.push(
    `${severityKey} severity`,
  );

  if (problem.affectedPeople > 0) {
    parts.push(`${problem.affectedPeople.toLocaleString("en-IN")} affected`);
  }

  if ((problem.clusterSize || 0) > 1) {
    parts.push(`${problem.clusterSize} reports in this area`);
  }

  const daysWaiting = problem.createdAt
    ? Math.floor(
        (Date.now() - new Date(problem.createdAt).getTime()) / 86_400_000,
      )
    : 0;

  if (daysWaiting >= 1 && problem.status === "submitted") {
    parts.push(`waiting ${daysWaiting} day${daysWaiting === 1 ? "" : "s"}`);
  }

  return {
    score,

    band,

    breakdown: parts.join(" · "),
  };
};

// ========================================
// PERSIST PRIORITY
// ========================================

const savePriorityAnalysis = async (problemId, { score, band, breakdown }) => {
  const Problem = require("../models/Problem");

  await Problem.findByIdAndUpdate(problemId, {
    $set: {
      aiPriorityScore: score,

      aiPriorityBand: band,

      aiPriorityBreakdown: breakdown,

      aiPriorityAnalyzedAt: new Date(),
    },
  });
};

// ========================================
// PERSIST CLUSTER SIZE
// ========================================

const saveClusterSize = async (problemId, clusterSize) => {
  const Problem = require("../models/Problem");

  await Problem.findByIdAndUpdate(problemId, {
    $set: { clusterSize },
  });
};

// ========================================
// SCORE AND SAVE (PIPELINE HELPER)
// ========================================
// One call for the submission pipeline and the admin
// refresh endpoint: persists cluster size + priority in
// one go. `problem` must be a saved document with _id.

const analyzeAndSavePriority = async (problem, { clusterSize } = {}) => {
  if (clusterSize !== undefined) {
    await saveClusterSize(problem._id, clusterSize);

    problem.clusterSize = clusterSize;
  }

  const result = scorePriority(problem);

  await savePriorityAnalysis(problem._id, result);

  return result;
};

module.exports = {
  URGENT_THRESHOLD,
  ELEVATED_THRESHOLD,
  MAX_SEVERITY_POINTS,
  MAX_SCALE_POINTS,
  MAX_CLUSTER_POINTS,
  MAX_AGE_POINTS,

  scorePriority,
  savePriorityAnalysis,
  saveClusterSize,
  analyzeAndSavePriority,
};
