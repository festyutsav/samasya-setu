// ========================================
// SAMASYASETU AI CATEGORY SERVICE
// ========================================
// Scores a citizen's problem against a bank of example complaints
// per category and returns the closest one.
//
// Scoring is MAX-similarity against individual examples, blended with
// the category centroid. Averaging the examples into a single prototype
// (the earlier approach) destroyed the signal: "Street light not working"
// matched the Energy example "The street light is not working" almost
// exactly, but that example got diluted by the transformer / voltage /
// power-cut examples, and Transportation won on the word "street".
//
// See scripts/testCategoryPrediction.js for the labelled accuracy set.

const {
  getExtractor,
  cleanText,
  normalizeVector,
  dotProduct,
} = require("./embeddingModel");

// ========================================
// SCORING CONSTANTS
// ========================================
// WEIGHT_MAX dominates so that one closely matching example is enough
// to win a category. The centroid term is kept as a stabiliser: without
// it a single oddly worded example could carry a category on its own.
// Both weights were picked by sweeping them over the labelled set in
// scripts/testCategoryPrediction.js.

const WEIGHT_MAX = 0.7;
const WEIGHT_CENTROID = 0.3;

// Keyword agreement is a small tie-breaker for domain vocabulary the
// embedding model handles poorly (Hinglish, local terms). Capped low so
// the embeddings still decide.
const KEYWORD_BOOST_PER_MATCH = 0.03;
const KEYWORD_BOOST_MAX = 0.08;

// Confidence bands. Calibrated against the labelled set, where accuracy
// came out at roughly 92% / 83% / 50% for the three bands. The margin
// between the top two categories separates right from wrong far better
// than the absolute score does, so it gates each band too.
const STRONG_SCORE = 0.45;
const STRONG_MARGIN = 0.09;
const UNCERTAIN_SCORE = 0.32;
const UNCERTAIN_MARGIN = 0.04;

// Below this many words a description carries too little signal to trust.
const MIN_DESCRIPTION_WORDS = 4;

let cachedCategoryVectors = null;

// ========================================
// OFFICIAL CATEGORIES (ONLY THESE)
// ========================================
// Every example is a phrasing a citizen might actually submit. Because
// scoring is max-over-examples, adding a phrasing for an uncovered
// sub-issue directly improves accuracy for that sub-issue — this list is
// the main tuning knob for the feature.
//
// Hinglish lines are deliberate: Jharkhand citizens type "bijli nahi aa
// rahi" and "nali jam ho gayi hai", and those score poorly against
// English-only examples.
//
// Keep categories mutually exclusive. Streetlights live in Energy only
// (an electrical asset failure); Transportation must not carry a
// streetlight example or the two will compete forever.

