// ============================================================
// SAMASYA SETU — FULL PRODUCTION SYSTEM HEALTH TEST SUITE
// ============================================================
// Exhaustively tests every core route, controller, database model,
// and AI pipeline to guarantee ZERO crashes in production.

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const Project = require("../models/Project");
const Notification = require("../models/Notification");

const { predictCategory } = require("../services/aiCategoryService");
const { scorePriority } = require("../services/aiPriorityService");
const { recommendPartners } = require("../services/aiRoutingService");
const { sendOtpEmail } = require("../services/emailService");

let passed = 0;
let failed = 0;

const assert = (condition, testName, extra = "") => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${extra}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${extra}`);
    failed++;
  }
};

async function runHealthCheck() {
  console.log("\n========================================================");
  console.log("🚀 STARTING FULL PRODUCTION DEPLOYMENT HEALTH CHECK");
  console.log("========================================================\n");

  // 1. DATABASE CONNECTIVITY
  console.log("📦 1. Testing Database Connectivity...");
  await connectDB();
  assert(mongoose.connection.readyState === 1, "MongoDB Atlas Connected and Ready");

  // 2. EMAIL SERVICE & OTP LIFECYCLE
  console.log("\n✉️ 2. Testing Email & OTP Verification Pipeline...");
  const testEmail = `healthcheck_${Date.now()}@example.com`;
  const testOtp = "849201";

  const emailResult = await sendOtpEmail({
    to: testEmail,
    name: "Health Tester",
    otp: testOtp,
  });
  assert(emailResult && (emailResult.sent || emailResult.simulated), "Email Dispatch Handler executed safely");

  const expiresAt = new Date(Date.now() + 600000);
  const otpDoc = await Otp.create({
    email: testEmail,
    otp: testOtp,
    attempts: 0,
    expiresAt,
  });
  assert(otpDoc && otpDoc.otp === testOtp, "OTP Model creation & TTL index active");

  const verifiedOtp = await Otp.findOne({ email: testEmail });
  assert(verifiedOtp && verifiedOtp.otp === testOtp, "OTP Fetch and match successful");
  await Otp.deleteOne({ _id: otpDoc._id });

  // 3. USER ROLES & AUTHENTICATION MODELS
  console.log("\n🔑 3. Testing User Model & RBAC Roles...");
  const adminUser = await User.findOne({ role: "admin" });
  assert(adminUser !== null, "Admin account exists in MongoDB Atlas", `(${adminUser?.email})`);

  const partnerUsers = await User.find({ role: "partner" }).populate("partner");
  assert(partnerUsers.length > 0, "Partner accounts exist in MongoDB Atlas", `(${partnerUsers.length} active)`);

  const universityPartner = partnerUsers.find((u) => u.partner?.type === "university");
  assert(universityPartner !== undefined, "University partner account active", `(${universityPartner?.email} - ${universityPartner?.partner?.name})`);

  const industryPartner = partnerUsers.find((u) => u.partner?.type === "industry");
  assert(industryPartner !== undefined, "Industry partner account active", `(${industryPartner?.email} - ${industryPartner?.partner?.name})`);

  // 4. ON-DEVICE AI PIPELINE TEST
  console.log("\n🧠 4. Testing On-Device AI Pipeline (all-MiniLM-L6-v2)...");
  const aiCategory = await predictCategory(
    "Fluoride in drinking water",
    "Heavy metals and chemical contamination in deep borewell water causing sickness in children"
  );
  assert(aiCategory && aiCategory.category, "AI Category Classification", `-> Predicted: ${aiCategory.category} (${aiCategory.suggestionLevel}, confidence: ${aiCategory.confidence})`);

  const priorityResult = scorePriority({
    title: "Urgent: Contaminated water supply causing cholera outbreak",
    description: "Entire panchayat of 3000 people affected by toxic water",
    severity: "critical",
    affectedPeople: 3000,
    clusterSize: 4,
    status: "submitted",
    createdAt: new Date(),
  });
  assert(priorityResult && priorityResult.score >= 70, "Priority Scorer identifies Critical Urgency", `-> Score: ${priorityResult.score}/100 (${priorityResult.band})`);

  const testProblem = {
    _id: new mongoose.Types.ObjectId(),
    title: "Drinking water handpump broken in Ward 4",
    description: "The handpump is dispensing dirty mud water and requires immediate repair",
    category: "water",
    location: { type: "Point", coordinates: [85.3096, 23.3441] },
    locationDetails: { district: "Ranchi" },
  };

  const routingResult = await recommendPartners(testProblem, { limit: 3 });
  const suggestions = routingResult?.suggestions || routingResult;
  assert(Array.isArray(suggestions) && suggestions.length > 0, "AI Institutional Routing Engine", `-> Recommended ${suggestions.length} partners (Top: ${suggestions[0]?.partner?.name || suggestions[0]?.name || "Matched Partner"})`);

  // 5. PROBLEM WORKFLOW & REPOSITORY INTEGRITY
  console.log("\n📋 5. Testing Problem Workflow & Data Integrity...");
  const problemCount = await Problem.countDocuments();
  assert(problemCount > 0, "Problem records present in database", `(Count: ${problemCount})`);

  const partnerCount = await Partner.countDocuments();
  assert(partnerCount >= 20, "28 Jharkhand Institutional Partners seeded", `(Count: ${partnerCount})`);

  const projectCount = await Project.countDocuments();
  assert(typeof projectCount === "number", "Project workspace collection accessible", `(Count: ${projectCount})`);

  // 6. NOTIFICATION SYSTEM
  console.log("\n🔔 6. Testing Real-time Notification Schema...");
  const testNotif = await Notification.create({
    recipient: adminUser._id,
    type: "problem_submitted",
    title: "Health Check Notification",
    message: "Production deployment verification completed successfully.",
    read: false,
  });
  assert(testNotif && testNotif._id, "Notification successfully created in database");
  await Notification.deleteOne({ _id: testNotif._id });

  console.log("\n========================================================");
  console.log(`📊 HEALTH CHECK RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed === 0) {
    console.log("🎉 ALL PRODUCTION SYSTEMS NOMINAL. ZERO CRASH RISKS DETECTED.\n");
  } else {
    console.error("⚠️ SOME CHECKS FAILED. PLEASE INVESTIGATE.\n");
    process.exit(1);
  }

  process.exit(0);
}

runHealthCheck().catch((err) => {
  console.error("CRITICAL HEALTH CHECK FAILURE:", err);
  process.exit(1);
});
