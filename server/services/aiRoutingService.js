// ========================================
// SAMASYASETU AI ROUTING SERVICE
// ========================================
// When a citizen submits a problem, this engine recommends
// the top 3 partner organizations (universities / industries)
// whose expertise best matches the problem.
//
// Scoring blends three signals:
//   1. Expertise match (dominant): the problem's AI category
//      against each partner's expertise tags, refined by an
//      embedding-similarity term between the problem text and
//      the partner's description + expertise vocabulary.
//   2. Geographic fit: does the partner serve the problem's
//      district?
//   3. Semantic fallback: for partners without the category
//      tag, embedding similarity can still surface them when
//      their description is clearly on-topic.
//
// The output is explainable — every recommendation carries a
// human-readable reason so an Admin (and a jury) can see WHY
// an organization was suggested.

const Partner = require("../models/Partner");
const { toCategoryKey } = require("./aiCategoryService");
const {
  getExtractor,
  cleanText,
  dotProduct,
} = require("./embeddingModel");

// ========================================
// SCORING WEIGHTS
// ========================================
// Expertise decides; geography and capability fit refine;
// raw text similarity only breaks ties or rescues
// untagged-but-relevant partners.

const WEIGHT_EXPERTISE = 0.55;
const WEIGHT_GEO = 0.15;
const WEIGHT_SEMANTIC = 0.15;
const WEIGHT_ALIGNMENT = 0.15;

// Direct category-tag hits get this multiplier confidence —
// a tagged partner should almost always outrank a
// semantic-only match.

const TAG_HIT_BONUS = 0.15;

// ========================================
// WORK-PHASE INFERENCE (UNIVERSITY-INDUSTRY FIT)
// ========================================
// University-industry collaboration research (OECD, TRL /
// technology-readiness-level literature, UIIN success-factor
// studies) consistently shows academia and industry operate
// at different ends of the innovation life cycle: universities
// lead early-stage research, surveys and analysis, while
// industry dominates prototyping, field deployment and
// funding. Classifying the problem's dominant work phase lets
// the engine prefer the partner type naturally positioned for
// that phase instead of treating both as interchangeable.

const PHASE_KEYWORDS = {
  research: [
    "study", "research", "survey", "analyze", "analysis", "analyse",
    "investigate", "assess", "assessment", "evaluate", "monitor",
    "mapping", "data collection", "identify", "understand", "document",
    "report", "strategy", "policy", "plan",
  ],

  prototyping: [
    "prototype", "build", "design", "develop", "fabricate", "manufacture",
    "construct", "create", "product", "device", "application", "app",
    "platform", "tool", "equipment", "system",
  ],

  deployment: [
    "deploy", "install", "roll out", "rollout", "implement",
    "implementation", "pilot", "field trial", "scale up", "scale-up",
    "distribute", "maintain", "operate", "fund", "funding", "budget",
    "sponsor", "afford",
  ],
};

// Problems whose text matches no phase keywords get a neutral
// score for every partner, so the phase term never distorts
// unclear cases.