const categories = [
  {
    name: "Agriculture",
    examples: [
      "Insects and pests have damaged the standing crop",
      "Our paddy crop is destroyed by disease",
      "Farm irrigation pump is not working",
      "The irrigation canal is dry and fields get no water",
      "Farmers are facing severe water shortage for their fields",
      "Cattle are falling sick and disease is spreading in livestock",
      "Agricultural land is flooded and crops are submerged",
      "Certified seeds are not available at the depot",
      "Fertilizer and urea subsidy is not reaching farmers",
      "Crop prices are too low and farmers are making losses",
      "Tractor and farm equipment subsidy application is stuck",
      "Wild elephants are destroying our crops at night",
      "Soil has become infertile and yield is dropping",
      "Cold storage for vegetables is not available nearby",
      "Kisan Credit Card loan has not been approved",
      "Mandi is not buying our produce at the support price",
      "Kheti ke liye paani nahi mil raha",
      "Fasal kharab ho gayi hai keede se",
    ],
  },

  {
    name: "Healthcare",
    examples: [
      "The hospital has no doctors on duty",
      "The doctor at the health sub centre is absent most days",
      "Basic medicines are out of stock at the PHC",
      "The health centre stays closed during working hours",
      "Pregnant women are not getting treatment or checkups",
      "No ambulance was available during an emergency",
      "A disease is spreading and many people have fallen ill",
      "The vaccination camp was cancelled without notice",
      "The government hospital lacks basic equipment and beds",
      "There is no blood available at the blood bank",
      "Malaria and dengue cases are rising in our area",
      "Children are suffering from malnutrition",
      "The Anganwadi centre is not giving nutrition supplements",
      "Ayushman card treatment is being refused by the hospital",
      "Patients have to travel very far for dialysis or surgery",
      "The maternity ward has no nurse at night",
      "Aspatal mein dawai nahi hai",
      "Doctor nahi aate hain health centre mein",
    ],
  },

  {
    name: "Education",
    examples: [
      "The school building is damaged and unsafe for children",
      "The classroom roof is leaking and plaster is falling down",
      "Teachers are absent and do not come to school",
      "Our school has no teacher for the whole class",
      "Students have no classrooms and sit outside",
      "The college lacks laboratories and library facilities",
      "The school has no electricity or fans",
      "Children are unable to attend school regularly",
      "There are no proper toilets for girls in the school",
      "The mid day meal quality is very poor",
      "Textbooks and uniforms have not been distributed",
      "The scholarship amount has not come to students",
      "There is no computer or smart class facility in the school",
      "The school has no drinking water for students",
      "The hostel for tribal students is in bad condition",
      "There is no high school nearby and children drop out",
      "School mein master nahi aate",
      "Mid day meal ki khichdi kharab hai",
      "Bacchon ko khichdi mein kankad mila",
    ],
  },

  {
    name: "Water Management",
    examples: [
      "The drinking water is contaminated and unsafe",
      "Dirty yellow smelly water is coming from the tap",
      "The handpump is broken and not giving water",
      "The village has no piped water supply at all",
      "There is flooding and waterlogging during rain",
      "The drain is blocked and choked with silt",
      "Water is overflowing and entering our houses",
      "The water tanker does not arrive on time",
      "Sewage water is mixing with the drinking water line",
      "The water pipeline has burst and water is being wasted",
      "The borewell has dried up and the water table has fallen",
      "The overhead water tank is not being cleaned",
      "The village pond and well are full of filth",
      "There is no water in the taps for many days",
      "Water supply comes only for a few minutes a day",
      "The check dam is damaged and not holding water",
      "Nal se ganda paani aa raha hai",
      "Chapakal kharab hai, paani nahi mil raha",
      "Nali jam ho gayi hai",
    ],
  },

  {
    name: "Environment",
    examples: [
      "Air pollution is increasing and the air is unbreathable",
      "Black smoke from the factory covers our colony",
      "Trees are being cut down illegally",
      "The forest area is being damaged and cleared",
      "The river is polluted with effluent and waste",
      "Illegal mining is harming nature and the river bed",
      "Coal dust from mining is settling on our houses",
      "Plastic pollution is everywhere in the area",
      "Industrial waste is being dumped illegally in the open",
      "Wildlife habitat is being destroyed by construction",
      "Elephants are entering the village because of habitat loss",
      "Stone crusher dust is damaging crops and health",
      "The pond and wetland are being filled for building",
      "Groundwater is contaminated by industrial discharge",
      "Open burning of waste is polluting the air",
      "Soil and land are degraded by mining overburden",
      "Factory ka dhuan pareshan kar raha hai",
      "Ped kaat rahe hain avaidh roop se",
    ],
  },

  {
    name: "Transportation",
    examples: [
      "The road is badly damaged and broken",
      "There are large potholes on the road",
      "The bridge has collapsed and cannot be used",
      "The culvert has been washed away by the river",
      "Vehicles cannot pass through this stretch",
      "The bus does not reach our village anymore",
      "There is no public transport connectivity to the block",
      "The road becomes unusable and muddy during monsoon",
      "The traffic signal at the crossing is not working",
      "There is severe traffic jam and congestion daily",
      "The approach road to the village was never built",
      "Auto and bus drivers overcharge passengers",
      "The railway crossing has no gate or overbridge",
      "The road has no footpath and pedestrians walk on the highway",
      "Encroachment by shops has narrowed the road",
      "The bus stand has no shelter or seating",
      "Sadak mein bahut gaddhe hain",
      "Sadak toot gayi hai, chalna mushkil hai",
    ],
  },

  {
    name: "Energy",
    examples: [
      "The street light is not working",
      "Street lights near the chowk have been off for weeks",
      "The street lights on the main road are all dead at night",
      "The street light pole is broken and the lamp is fused",
      "Electricity is cut frequently through the day",
      "There has been a power outage for many hours",
      "The village has no electricity connection or power supply",
      "The transformer is damaged and has burnt out",
      "Electric poles are damaged and wires are hanging low",
      "Voltage fluctuation is damaging our appliances",
      "The voltage is so low that bulbs stay dim",
      "A new electricity connection has been delayed for months",
      "The electricity bill is wrongly inflated",
      "The prepaid meter is faulty and not recharging",
      "The solar light installed in the village stopped working",
      "LPG cylinder supply under Ujjwala is not reaching us",
      "Bijli nahi aa rahi hai",
      "Bijli baar baar kat rahi hai",
      "Street light jal nahi raha hai",
      "Khambe ki light kharab hai",
      "Voltage kam hai, bulb dim jalta hai",
    ],
  },

  {
    name: "Waste Management",
    examples: [
      "Garbage is not being collected from our area",
      "Waste is dumped near houses and in the open",
      "The dustbins are overflowing with trash",
      "Open garbage is attracting stray animals and flies",
      "There is no sanitation worker or cleaning in the ward",
      "Plastic waste is scattered everywhere",
      "The garbage truck skips our street",
      "Waste segregation rules are not being followed",
      "The garbage dump near the market stinks badly",
      "Construction debris is left on the roadside",
      "Drains are filled with garbage because there is no bin",
      "Dead animals are not removed from the roadside",
      "The community bin was removed and never replaced",
      "Medical waste from the clinic is thrown in the open",
      "Household waste is burnt in the neighbourhood",
      "The landfill site is too close to our houses",
      "Kachra nahi uthaya ja raha hai",
      "Safai karmi nahi aate hain hamare mohalle mein",
      "Gali mein jhaadu nahi lagta hai",
      "Mohalle mein koi safai nahi hoti",
    ],
  },

  {
    name: "Public Safety",
    examples: [
      "There are frequent road accidents at this spot",
      "This crossing is dangerous and accidents keep happening",
      "Crime and theft are increasing in the locality",
      "The street is unsafe at night for residents",
      "Women and girls are harassed near the bus stand after dark",
      "Fire safety equipment is missing in the building",
      "Emergency services do not respond in time",
      "There is no police patrol in the area",
      "Eve teasing happens near the school area",
      "Stray dogs are attacking and biting children",
      "A pack of stray dogs has bitten several people",
      "Illegal liquor is being sold and creating nuisance",
      "Drug and gambling activity is going on openly",
      "An open electric wire or manhole is a danger to children",
      "An unsafe abandoned building may collapse on passers by",
      "Snakes and wild animals are entering houses",
      "Awara kutte kaat rahe hain",
      "Raat mein mohalla asurakshit hai",
    ],
  },

  {
    name: "Technology",
    examples: [
      "The internet is not working",
      "The mobile network signal is very weak here",
      "There is no mobile connectivity in the village",
      "Digital services are unavailable in the area",
      "The computer lab equipment is broken",
      "Online government services keep failing",
      "The WiFi at the common service centre is not available",
      "The government app or portal is not functioning",
      "Digital payment and UPI services keep failing",
      "The government website will not open or load",
      "The e-district or certificate portal shows an error",
      "The Aadhaar or KYC update service is not working online",
      "The CSC or Pragya Kendra machine is out of order",
      "Online form submission fails every time",
      "The biometric machine at the ration shop is not working",
      "Broadband cable has not been laid despite promises",
      "Network nahi aa raha hai",
      "Internet kaam nahi kar raha",
    ],
  },

  // "Other" competes on merit rather than acting as a dumping ground.
  // It needs real examples: routing it purely by low confidence was tried
  // and failed badly, because genuine "Other" complaints (filthy public
  // toilet, encroachment) score HIGH against real categories, while valid
  // in-domain complaints in local phrasing score low.
  {
    name: "Other",
    examples: [
      "The public toilet is filthy and unusable",
      "The community toilet has no water and is locked",
      "The public park is not maintained and overgrown",
      "The playground has broken equipment and is unusable",
      "Loudspeakers play loud music till late night",
      "Noise from the hall disturbs residents every night",
      "Someone has illegally encroached on public land",
      "A shop has built a permanent structure on public property",
      "The government office staff is unresponsive and rude",
      "The clerk is demanding a bribe to process my file",
      "My application has been pending in the office for months",
      "The local market is overcrowded and unorganised",
      "The community hall or bhavan is in disrepair",
      "Stray cattle are roaming and sitting on the road",
      "The graveyard or cremation ground is not maintained",
      "The pension or ration card has not been issued to me",
      "Sarkari daftar mein koi sunta nahi hai",
      "Public toilet gandha hai, use nahi kar sakte",
      "Awara mavesi sadak par baithe rehte hain",
      "This complaint does not relate to any department",
    ],
  },
];

