// ========================================
// AI DUPLICATE / RECURRING DETECTION SERVICE
// ========================================
// Finds problems near a newly submitted one and
// scores them with a composite Match Score built
// from semantic similarity, geographic proximity,
// and category agreement.
//
// This service only ever *suggests*. Nothing here
// writes isDuplicate / isRecurring / parentProblem —
// those are set exclusively by an admin through the
// AI Review API.

const Problem = require("../models/Problem");

const {
  EMBEDDING_DIMENSIONS,
  getExtractor,
  buildProblemText,
  embedText,
  normalizeVector,
  dotProduct,
} = require("./embeddingModel");

// Category agreement compares a dropdown slug against a display name,
// so both sides have to be folded to one canonical key first.
const { toCategoryKey } = require("./aiCategoryService");

// ========================================
// TUNING CONSTANTS
// ========================================

// Candidate search radius. Civic problems that are the
// same issue are almost always within a few km.
const SEARCH_RADIUS_KM = 5;

const EARTH_RADIUS_KM = 6371;

// Composite Match Score weights. Must sum to 1.
const WEIGHT_SEMANTIC = 0.5;
const WEIGHT_GEO = 0.35;
const WEIGHT_CATEGORY = 0.15;

// A candidate must clear both bars to be suggested.
//
// MATCH_SCORE_THRESHOLD alone is not enough: two unrelated
// problems reported at the same spot in the same category
// already collect WEIGHT_GEO + WEIGHT_CATEGORY = 0.50 for
// free, so geography alone could carry a match. The semantic
// floor makes text similarity necessary, not just helpful.
const MATCH_SCORE_THRESHOLD = 0.75;
const SEMANTIC_SCORE_FLOOR = 0.55;

// Most duplicate reports cluster into a handful of matches.
// More than this is noise for the admin reviewing them.
const MAX_CANDIDATES = 3;

// ========================================
// COSINE SIMILARITY
// ========================================
// Embeddings are stored L2-normalized, so cosine
// similarity is just the dot product.

const calculateCosineSimilarity = (vecA, vecB) => dotProduct(vecA, vecB);

// ========================================
// HAVERSINE DISTANCE
// ========================================
// Great-circle distance between two [longitude, latitude]
// points, in kilometres.

