// ========================================
// CATEGORY PREDICTION TEST
// ========================================
// Runs the real embedding model and the real scoring code in
// services/aiCategoryService.js against a labelled set of complaints.
// No database and no .env needed.
//
// Use it after editing the example bank, the weights, or the confidence
// bands in aiCategoryService.js — it will tell you whether you actually
// improved anything.
//
// Usage:
//   cd server && node scripts/testCategoryPrediction.js
//   cd server && node scripts/testCategoryPrediction.js --verbose
//
// Exits non-zero if accuracy drops below MIN_ACCURACY.

const path = require("path");

const SERVER_ROOT = path.join(__dirname, "..");

const { predictCategory, initModel } = require(
  path.join(SERVER_ROOT, "services/aiCategoryService")
);

const VERBOSE = process.argv.includes("--verbose");

// Regression floor. The scoring rewrite took this set from 54/75 to 68/75;
// 64 leaves headroom for tuning without letting a change quietly regress.
const MIN_ACCURACY = 64;

// ========================================
// LABELLED SET
// ========================================
// Group A: everyday phrasing, close to how citizens fill the form.
// Group B: indirect narrative complaints that never name the subject
//          directly — the honest test of generalisation.
//
// A label here is the category the platform should route the problem to.
// Where two categories could both be argued, the comment says why.

const CASES = [
  // ---------- Group A: direct phrasing ----------
  ["Street light not working near Albert Ekka Chowk", "Street light not working", "Energy"],
  ["Streetlight is broken in our lane", "The street light has been off for weeks", "Energy"],
  ["Street lights off on main road", "All the street lights along the road are dead at night", "Energy"],
  ["Bijli nahi aa rahi", "No electricity since morning, power cut in the whole village since 6 am", "Energy"],
  ["Transformer burnt", "The transformer near the temple burst two days ago and we have no power", "Energy"],
  ["Light comes and goes", "Bulbs are dim and the fridge is not cooling because of low current", "Energy"],
  ["Road is full of potholes", "The main road has huge craters and bikes keep falling", "Transportation"],
  ["Bus does not come to our village", "The government bus stopped coming to our village since last year", "Transportation"],
  ["Bridge is cracked", "The bridge over the river has big cracks, it may fall any day", "Transportation"],
  ["Cannot reach the block office", "There is no pucca road from our tola to the main road", "Transportation"],
  ["Handpump broken", "Our handpump has been out of order for a month, no drinking water", "Water Management"],
  ["Dirty water from tap", "Yellow smelly water is coming out of the tap and children fell ill", "Water Management"],
  ["Nali choked", "The drain near my house is choked and dirty water enters the house", "Water Management"],
  ["No water in summer", "The borewell has gone dry and we walk two km to fetch water", "Water Management"],
  ["Garbage not collected", "Dustbins overflowing near our house for a week", "Waste Management"],
  ["Kachra dumped in empty plot", "People throw household waste in the empty plot beside us", "Waste Management"],
  ["Nobody sweeps our lane", "No safai karmi has come to our ward for fifteen days", "Waste Management"],
  ["No teacher in school", "Our primary school has had no master for two months", "Education"],
  ["School roof falling", "The classroom ceiling plaster is coming off and it leaks in rain", "Education"],
  ["Khichdi is bad", "The food given to children in school is of very poor quality", "Education"],
  ["Girls have no toilet in school", "There is no usable toilet for girl students so they stop coming", "Education"],
  ["Hospital has no medicine", "The PHC has run out of even basic tablets", "Healthcare"],
  ["No ambulance available", "We could not get an ambulance for a pregnant woman at night", "Healthcare"],
  ["Doctor never comes", "The health sub centre doctor is absent most days of the week", "Healthcare"],
  ["Stray dogs attacking children", "A pack of stray dogs bit two children this month", "Public Safety"],
  ["Accidents at this crossing", "Three accidents happened at this turning this year", "Public Safety"],
  ["Unsafe for women at night", "Girls are troubled by drunk men near the bus stand after dark", "Public Safety"],
  ["Open manhole on the lane", "An uncovered drain hole is left open and a child fell in", "Public Safety"],
  ["Internet is very slow", "Mobile network barely works in our area, calls keep dropping", "Technology"],
  ["Government website not opening", "The online form on the e-district portal keeps failing", "Technology"],
  ["Ration machine not working", "The thumb machine at the PDS shop never reads and we get no ration", "Technology"],
  ["Illegal mining near river", "Trucks are illegally lifting sand from the river bed at night", "Environment"],
  ["Trees being cut for construction", "Many old trees are being felled near the forest edge", "Environment"],
  ["Factory smoke is choking us", "Black smoke from the factory covers our colony every evening", "Environment"],
  ["Crop damaged by pests", "Insects have destroyed our paddy this season", "Agriculture"],
  ["No fertilizer at the depot", "Farmers are not getting urea at the cooperative depot", "Agriculture"],
  ["Fields have no water", "Our canal is dry so we could not sow this season", "Agriculture"],
  ["Elephants destroyed the field", "A herd came at night and flattened the standing crop", "Agriculture"],
  ["Public toilet is filthy", "The public toilet near the market is unusable and stinking", "Other"],
  ["Park is not maintained", "The community park has broken benches and grass up to the waist", "Other"],
  ["Loudspeakers till late night", "Loud music from the marriage hall goes on till 2 am", "Other"],
  // footpath encroachment is arguably Transportation; labelled Other
  // because the grievance is illegal use of public land, not the road
  ["Shop has encroached the footpath", "A shopkeeper has built a permanent platform on public land", "Other"],
  ["Clerk demands money", "The office staff refuses to process my file without a bribe", "Other"],

  // ---------- Group B: indirect narrative ----------
  ["Darkness in front of my house", "Ever since the pole lamp fused two months ago we cannot see anything after sunset and my mother tripped on the steps", "Energy"],
  ["Meter reading is wrong", "I used almost nothing last month but the bill says four thousand rupees and the office refuses to correct it", "Energy"],
  ["Nothing works when it rains", "Every time there is a storm we lose supply for two days because the wires come down on the trees", "Energy"],
  ["Cannot take my mother to town", "The only vehicle that used to pass through our tola stopped six months ago and now we walk nine kilometres", "Transportation"],
  ["My scooter got damaged", "The stretch in front of the panchayat office has sunk in and there are craters that break vehicles", "Transportation"],
  ["It takes an hour to cross", "Every morning there is a huge jam at the crossing because nobody manages the vehicles", "Transportation"],
  ["My children have rashes", "Whatever comes out of the tap is muddy and smells, we have been boiling it but children still get sick", "Water Management"],
  ["Everything floods in monsoon", "The channel behind the houses is full of silt so the moment it rains the water rises into our courtyard", "Water Management"],
  ["Walking far for a bucket", "The only source in our hamlet stopped yielding and women queue at dawn at the next village", "Water Management"],
  ["Smell is unbearable", "The heap at the corner of our lane has not been lifted in a fortnight and flies have taken over", "Waste Management"],
  ["Cows eating plastic", "Whatever people throw at the corner is eaten by animals because there is no container there", "Waste Management"],
  ["My son sits idle", "There has been nobody to take the fifth standard class since the transfer in June", "Education"],
  ["Afraid to send her", "There is no functioning facility for girls in the building so my daughter stopped going after class six", "Education"],
  ["The ceiling is coming down", "Chunks fell during class last week and the children now sit under the tree", "Education"],
  ["Had to hire a jeep", "My wife was in labour at midnight and nothing came from the centre so we paid two thousand rupees", "Healthcare"],
  ["Told to buy from outside", "Every time we go we are given a slip to purchase from the private shop because nothing is in stock", "Healthcare"],
  ["Sat all day, nobody came", "The person posted at our sub centre only turns up on paper", "Healthcare"],
  ["Children are scared to walk", "A group of animals near the colony gate has bitten three people including a small girl", "Public Safety"],
  ["Somebody will die here", "Two-wheelers collide at the turning almost every week because there is no way to see oncoming vehicles", "Public Safety"],
  ["Cannot go out after dark", "Men gather and drink near the stop and pass comments at the girls coming back from tuition", "Public Safety"],
  ["Nothing loads on my phone", "Even a single message takes ten minutes here and calls cut off midway", "Technology"],
  ["Could not get my certificate", "The portal shows an error every time I try to submit and the deadline is over", "Technology"],
  ["Fish are dying", "Whatever the plant releases upstream has turned the water black and the catch has vanished", "Environment"],
  ["Dust on everything", "The crusher next to our field coats the leaves white and my throat hurts all day", "Environment"],
  ["They came at night with trucks", "Men are lifting material from the bed of the stream illegally and the banks are collapsing", "Environment"],
  ["Lost the whole season", "The herd came through at night and flattened everything we had sown", "Agriculture"],
  ["Standing in queue for urea", "The cooperative says stock has not arrived and the private shop sells at double", "Agriculture"],
  ["Could not sow at all", "The channel that feeds our plots has been dry for two years so half the land is idle", "Agriculture"],
  ["Nobody can use it", "The facility built near the market has no water, the doors are broken and it stinks", "Other"],
  ["Grass taller than my child", "The open ground the children used to play in is now waist high weeds with broken benches", "Other"],
  ["Cannot sleep at all", "The function hall behind us runs music at full volume till two in the morning every weekend", "Other"],
  ["File has not moved", "I have visited the office eleven times and the staff keeps telling me to come next week", "Other"],
];

