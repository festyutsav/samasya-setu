// ========================================
// SAMASYASETU AI SUMMARY SERVICE
// ========================================
// Produces a short, extractive summary of a problem so an
// Admin can triage a queue without reading 500-word
// descriptions.
//
// Deliberately LOCAL and EXTRACTIVE — the same offline
// philosophy as the rest of the platform's AI:
//   - split the description into sentences
//   - score each sentence by informative-term density
//     (numbers, places, category keywords, impact words)
//   - keep the top sentences in original order
//
// Nothing is invented; sentences come straight from the
// citizen's own words. Deterministic: same input, same
// summary.

// ========================================
// TUNING CONSTANTS
// ========================================

const MAX_SUMMARY_SENTENCES = 2;

// Sentences shorter than this are usually fragments
// ("Help us.", "Please sir.") that add nothing.

const MIN_SENTENCE_LENGTH = 25;

// Category vocabulary gets a bonus — a sentence mentioning
// "water", "pipeline" or "contamination" under a Water
// Management problem is more informative than a greeting.

const CATEGORY_TERMS = {
  Agriculture: ["crop", "farm", "farmer", "pest", "irrigation", "harvest", "soil", "seed", "livestock", "kheti", "fasal"],

  Healthcare: ["doctor", "hospital", "medicine", "patient", "health", "clinic", "disease", "treatment", "ambulance", "bimari"],

  Education: ["school", "teacher", "student", "class", "education", "children", "classroom", "college", "padhai"],

  Water: ["water", "pipeline", "borewell", "handpump", "tap", "contaminat", "drinking", "supply", "paani", "leak"],

  Environment: ["pollution", "tree", "forest", "air", "smog", "waste dump", "ecology", "river"],

  Transportation: ["road", "pothole", "traffic", "bus", "transport", "bridge", "highway", "sadak"],

  Energy: ["electricity", "power", "light", "street light", "transformer", "outage", "bijli", "solar"],

  Waste: ["garbage", "trash", "waste", "dump", "sewage", "drain", "toilet", "sanitation", "kachra"],

  Public_Safety: ["accident", "unsafe", "crime", "danger", "safety", "fear", "harassment", "theft"],

  Technology: ["internet", "network", "mobile", "digital", "connectivity", "wifi"],

  Other: [],
};

// Impact words that indicate real consequences.

const IMPACT_TERMS = [
  "affected",
  "suffer",
  "sick",
  "ill",
  "injur",
  "death",
  "died",
  "loss",
  "damage",
  "unsafe",
  "danger",
  "risk",
  "children",
  "women",
  "elderly",
  "pregnant",
  "student",
  "patient",
  "farmer",
  "village",
];

// ========================================
// HELPERS
// ========================================

const splitSentences = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const countTermHits = (sentenceLower, terms) =>
  terms.reduce(
    (hits, term) => (sentenceLower.includes(term) ? hits + 1 : hits),
    0,
  );

// ========================================
// SUMMARIZE
// ========================================

const summarizeProblem = (problem) => {
  const sentences = splitSentences(problem.description).filter(
    (sentence) => sentence.length >= MIN_SENTENCE_LENGTH,
  );

  // Very short descriptions don't need summarizing.

  if (sentences.length === 0) {
    return String(problem.description || "").slice(0, 200);
  }

  if (sentences.length <= MAX_SUMMARY_SENTENCES) {
    return sentences.join(" ");
  }

  const categoryTerms =
    CATEGORY_TERMS[problem.aiCategory] ||
    CATEGORY_TERMS[problem.category] ||
    [];

  const scored = sentences.map((sentence, index) => {
    const sentenceLower = sentence.toLowerCase();

    const categoryHits = countTermHits(sentenceLower, categoryTerms);

    const impactHits = countTermHits(sentenceLower, IMPACT_TERMS);

    const numberHit = /\d/.test(sentence) ? 1 : 0;

    // Position bias: the opening sentence usually states the
    // core problem; later ones often trail into pleas.

    const positionBonus = index === 0 ? 1.5 : index === 1 ? 0.5 : 0;

    const score =
      categoryHits * 2 + impactHits * 1.5 + numberHit + positionBonus;

    return { sentence, index, score };
  });

  const top = scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUMMARY_SENTENCES)
    .sort((a, b) => a.index - b.index); // restore original order

  return top.map((entry) => entry.sentence).join(" ");
};

// ========================================
// PERSIST SUMMARY
// ========================================

const saveSummary = async (problemId, summary) => {
  const Problem = require("../models/Problem");

  await Problem.findByIdAndUpdate(problemId, {
    $set: {
      aiSummary: summary,

      aiSummaryGeneratedAt: new Date(),
    },
  });
};

module.exports = {
  summarizeProblem,
  saveSummary,
};