const calculateHaversineDistanceKm = (coord1, coord2) => {
  const [lon1, lat1] = coord1;

  const [lon2, lat2] = coord2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

// ========================================
// INITIALIZE MODEL
// ========================================
// Kept for backward compatibility and for pre-warming
// at server startup. The shared loader does the caching.

const initModel = async () => {
  await getExtractor();
};

// ========================================
// GENERATE EMBEDDING
// ========================================

const generateEmbedding = async (text) => embedText(text);

// ========================================
// GENERATE PROBLEM EMBEDDING
// ========================================
// Single place that decides how a problem's text is
// turned into a vector, so stored embeddings and
// query embeddings always match.

const generateProblemEmbedding = async (title, description) =>
  embedText(buildProblemText(title, description));

// ========================================
// VALIDATE STORED EMBEDDING
// ========================================

const isUsableEmbedding = (embedding) =>
  Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSIONS;

// ========================================
// RESOLVE CANDIDATE EMBEDDING
// ========================================
// Prefers the vector already stored on the problem.
// Only generates one when it is missing or malformed
// (older rows submitted before this feature existed),
// and writes it back so the cost is paid once.

const resolveCandidateEmbedding = async (problem) => {
  if (isUsableEmbedding(problem.embedding)) {
    return problem.embedding;
  }

  try {
    const embedding = await generateProblemEmbedding(
      problem.title,
      problem.description,
    );

    await Problem.updateOne(
      { _id: problem._id },
      { $set: { embedding } },
    );

    console.log("Backfilled missing embedding for problem", String(problem._id));

    return embedding;
  } catch (error) {
    console.error(
      `Failed to generate embedding for problem ${problem._id}:`,
      error.message,
    );

    return [];
  }
};

// ========================================
// FIND NEARBY PROBLEMS
// ========================================
// Geo-first candidate search: everything within
// SEARCH_RADIUS_KM of the given point, excluding the
// problem being analysed.
//
// Deliberately NOT filtered by category. The same
// pothole gets filed under "Transportation" by one
// citizen and "Other" by another; a hard category
// filter would never compare them. Category instead
// contributes to the score below.

const findNearbyProblems = async (longitude, latitude, excludeId) => {
  const radiusRadians = SEARCH_RADIUS_KM / EARTH_RADIUS_KM;

  const center = [longitude, latitude];

  const query = {
    locationPoint: {
      $geoWithin: {
        $centerSphere: [center, radiusRadians],
      },
    },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const problems = await Problem.find(query)
    .select("+embedding")
    .lean();

  console.log(
    `Geo search within ${SEARCH_RADIUS_KM}km of [${longitude}, ${latitude}] returned ${problems.length} problem(s)`,
  );

  return problems;
};

// ========================================
// SCORE A SINGLE CANDIDATE
// ========================================

const scoreCandidate = ({
  candidate,
  candidateEmbedding,
  newEmbedding,
  newCoordinates,
  newCategoryKeys,
}) => {
  const semanticScore = calculateCosineSimilarity(
    newEmbedding,
    candidateEmbedding,
  );

  const distanceKm = calculateHaversineDistanceKm(
    newCoordinates,
    candidate.locationPoint?.coordinates || [0, 0],
  );

  // Linear decay: same spot scores 1, edge of the radius scores 0.
  const geoScore = Math.max(0, 1 - distanceKm / SEARCH_RADIUS_KM);

  // Category agreement, compared as canonical keys on both sides.
  //
  // Two fixes live here. First, the fields speak different vocabularies:
  // `category` holds the citizen's dropdown slug "water" while
  // `aiCategory` holds the display name "Water Management", so comparing
  // them raw made this term dead code. Second, the check is symmetric —
  // the new problem's own aiCategory counts too. Reading only the
  // candidate's meant a match could be rescued when the *other* citizen
  // mis-filed, but not when the submitting one did, which is the case
  // this term was added for.
  const candidateCategories = [
    toCategoryKey(candidate.category),
    toCategoryKey(candidate.aiCategory),
  ].filter(Boolean);

  const categoryScore = candidateCategories.some((key) =>
    newCategoryKeys.includes(key),
  )
    ? 1
    : 0;

  const matchScore =
    WEIGHT_SEMANTIC * semanticScore +
    WEIGHT_GEO * geoScore +
    WEIGHT_CATEGORY * categoryScore;

  return {
    problem: candidate._id,
    title: candidate.title,
    description: candidate.description,
    category: candidate.category,
    status: candidate.status,
    createdAt: candidate.createdAt,

    matchScore,
    semanticScore,
    geoScore,
    categoryScore,
    distanceKm,

    // An already-solved problem coming back is a recurring
    // issue, not a duplicate report.
    matchType: candidate.status === "solved" ? "Recurring" : "Duplicate",
  };
};

// ========================================
// DETECT DUPLICATES
// ========================================
// Returns the top candidate matches for a problem,
// highest Match Score first. Never writes to the
// problem being analysed.
//
// Pass `embedding` when the caller already has the
// problem's vector, to skip regenerating it.

const detectDuplicates = async (newProblem, { embedding } = {}) => {
  if (!newProblem || !newProblem.locationPoint) {
    console.log("Duplicate detection skipped: problem has no locationPoint", {
      problemId: newProblem?._id,
    });

    return [];
  }

  const coordinates = newProblem.locationPoint.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    console.log("Duplicate detection skipped: malformed coordinates", {
      problemId: newProblem._id,
      coordinates,
    });

    return [];
  }

  const [longitude, latitude] = coordinates;

  // [0, 0] is the schema default, which means "never set".
  // It is in the Gulf of Guinea, so it can only produce
  // meaningless matches against other unset rows.
  if (longitude === 0 && latitude === 0) {
    console.log(
      "Duplicate detection skipped: coordinates are unset [0, 0]",
      { problemId: newProblem._id },
    );

    return [];
  }

  console.log("Duplicate detection started", {
    problemId: newProblem._id,
    title: newProblem.title,
    category: newProblem.category,
    longitude,
    latitude,
  });

  const nearbyProblems = await findNearbyProblems(
    longitude,
    latitude,
    newProblem._id,
  );

  if (nearbyProblems.length === 0) {
    console.log(
      `No other problems found within ${SEARCH_RADIUS_KM}km — nothing to compare against`,
    );

    return [];
  }

  // Reuse the caller's vector when it looks valid, otherwise build one.
  const newEmbedding = isUsableEmbedding(embedding)
    ? embedding
    : await generateProblemEmbedding(
        newProblem.title,
        newProblem.description,
      );

  if (!isUsableEmbedding(newEmbedding)) {
    console.error(
      "Duplicate detection aborted: could not build an embedding for the new problem",
    );

    return [];
  }

  const newCategoryKeys = [
    toCategoryKey(newProblem.category),
    toCategoryKey(newProblem.aiCategory),
  ].filter(Boolean);

  const newCoordinates = [longitude, latitude];

  const scored = [];

  for (const candidate of nearbyProblems) {
    const candidateEmbedding = await resolveCandidateEmbedding(candidate);

    scored.push(
      scoreCandidate({
        candidate,
        candidateEmbedding,
        newEmbedding,
        newCoordinates,
        newCategoryKeys,
      }),
    );
  }

  const topCandidates = scored
    .filter(
      (c) =>
        c.matchScore >= MATCH_SCORE_THRESHOLD &&
        c.semanticScore >= SEMANTIC_SCORE_FLOOR,
    )
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_CANDIDATES);

  console.log(
    `Duplicate detection finished: ${topCandidates.length} of ${scored.length} nearby problem(s) cleared the thresholds`,
    topCandidates.map((c) => ({
      id: String(c.problem),
      title: c.title,
      match: c.matchScore.toFixed(3),
      semantic: c.semanticScore.toFixed(3),
      geo: c.geoScore.toFixed(3),
      type: c.matchType,
    })),
  );

  return topCandidates;
};

// ========================================
// CLUSTER SIZE
// ========================================
// Counts how many problems near the given one clear the
// duplicate threshold — i.e. how many citizens reported
// essentially the same issue in the same area. Unlike
// detectDuplicates there is no MAX_CANDIDATES slice: the
// full count feeds the priority score (many reports of the
// same problem should escalate it) and the admin's
// "widespread issue" badge.
//
// Reuses the same thresholds as detectDuplicates so the
// cluster count and the admin's duplicate suggestions stay
// consistent by construction.

const getClusterSize = async (problem) => {
  const candidates = await detectDuplicates(problem);

  // +1 to include the problem itself in the cluster.

  return candidates.length + 1;
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  SEARCH_RADIUS_KM,
  MATCH_SCORE_THRESHOLD,
  SEMANTIC_SCORE_FLOOR,

  initModel,
  generateEmbedding,
  generateProblemEmbedding,
  isUsableEmbedding,
  normalizeVector,
  calculateCosineSimilarity,
  calculateHaversineDistanceKm,
  findNearbyProblems,
  detectDuplicates,
  getClusterSize,
};
