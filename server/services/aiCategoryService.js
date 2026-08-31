// ========================================
// SAMASYASETU AI CATEGORY SERVICE
// Example-based prototype embeddings
// ========================================

let extractor = null;
let cachedCategoryEmbeddings = null;

// ========================================
// OFFICIAL CATEGORIES (ONLY THESE)
// ========================================

const categories = [
  {
    name: "Agriculture",
    examples: [
      "Crop damage due to insects",
      "Farm irrigation is not working",
      "Farmers are facing water shortage",
      "Cattle disease is spreading",
      "Agricultural land is flooded",
      "Seeds are unavailable",
    ],
  },

  {
    name: "Healthcare",
    examples: [
      "Hospital has no doctors",
      "Medicine is unavailable",
      "Health center is closed",
      "Pregnant women cannot get treatment",
      "Ambulance is not available",
      "People are suffering from disease",
    ],
  },

  {
    name: "Education",
    examples: [
      "School building is damaged",
      "Teachers are absent",
      "Students have no classrooms",
      "College lacks facilities",
      "School has no electricity",
      "Children cannot attend school",
    ],
  },

  {
    name: "Water Management",
    examples: [
      "Drinking water is contaminated",
      "Handpump is broken",
      "Village has no water supply",
      "Flooding during rain",
      "Drainage is blocked",
      "Water is overflowing into houses",
    ],
  },

  {
    name: "Environment",
    examples: [
      "Air pollution is increasing",
      "Trees are being cut",
      "Forest area is damaged",
      "River pollution",
      "Illegal mining is harming nature",
      "Plastic pollution everywhere",
    ],
  },

  {
    name: "Transportation",
    examples: [
      "Road is badly damaged",
      "Bridge has collapsed",
      "Vehicles cannot pass",
      "Large potholes on the road",
      "Bus does not reach the village",
      "Road becomes unusable during monsoon",
    ],
  },

  {
    name: "Energy",
    examples: [
      "Electricity cuts frequently",
      "Transformer is damaged",
      "Street lights are not working",
      "Village has no power supply",
      "Power outage for many hours",
      "Electric poles are damaged",
    ],
  },

  {
    name: "Waste Management",
    examples: [
      "Garbage is not collected",
      "Waste is dumped near houses",
      "Overflowing dustbins",
      "Open garbage attracts animals",
      "No sanitation cleaning",
      "Plastic waste everywhere",
    ],
  },

  {
    name: "Public Safety",
    examples: [
      "Frequent road accidents",
      "Dangerous crossing",
      "Crime is increasing",
      "Street is unsafe at night",
      "Fire safety equipment is missing",
      "Emergency services are unavailable",
    ],
  },

  {
    name: "Technology",
    examples: [
      "Internet is not working",
      "Mobile network is weak",
      "Digital services are unavailable",
      "Computer lab is broken",
      "Online services keep failing",
      "WiFi is unavailable",
    ],
  },

  {
    name: "Other",
    examples: [
      "Community issue not matching other categories",
      "General public problem",
      "Local issue needing attention",
    ],
  },
];

// ========================================
// AVERAGE EMBEDDINGS
// ========================================

const averageVectors = (vectors) => {
  const length = vectors[0].length;

  const avg = new Array(length).fill(0);

  vectors.forEach((vector) => {
    for (let i = 0; i < length; i++) {
      avg[i] += vector[i];
    }
  });

  for (let i = 0; i < length; i++) {
    avg[i] /= vectors.length;
  }

  return avg;
};

// ========================================
// LOAD MODEL ONCE
// ========================================

const initModel = async () => {
  if (extractor && cachedCategoryEmbeddings) return;

  console.log("Loading SamasyaSetu AI model...");

  const { pipeline } = await import("@huggingface/transformers");

  extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  cachedCategoryEmbeddings = [];

  for (const category of categories) {
    const output = await extractor(category.examples, {
      pooling: "mean",
      normalize: true,
    });

    const vectors = output.tolist();

    cachedCategoryEmbeddings.push(averageVectors(vectors));
  }

  console.log("SamasyaSetu AI ready.");
};

// ========================================
// COSINE SIMILARITY
// ========================================

const dotProduct = (a, b) => {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
};

// ========================================
// PREDICT CATEGORY
// ========================================

const predictCategory = async (title, description) => {
  if (!title || !description) {
    throw new Error("Title and description are required.");
  }

  await initModel();

  const userText = `${title}. ${description}`;

  const output = await extractor(userText, {
    pooling: "mean",
    normalize: true,
  });

  const userEmbedding = Array.from(output.data);

  const results = categories.map((category, index) => ({
    category: category.name,
    score: dotProduct(
      userEmbedding,
      cachedCategoryEmbeddings[index]
    ),
  }));

  results.sort((a, b) => b.score - a.score);

  const best = results[0];
  const second = results[1];

  const margin = best.score - second.score;

  let suggestionLevel = "strong";

  if (best.score < 0.30) {
    suggestionLevel = "uncertain";
  } else if (margin < 0.05) {
    suggestionLevel = "moderate";
  }

  return {
  category:
    suggestionLevel === "uncertain"
      ? "Other"
      : best.category,

  confidence:
    Number(best.score.toFixed(3)),

  margin:
    Number(margin.toFixed(3)),

  suggestionLevel,
};
};

module.exports = {
  predictCategory,
};