// ========================================
// CANONICAL CATEGORY KEY
// ========================================
// A problem stores its category twice, in two different vocabularies:
// `category` is the citizen's dropdown value — a slug like "water" — while
// `aiCategory` is this service's display name, "Water Management". The two
// forms are never equal as strings, so anything comparing categories to
// each other has to fold both through toCategoryKey() first.
//
// This mirrors aiCategoryMap in client/src/pages/SubmitProblem.jsx, which
// does the same label → slug translation for the submit form.

const CATEGORY_KEYS = {
  Agriculture: "agriculture",
  Healthcare: "healthcare",
  Education: "education",
  "Water Management": "water",
  Environment: "environment",
  Transportation: "transportation",
  Energy: "energy",
  "Waste Management": "waste",
  "Public Safety": "public_safety",
  Technology: "technology",
  Other: "other",
};

// Underscores and spaces are folded together so "public_safety" and
// "Public Safety" normalize to the same lookup key.
const normalizeCategoryText = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, " ");

const CATEGORY_KEY_LOOKUP = new Map();

Object.entries(CATEGORY_KEYS).forEach(([label, key]) => {
  CATEGORY_KEY_LOOKUP.set(normalizeCategoryText(label), key);

  CATEGORY_KEY_LOOKUP.set(normalizeCategoryText(key), key);
});

