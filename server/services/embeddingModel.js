// ========================================
// SHARED EMBEDDING MODEL
// ========================================
// Both the category classifier and the duplicate
// detector use the same sentence-transformer model.
// Loading it once here keeps a single copy in memory
// instead of one per service.
//
// The loader caches the *promise*, not the resolved
// pipeline. If two requests arrive before the model
// has finished loading, both await the same promise
// instead of each kicking off their own download.

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

// Dimension of all-MiniLM-L6-v2 output vectors.
// Used to sanity-check embeddings loaded from MongoDB.
const EMBEDDING_DIMENSIONS = 384;

let extractorPromise = null;

// ========================================
// GET EXTRACTOR
// ========================================

const getExtractor = () => {
  if (extractorPromise) return extractorPromise;

  extractorPromise = (async () => {
    console.log(`Loading embedding model (${MODEL_NAME})...`);

    const { pipeline } = await import("@huggingface/transformers");

    const extractor = await pipeline("feature-extraction", MODEL_NAME);

    console.log("Embedding model ready.");

    return extractor;
  })();

  // If loading fails, clear the cache so a later request can retry
  // instead of being stuck with a permanently rejected promise.
  extractorPromise.catch(() => {
    extractorPromise = null;
  });

  return extractorPromise;
};

// ========================================
// TEXT PREPROCESSING
// ========================================

const cleanText = (text) => {
  if (!text) return "";

  return String(text).toLowerCase().trim().replace(/\s+/g, " ");
};

// ========================================
// BUILD PROBLEM TEXT
// ========================================
// Title is repeated so it carries more weight in the
// pooled embedding than the longer description.
// Every embedding in the system must be built the same
// way, or stored vectors won't be comparable.

const buildProblemText = (title, description) => {
  const cleanTitle = cleanText(title);

  const cleanDescription = cleanText(description);

  return `${cleanTitle}. ${cleanTitle}. ${cleanDescription}`;
};

// ========================================
// EMBED TEXT
// ========================================
// Returns a single L2-normalized vector.

const embedText = async (text) => {
  const extractor = await getExtractor();

  const output = await extractor(cleanText(text), {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
};

// ========================================
// VECTOR NORMALIZATION
// ========================================

const normalizeVector = (v) => {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));

  if (norm === 0) return v;

  return v.map((x) => x / norm);
};

// ========================================
// DOT PRODUCT
// ========================================
// For L2-normalized vectors this equals cosine similarity.

const dotProduct = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;

  if (a.length !== b.length || a.length === 0) return 0;

  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  MODEL_NAME,
  EMBEDDING_DIMENSIONS,
  getExtractor,
  cleanText,
  buildProblemText,
  embedText,
  normalizeVector,
  dotProduct,
};
