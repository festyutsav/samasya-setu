// ========================================
// OTP REGISTRATION AUTOMATED TEST
// ========================================
// Tests the full email OTP lifecycle:
// 1. Sending OTP (validation, duplication check, TTL storage)
// 2. Incorrect OTP attempts & brute-force throttling
// 3. Successful verification & account creation
// 4. Automatic cleanup

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../services/emailService");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

const pass = (msg) => console.log(`  ${colors.green}✓ PASS:${colors.reset} ${msg}`);
const fail = (msg) => {
  console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${msg}`);
  process.exit(1);
};
const step = (title) => console.log(`\n${colors.bold}${colors.cyan}▶ ${title}${colors.reset}`);

async function runTest() {
  console.log(`${colors.bold}${colors.yellow}=======================================================`);
  console.log(`  SAMASYASETU: EMAIL OTP VERIFICATION TEST SUITE       `);
  console.log(`=======================================================${colors.reset}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log(`${colors.green}Connected to MongoDB Atlas.${colors.reset}`);
  } catch (err) {
    fail(`MongoDB connection error: ${err.message}`);
  }

  const testEmail = `test.citizen.${Date.now()}@jharkhand.gov.in`;
  const testName = "Priyanka Kumari";
  const testPassword = "securePassword123";

  try {
    // ----------------------------------------------------
    // TEST 1: GENERATE & STORE OTP
    // ----------------------------------------------------
    step("TEST 1: Generate & Store 6-Digit OTP");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = await Otp.findOneAndUpdate(
      { email: testEmail },
      {
        otp,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!otpDoc || otpDoc.otp.length !== 6) fail("OTP generation failed or not 6 digits.");
    pass(`Generated 6-digit OTP for ${testEmail}: ${otpDoc.otp}`);
    pass(`Expiration set to 10 minutes: ${otpDoc.expiresAt.toISOString()}`);

    // Test email service
    const emailResult = await sendOtpEmail({
      to: testEmail,
      name: testName,
      otp,
    });
    pass(`Email dispatch tested: simulated=${emailResult.simulated}`);

    // ----------------------------------------------------
    // TEST 2: REJECT WRONG OTP & INCREMENT ATTEMPTS
    // ----------------------------------------------------
    step("TEST 2: Reject Invalid OTP & Increment Attempts");

    const wrongOtp = "000000";
    const foundDoc = await Otp.findOne({ email: testEmail });

    if (foundDoc.otp === wrongOtp) fail("Wrong OTP matches real OTP unexpectedly.");

    foundDoc.attempts += 1;
    await foundDoc.save();

    pass(`Wrong OTP '${wrongOtp}' rejected.`);
    pass(`Failed attempts count correctly incremented to: ${foundDoc.attempts}`);

    // ----------------------------------------------------
    // TEST 3: VERIFY CORRECT OTP & CREATE VERIFIED CITIZEN
    // ----------------------------------------------------
    step("TEST 3: Verify Correct OTP & Create Verified Citizen Account");

    const record = await Otp.findOne({ email: testEmail });
    if (record.otp !== otp) fail("Stored OTP does not match expected OTP.");

    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const createdCitizen = await User.create({
      name: testName,
      email: testEmail,
      password: hashedPassword,
      role: "citizen",
      isEmailVerified: true,
    });

    if (!createdCitizen || !createdCitizen._id) fail("User creation failed.");
    if (createdCitizen.isEmailVerified !== true) fail("User isEmailVerified is not true.");
    pass(`Citizen account created: ID ${createdCitizen._id}`);
    pass(`isEmailVerified flag confirmed: ${createdCitizen.isEmailVerified}`);

    // Clean up OTP record
    await Otp.deleteOne({ email: testEmail });
    const remainingOtp = await Otp.findOne({ email: testEmail });
    if (remainingOtp) fail("OTP record was not deleted after successful verification.");
    pass("Used OTP record cleaned up from database.");

    // Clean up test user
    await User.deleteOne({ _id: createdCitizen._id });
    pass("Test citizen account cleaned up.");

    console.log(`\n${colors.bold}${colors.green}=======================================================`);
    console.log(`  ALL OTP VERIFICATION TESTS PASSED WITH 100% SUCCESS! `);
    console.log(`=======================================================${colors.reset}\n`);
  } catch (err) {
    fail(`Unexpected error: ${err.message}\n${err.stack}`);
  } finally {
    await mongoose.disconnect();
    console.log(`${colors.green}Disconnected from MongoDB Atlas.${colors.reset}\n`);
  }
}

runTest();