// Falls back to the normalized text so an unmapped value still compares
// consistently against itself rather than collapsing to "".
const toCategoryKey = (value) => {
  const normalized = normalizeCategoryText(value);

  if (!normalized) return "";

  return CATEGORY_KEY_LOOKUP.get(normalized) || normalized;
};

// A category added above without a key here would silently stop matching
// its slug form, which is exactly the bug this map exists to prevent.
categories.forEach((category) => {
  if (!CATEGORY_KEYS[category.name]) {
    console.warn(
      `Category "${category.name}" has no entry in CATEGORY_KEYS — duplicate detection cannot match it against the citizen's dropdown value.`,
    );
  }
});

// ========================================
// KEYWORD BOOST MAP (HYBRID LAYER)
// ========================================
// Includes Hinglish spellings, and multi-word phrases such as
// "street light" — the earlier single-word "streetlight" entry never
// matched anyone who typed it as two words.

const keywordMap = {
  Agriculture: ["crop", "fasal", "farmer", "kisan", "farming", "kheti", "irrigation", "canal", "fertilizer", "urea", "seed", "seeds", "cattle", "livestock", "agriculture", "mandi", "paddy", "harvest"],
  Healthcare: ["hospital", "aspatal", "doctor", "medicine", "dawai", "ambulance", "vaccine", "clinic", "health", "treatment", "phc", "patient", "nurse", "malaria", "dengue"],
  Education: ["school", "teacher", "master", "student", "college", "classroom", "education", "exam", "scholarship", "anganwadi", "khichdi", "mid day meal", "textbook", "hostel"],
  "Water Management": ["water", "paani", "pani", "handpump", "chapakal", "tap", "nal", "drain", "nali", "drainage", "flood", "waterlogging", "sewage", "tanker", "pipeline", "borewell", "well", "tank"],
  Environment: ["pollution", "smoke", "dhuan", "tree", "ped", "forest", "jungle", "river", "nadi", "mining", "plastic", "environment", "wildlife", "dust", "crusher", "effluent"],
  Transportation: ["road", "sadak", "bridge", "pul", "pothole", "gaddha", "gaddhe", "bus", "transport", "traffic", "jam", "highway", "vehicle", "culvert", "footpath", "railway"],
  Energy: ["electricity", "bijli", "transformer", "power", "voltage", "current", "streetlight", "street light", "light", "pole", "khamba", "khambe", "meter", "outage", "wire", "solar", "lpg", "cylinder"],
  "Waste Management": ["garbage", "kachra", "kachara", "waste", "dustbin", "bin", "sanitation", "safai", "sweeper", "jhaadu", "trash", "segregation", "dump", "debris", "filth"],
  "Public Safety": ["accident", "durghatna", "crime", "theft", "chori", "unsafe", "asurakshit", "fire", "police", "emergency", "safety", "harass", "stray dog", "stray dogs", "awara kutte", "dog bite", "manhole", "liquor"],
  Technology: ["internet", "network", "wifi", "app", "digital", "online", "server", "portal", "website", "signal", "biometric", "upi", "aadhaar"],
  Other: ["toilet", "shauchalay", "park", "playground", "loudspeaker", "noise", "encroach", "bribe", "rishwat", "office", "daftar", "pension", "market", "cattle", "mavesi", "bhavan"],
};