const run = async () => {
  await initModel();

  let correct = 0;
  const misses = [];
  const byLevel = {};

  for (const [title, description, expected] of CASES) {
    const result = await predictCategory(title, description);

    const ok = result.category === expected;

    if (ok) correct += 1;
    else misses.push({ title, expected, result });

    const level = result.suggestionLevel;
    byLevel[level] = byLevel[level] || { n: 0, ok: 0 };
    byLevel[level].n += 1;
    if (ok) byLevel[level].ok += 1;

    if (VERBOSE) {
      console.log(
        `${ok ? "OK  " : "MISS"} ${expected.padEnd(17)} -> ${String(result.category).padEnd(17)} ` +
          `score=${result.confidence} margin=${result.margin} ${result.suggestionLevel}`
      );
      console.log(`      "${title}"`);
      console.log(`      closest example: "${result.closestExample}"`);
    }
  }

  if (misses.length > 0) {
    console.log(`\n--- misclassified (${misses.length}) ---`);
    misses.forEach((m) =>
      console.log(
        `  ${m.expected} -> ${m.result.category}  [${m.result.confidence}, ${m.result.suggestionLevel}]  "${m.title}"`
      )
    );
  }

  console.log(`\n--- accuracy by confidence band ---`);
  for (const level of ["strong", "moderate", "uncertain"]) {
    const b = byLevel[level];
    if (!b) continue;
    console.log(
      `  ${level.padEnd(10)} n=${String(b.n).padStart(2)}  correct ${b.ok}/${b.n}  (${Math.round(
        (b.ok / b.n) * 100
      )}%)`
    );
  }

  const pct = Math.round((correct / CASES.length) * 100);

  console.log(`\n========================================`);
  console.log(`${correct}/${CASES.length} correct (${pct}%), floor is ${MIN_ACCURACY}`);

  process.exit(correct >= MIN_ACCURACY ? 0 : 1);
};

run().catch((e) => {
  console.error("harness error:", e);
  process.exit(1);
});
