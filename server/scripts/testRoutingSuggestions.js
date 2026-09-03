// ========================================
// AI ROUTING TEST SCRIPT
// ========================================
// Seeds nothing — runs recommendPartners against sample
// problems using the partners already in the database.
//
// Run:  node scripts/testRoutingSuggestions.js
//
// Mirrors testCategoryPrediction.js / testDuplicateDetection.js:
// a small labelled set with expected expertise areas, so a
// change to weights or profiles can be eyeballed quickly.

const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { recommendPartners, toSuggestionDTOs } = require("../services/aiRoutingService");

const CASES = [
  {
    title: "Street lights not working in locality",
    description:
      "The street lights on the main road have been off for three weeks. It is unsafe to walk at night and there have been minor accidents.",
    aiCategory: "Energy",
    locationDetails: { district: "Dhanbad" },
    expectAtLeastOneTag: "energy",
  },
  {
    title: "Paddy crop destroyed by pests",
    description:
      "Insects have damaged the standing paddy crop across our village. Farmers are facing heavy losses and need pest control guidance.",
    aiCategory: "Agriculture",
    locationDetails: { district: "Ranchi" },
    expectAtLeastOneTag: "agriculture",
  },
  {
    title: "No doctor at the health sub centre",
    description:
      "The health sub centre in our block has no doctor most days. Pregnant women and children suffer the most. Medicines are also out of stock.",
    aiCategory: "Healthcare",
    locationDetails: { district: "Deoghar" },
    expectAtLeastOneTag: "healthcare",
  },
  {
    title: "School building roof is leaking",
    description:
      "The primary school roof leaks during monsoon and classes are held outside. There are not enough teachers either.",
    aiCategory: "Education",
    locationDetails: { district: "Jamshedpur" },
    expectAtLeastOneTag: "education",
  },
  {
    title: "Drinking water contaminated",
    description:
      "The tap water smells and is yellow in colour. Several people have fallen ill. We suspect sewage is mixing with the pipeline.",
    aiCategory: "Water Management",
    locationDetails: { district: "Bokaro" },
    expectAtLeastOneTag: "water",
  },
];

const testRouting = async () => {
  try {
    await connectDB();

    let pass = 0;

    let fail = 0;

    for (const testCase of CASES) {
      const { suggestions } = await recommendPartners(testCase);

      const dtos = await toSuggestionDTOs(suggestions);

      const names = dtos
        .map((s) => `${s.partner.name} (${s.partner.type})`)
        .join(", ");

      const tagOk = dtos.some((s) =>
        (s.partner.expertise || []).includes(testCase.expectAtLeastOneTag),
      );

      const header = `${tagOk ? "PASS" : "FAIL"} — ${testCase.title} [${testCase.locationDetails?.district}]`;

      console.log(`\n${header}`);

      console.log(`  Top 3: ${names}`);

      dtos.forEach((s, index) => {
        console.log(
          `  ${index + 1}. ${s.partner.name} — match ${s.matchScore}, expertise ${s.expertiseScore}, geo ${s.geoScore} — ${s.reason}`,
        );
      });

      if (tagOk) pass += 1;
      else fail += 1;
    }

    console.log(`\n${pass} passed, ${fail} failed of ${CASES.length}.`);
  } catch (error) {
    console.error("Test failed:", error);

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

testRouting();