// Pre-compiled with word boundaries. The earlier version used
// text.includes(keyword), which both missed phrases and matched inside
// unrelated words.

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const keywordPatterns = Object.fromEntries(
  Object.entries(keywordMap).map(([category, words]) => [
    category,
    words.map((word) => new RegExp(`\\b${escapeRegex(word)}\\b`, "i")),
  ])
);

// ========================================
// TEXT PREPROCESSING
// ========================================
// cleanText is shared with the duplicate detection service — see
// services/embeddingModel.js. Do not change its behaviour there: stored
// problem embeddings were built with it and would stop being comparable.

// ========================================
// KEYWORD BOOST SCORE
// ========================================

const getKeywordBoost = (categoryName, text) => {
  const patterns = keywordPatterns[categoryName];

  if (!patterns || patterns.length === 0) return 0;

  let matches = 0;

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      matches += 1;
    }
  }

  if (matches === 0) return 0;

  return Math.min(matches * KEYWORD_BOOST_PER_MATCH, KEYWORD_BOOST_MAX);
};

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

// normalizeVector and dotProduct are shared with the duplicate detection
// service — see services/embeddingModel.js

// ========================================
// LOAD MODEL ONCE
// ========================================
// Caches the promise, not the result, so concurrent first requests share
// one initialization instead of each rebuilding the category vectors.

let initPromise = null;