const detectWorkPhase = (problem) => {
  const title = String(problem.title || "").toLowerCase();
  const description = String(problem.description || "").toLowerCase();

  const scores = {};

  for (const [phase, keywords] of Object.entries(PHASE_KEYWORDS)) {
    let hits = 0;

    for (const keyword of keywords) {
      // Title hits count double — the citizen's own summary is
      // the strongest signal of what kind of work is wanted.

      const titleHits = title.split(keyword).length - 1;

      const descriptionHits = description.split(keyword).length - 1;

      hits += titleHits * 2 + descriptionHits;
    }

    scores[phase] = hits;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // Need at least one keyword hit to declare a phase.

  if (sorted[0][1] === 0) {
    return { phase: null, scores };
  }

  return { phase: sorted[0][0], scores };
};

// Partner types naturally positioned per phase.

const PHASE_TYPE_PREFERENCE = {
  research: "university",
  prototyping: "industry",
  deployment: "industry",
};

// ========================================
// CAPABILITY FIT
// ========================================
// Maps detected problem needs onto the canonical capability
// tags partners are seeded with, so "needs a prototype built
// and field-tested" actually surfaces partners whose
// capabilities say prototyping / field_surveys.

const NEED_CAPABILITY_MAP = {
  prototyping: ["prototyping", "manufacturing", "innovation_labs"],

  manufacturing: ["manufacturing", "prototyping"],

  funding: ["funding"],

  field_surveys: ["field_surveys", "data_analysis"],

  research_development: ["research_development", "data_analysis", "innovation_labs"],

  data_analysis: ["data_analysis", "research_development"],

  training: ["training", "field_surveys"],
};

const NEED_KEYWORDS = {
  prototyping: ["prototype", "build", "design", "develop", "fabricate", "manufacture", "device", "product", "equipment"],

  manufacturing: ["manufacture", "fabricat", "production", "assembly"],

  funding: ["fund", "budget", "sponsor", "financ", "afford", "cost", "csr"],

  field_surveys: ["survey", "field visit", "on-site", "on site", "ground level", "ground-level", "door to door", "door-to-door"],

  research_development: ["research", "study", "investigate", "experiment", "innovation", "rd "],

  data_analysis: ["data", "analytic", "dashboard", "analysis", "predict", "model", "statistics"],

  training: ["train", "workshop", "skill development", "awareness", "capacity building", "teach"],
};

const detectProblemNeeds = (problem) => {
  const text = `${String(problem.title || "")} ${String(problem.description || "")}`.toLowerCase();

  const needs = [];

  for (const [need, keywords] of Object.entries(NEED_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      needs.push(need);
    }
  }

  return needs;
};

const getCapabilityScore = (partner, needs) => {
  if (needs.length === 0) return 0;

  const capabilities = new Set(partner.capabilities || []);

  const covered = needs.filter((need) =>
    (NEED_CAPABILITY_MAP[need] || []).some((capability) =>
      capabilities.has(capability),
    ),
  );

  return covered.length / needs.length;
};

// Cosine similarities from MiniLM on short texts rarely
// exceed ~0.7, so stretch the semantic term to use the full
// 0-1 range.

const SEMANTIC_SCALE = 1 / 0.7;

// ========================================
// PARTNER PROFILE VECTORS
// ========================================
// One embedding per partner, built from its description +
// expertise labels. Cached in memory keyed by partner _id +
// updatedAt so profile edits invalidate naturally.

let partnerVectorCache = new Map();

const buildPartnerProfileText = (partner) => {
  const expertiseText = (partner.expertise || [])
    .map((tag) => tag.replace(/_/g, " "))
    .join(", ");

  const capabilityText = (partner.capabilities || [])
    .map((tag) => tag.replace(/_/g, " "))
    .join(", ");

  return `${partner.description || ""} Expertise: ${expertiseText}. Capabilities: ${capabilityText}. Type: ${partner.type}.`;
};

const getPartnerVector = async (partner, extractor) => {
  const cacheKey = `${partner._id}:${partner.updatedAt}`;

  const cached = partnerVectorCache.get(cacheKey);

  if (cached) return cached;

  const output = await extractor(cleanText(buildPartnerProfileText(partner)), {
    pooling: "mean",
    normalize: true,
  });

  const vector = Array.from(output.data);

  // Keep the cache bounded — re-seeding 40 partners shouldn't
  // grow it without limit.

  if (partnerVectorCache.size > 500) {
    partnerVectorCache = new Map();
  }

  partnerVectorCache.set(cacheKey, vector);

  return vector;
};

// ========================================
// GEO SCORE
// ========================================

const normalizeDistrict = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const getGeoScore = (partner, problem) => {
  const problemDistrict = normalizeDistrict(
    problem.locationDetails?.district || problem.location,
  );

  if (!problemDistrict) return 0;

  // Districts the partner explicitly serves.

  const served = (partner.districtsServed || []).map(normalizeDistrict);

  if (served.some((district) => problemDistrict.includes(district) || district.includes(problemDistrict))) {
    return 1;
  }

  // A partner headquartered in the problem's district counts
  // even if districtsServed was never filled in.

  const partnerLocation = normalizeDistrict(partner.location);

  if (partnerLocation && problemDistrict.split(" ").some((word) => word.length > 3 && partnerLocation.includes(word))) {
    return 0.8;
  }

  // Partners serving anywhere statewide get a modest credit —
  // relevant, just not local.

  if (partnerLocation.includes("jharkhand")) {
    return 0.4;
  }

  return 0;
};

// ========================================
// COMPLEMENTARY MIX IN TOP RESULTS
// ========================================
// Collaboration research is unambiguous that strong
// university-industry partnerships pair complementary
// organizations rather than clones. When the inferred phase
// favors one partner type and the whole top slice came out
// same-type, the weakest slot is swapped for the
// highest-scoring partner of the complementary type — but
// only if it is still a defensible match (at least half the
// top score), never a token invite.

const ensureComplementaryMix = (scored, limit, phase) => {
  if (!phase || limit < 2 || scored.length <= limit) {
    return scored.slice(0, limit);
  }

  const preferredType = PHASE_TYPE_PREFERENCE[phase];

  const top = scored.slice(0, limit);

  const allSameType = top.every((entry) => entry.type === preferredType);

  if (!allSameType) {
    return top;
  }

  const complement = scored
    .slice(limit)
    .find(
      (entry) =>
        entry.type !== preferredType &&
        entry.matchScore >= top[0].matchScore * 0.5,
    );

  if (!complement) {
    return top;
  }

  return [
    ...top.slice(0, limit - 1),

    complement,
  ];
};

// ========================================
// RECOMMEND PARTNERS
// ========================================
// `problem` may be a Mongoose document or a plain object;
// only title/description/category/aiCategory/location(Details)
// are read. Returns the top `limit` (default 3) matches with
// score breakdowns.

const recommendPartners = async (problem, { limit = 3 } = {}) => {
  const partners = await Partner.find({});

  if (partners.length === 0) {
    return { suggestions: [], message: "No partner organizations registered yet." };
  }

  const extractor = await getExtractor();

  // The problem's text embedding — same pooling scheme as the
  // rest of the system so all vectors are comparable.

  const problemText = `${problem.title}. ${problem.title}. ${problem.description}`;

  const problemOutput = await extractor(cleanText(problemText), {
    pooling: "mean",
    normalize: true,
  });

  const problemVector = Array.from(problemOutput.data);

  // The problem's canonical category — AI's guess wins, the
  // citizen's dropdown is the fallback.

  const problemCategory = toCategoryKey(
    problem.aiCategory || problem.category,
  );

  // ---- UNIVERSITY-INDUSTRY ALIGNMENT ----
  // One pass over the problem text: which work phase does it
  // imply, and which concrete capabilities does it need?

  const { phase } = detectWorkPhase(problem);

  const needs = detectProblemNeeds(problem);

  const scored = [];

  for (const partner of partners) {
    // ---- EXPERTISE MATCH ----

    const partnerTags = (partner.expertise || []).map(toCategoryKey);

    const hasTag = partnerTags.includes(problemCategory);

    const partnerVector = await getPartnerVector(partner, extractor);

    const semanticScore =
      dotProduct(problemVector, partnerVector) * SEMANTIC_SCALE;

    // A tag hit anchors the expertise score near the top and
    // lets semantic similarity fine-tune it. Without the tag,
    // semantics alone decide (capped lower so untagged partners
    // can't outrank tagged ones on vibes).

    const expertiseScore = hasTag
      ? Math.min(1, 0.85 + semanticScore * 0.15)
      : Math.min(0.7, Math.max(0, semanticScore));

    // ---- GEO MATCH ----

    const geoScore = getGeoScore(partner, problem);

    // ---- ALIGNMENT SCORE (PHASE + CAPABILITY FIT) ----
    // Half the term rewards partners whose declared
    // capabilities cover the problem's concrete needs; the
    // other half rewards the partner type the innovation
    // lifecycle naturally positions for this phase. With no
    // detectable phase every partner gets a neutral 0.5 on the
    // type half, so unclear problems are not distorted.

    const capabilityScore = getCapabilityScore(partner, needs);

    const typePhaseFit =
      phase === null
        ? 0.5
        : partner.type === PHASE_TYPE_PREFERENCE[phase]
          ? 1
          : 0.25;

    const alignmentScore = 0.5 * capabilityScore + 0.5 * typePhaseFit;

    // ---- TOTAL ----

    const matchScore =
      WEIGHT_EXPERTISE * expertiseScore +
      WEIGHT_GEO * geoScore +
      WEIGHT_SEMANTIC * semanticScore +
      WEIGHT_ALIGNMENT * alignmentScore +
      (hasTag ? TAG_HIT_BONUS : 0);

    // ---- EXPLAINABILITY ----

    const reasonParts = [];

    if (hasTag) {
      reasonParts.push(
        `${problemCategory.replace(/_/g, " ")} listed in ${partner.name.split(" ")[0]}'s expertise`,
      );
    } else if (semanticScore > 0.5) {
      reasonParts.push("closely related research profile");
    }

    if (geoScore >= 0.8) {
      reasonParts.push("works in this district");
    } else if (geoScore >= 0.4) {
      reasonParts.push("operates in Jharkhand");
    }

    if (phase !== null && partner.type === PHASE_TYPE_PREFERENCE[phase]) {
      const phaseLabel =
        phase === "research"
          ? "research-oriented institution fits this study phase"
          : phase === "prototyping"
            ? "prototyping / product development strength"
            : "deployment and field implementation strength";

      reasonParts.push(phaseLabel);
    }

    if (needs.length > 0 && capabilityScore > 0) {
      const coveredCapabilities = [
        ...new Set(
          needs.flatMap((need) => NEED_CAPABILITY_MAP[need] || []),
        ),
      ].filter((capability) => (partner.capabilities || []).includes(capability));

      if (coveredCapabilities.length > 0) {
        reasonParts.push(
          `${coveredCapabilities.slice(0, 2).map((capability) => capability.replace(/_/g, " ")).join(", ")}`,
        );
      }
    }

    const topCapability = (partner.capabilities || [])[0];

    if (reasonParts.length === 0 && topCapability) {
      reasonParts.push(topCapability.replace(/_/g, " "));
    }

    scored.push({
      partner: partner._id,

      type: partner.type,

      matchScore: Number(matchScore.toFixed(3)),

      expertiseScore: Number(expertiseScore.toFixed(3)),

      geoScore: Number(geoScore.toFixed(3)),

      semanticScore: Number(semanticScore.toFixed(3)),

      capabilityScore: Number(capabilityScore.toFixed(3)),

      categoryMatched: hasTag,

      reason: reasonParts.join(" · ") || "general capability match",
    });
  }

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const top = ensureComplementaryMix(scored, limit, phase);

  if (top.length === 0 || top[0].matchScore <= 0) {
    return { suggestions: [], message: "No matching organizations found." };
  }

  return { suggestions: top, message: null };
};

// ========================================
// RECOMMENDATIONS DTO
// ========================================
// Hydrates partner references with the fields the client
// renders — used by the submission response so the citizen
// immediately sees the top-3 matches.

const POPULATE_FIELDS =
  "name type location description email website expertise capabilities districtsServed";

const toSuggestionDTOs = async (suggestions) => {
  const ids = suggestions.map((s) => s.partner);

  const partners = await Partner.find({ _id: { $in: ids } }).select(
    POPULATE_FIELDS,
  );

  const byId = new Map(partners.map((p) => [String(p._id), p]));

  return suggestions
    .map((s) => {
      const partner = byId.get(String(s.partner));

      if (!partner) return null;

      return {
        partner,

        matchScore: s.matchScore,

        expertiseScore: s.expertiseScore,

        geoScore: s.geoScore,

        categoryMatched: s.categoryMatched,

        reason: s.reason,
      };
    })
    .filter(Boolean);
};

// ========================================
// PERSIST ROUTING ANALYSIS
// ========================================
// Snapshot pattern identical to duplicate detection: refs +
// scores stored on the problem so the Admin review UI can
// read them later without recomputing.

const saveRoutingAnalysis = async (problemId, suggestions) => {
  const Problem = require("../models/Problem");

  await Problem.findByIdAndUpdate(problemId, {
    $set: {
      aiRoutingCandidates: suggestions.map((s) => ({
        partner: s.partner,

        matchScore: s.matchScore,

        expertiseScore: s.expertiseScore,

        geoScore: s.geoScore,

        categoryMatched: s.categoryMatched,

        reason: s.reason,
      })),

      aiRoutingAnalyzedAt: new Date(),
    },
  });
};

module.exports = {
  recommendPartners,
  toSuggestionDTOs,
  saveRoutingAnalysis,
};