const initModel = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const extractor = await getExtractor();

    console.log("Building SamasyaSetu category vectors...");

    const built = [];

    for (const category of categories) {
      // One batched call per category; each example keeps its own vector
      // so predictCategory can take a max over them.
      const output = await extractor(category.examples.map(cleanText), {
        pooling: "mean",
        normalize: true,
      });

      const exampleVectors = output.tolist();

      built.push({
        name: category.name,
        examples: category.examples,
        exampleVectors,
        centroid: normalizeVector(averageVectors(exampleVectors)),
      });
    }

    cachedCategoryVectors = built;

    const exampleCount = built.reduce((n, c) => n + c.examples.length, 0);

    console.log(
      `SamasyaSetu AI ready. ${built.length} categories, ${exampleCount} examples.`
    );

    return extractor;
  })();

  initPromise.catch(() => {
    initPromise = null;
  });

  return initPromise;
};

// ========================================
// SCORE ONE CATEGORY
// ========================================

const scoreCategory = (category, userEmbedding, userText) => {
  let bestSimilarity = -1;
  let bestExampleIndex = 0;

  category.exampleVectors.forEach((vector, index) => {
    const similarity = dotProduct(userEmbedding, vector);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestExampleIndex = index;
    }
  });

  const centroidSimilarity = dotProduct(userEmbedding, category.centroid);

  const embeddingScore =
    WEIGHT_MAX * bestSimilarity + WEIGHT_CENTROID * centroidSimilarity;

  return {
    category: category.name,
    score: embeddingScore + getKeywordBoost(category.name, userText),
    closestExample: category.examples[bestExampleIndex],
  };
};

// ========================================
// PREDICT CATEGORY
// ========================================

const predictCategory = async (title, description) => {
  if (!title || !description) {
    throw new Error("Title and description are required.");
  }

  await initModel();

  const extractor = await getExtractor();

  const cleanTitle = cleanText(title);
  const cleanDescription = cleanText(description);

  // title repeated for extra weight in the embedding
  const userText = `${cleanTitle}. ${cleanTitle}. ${cleanDescription}`;

  const output = await extractor(userText, {
    pooling: "mean",
    normalize: true,
  });

  const userEmbedding = Array.from(output.data);

  const results = cachedCategoryVectors.map((category) =>
    scoreCategory(category, userEmbedding, userText)
  );

  results.sort((a, b) => b.score - a.score);

  const best = results[0];
  const second = results[1];

  const margin = best.score - second.score;

  // very short text is unreliable for embeddings
  const isShortText = cleanDescription.split(" ").length < MIN_DESCRIPTION_WORDS;

  let suggestionLevel = "strong";

  if (
    best.score < UNCERTAIN_SCORE ||
    margin < UNCERTAIN_MARGIN ||
    isShortText
  ) {
    suggestionLevel = "uncertain";
  } else if (best.score < STRONG_SCORE || margin < STRONG_MARGIN) {
    suggestionLevel = "moderate";
  }

  return {
    // Always the genuine best match. This used to return "Other" whenever
    // suggestionLevel was "uncertain", which turned a low-confidence guess
    // into a confidently wrong answer in the form. Callers should use
    // suggestionLevel to decide how far to trust it — see SubmitProblem.jsx,
    // which stops auto-selecting the dropdown when it is "uncertain".
    category: best.category,

    confidence: Number(best.score.toFixed(3)),

    margin: Number(margin.toFixed(3)),

    suggestionLevel,

    // the example that matched — useful for explaining a suggestion
    // to the admin, and for debugging a bad prediction
    closestExample: best.closestExample,

    // top 3 categories with their scores — used by the controller
    // to populate aiKeywords with more than just the single best match
    scores: results.slice(0, 3).map((r) => ({
      category: r.category,
      score: Number(r.score.toFixed(3)),
    })),
  };
};

module.exports = {
  initModel,
  predictCategory,
  toCategoryKey,
};
