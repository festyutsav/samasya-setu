// ==============================================================================
// SAMASYASETU: REALISTIC SHOWCASE MOUNT SCRIPT
// ==============================================================================
// Mounts a hyper-realistic, non-generic Jharkhand civic-industrial challenge
// that exercises every single feature of the platform:
//
// Scenario:
//   "Acid Mine Drainage & Toxic Coal Slurry Runoff Contaminating Garga River &
//    Farmlands in Chandrapura-Bokaro Belt"
//
// Key Stakeholders:
//   1. Citizen: Manoj Soren (Farmer / Village Resident, Chas Block, Bokaro)
//   2. Government Admin: State Environment & Civic Resolution Desk
//   3. University: Birla Institute of Technology Sindri / Mesra
//   4. Industry: Bokaro Steel Plant (SAIL)
//
// Usage:
//   node server/scripts/mountRealisticShowcase.js
// ==============================================================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const path = require("path");

const User = require(path.join(__dirname, "..", "models", "User"));
const Partner = require(path.join(__dirname, "..", "models", "Partner"));
const Problem = require(path.join(__dirname, "..", "models", "Problem"));
const SolutionProposal = require(path.join(__dirname, "..", "models", "SolutionProposal"));
const Project = require(path.join(__dirname, "..", "models", "Project"));
const Notification = require(path.join(__dirname, "..", "models", "Notification"));
const { notifyAdmins } = require(path.join(__dirname, "..", "services", "notificationService"));

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

const targetStage = (process.argv.find(arg => arg.startsWith("--stage=")) || "").split("=")[1] || "solved";

async function mountShowcase() {
  console.log(`\n${colors.bold}${colors.yellow}==============================================================================`);
  console.log(`   SAMASYASETU: MOUNTING AUTHENTIC JHARKHAND SHOWCASE SCENARIO               `);
  console.log(`   Target Stage: [${targetStage.toUpperCase()}]`);
  console.log(`==============================================================================${colors.reset}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log(`${colors.green}✓ Connected to MongoDB Atlas.${colors.reset}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  try {
    // --------------------------------------------------------------------------
    // 1. RESOLVE OR CREATE CITIZEN
    // --------------------------------------------------------------------------
    let citizen = await User.findOne({ email: "manoj.soren.chas@gmail.com" });
    if (!citizen) {
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("Citizen@123", 10);
      citizen = await User.create({
        name: "Manoj Soren",
        email: "manoj.soren.chas@gmail.com",
        password: hashedPassword,
        phone: "9835123456",
        role: "citizen",
        address: "Village Telo, Chas Block, Bokaro, Jharkhand",
      });
      console.log(`  ${colors.green}✓ Created Citizen account: Manoj Soren (manoj.soren.chas@gmail.com)${colors.reset}`);
    } else {
      console.log(`  ${colors.green}✓ Found Citizen account: ${citizen.name}${colors.reset}`);
    }

    // --------------------------------------------------------------------------
    // 2. RESOLVE ADMIN
    // --------------------------------------------------------------------------
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.error("No admin user found. Please ensure admin account exists.");
      process.exit(1);
    }
    console.log(`  ${colors.green}✓ Found Government Admin: ${admin.name} (${admin.email})${colors.reset}`);

    // --------------------------------------------------------------------------
    // 3. RESOLVE UNIVERSITY PARTNER (BIT Sindri or BIT Mesra)
    // --------------------------------------------------------------------------
    let universityPartner = await Partner.findOne({
      name: { $regex: /birla institute of technology sindri/i },
    });
    if (!universityPartner) {
      universityPartner = await Partner.findOne({
        name: { $regex: /birla institute of technology/i },
      });
    }
    if (!universityPartner) {
      console.error("University partner not found.");
      process.exit(1);
    }

    let universityUser = await User.findOne({ partner: universityPartner._id });
    if (!universityUser) {
      universityUser = await User.findOne({ email: { $regex: /birla.*@edu\.in/i } });
    }
    console.log(`  ${colors.green}✓ Found University Partner: ${universityPartner.name}${colors.reset}`);

    // --------------------------------------------------------------------------
    // 4. RESOLVE INDUSTRY PARTNER (Bokaro Steel Plant)
    // --------------------------------------------------------------------------
    const industryPartner = await Partner.findOne({
      name: { $regex: /bokaro steel/i },
    });
    if (!industryPartner) {
      console.error("Industry partner (Bokaro Steel Plant) not found.");
      process.exit(1);
    }

    let industryUser = await User.findOne({ partner: industryPartner._id });
    if (!industryUser) {
      industryUser = await User.findOne({ email: "bokaro_steel_plant@com" });
    }
    console.log(`  ${colors.green}✓ Found Industry Partner: ${industryPartner.name}${colors.reset}`);

    // --------------------------------------------------------------------------
    // 5. CLEAN UP ANY PRIOR SHOWCASE RUN
    // --------------------------------------------------------------------------
    const existingProblem = await Problem.findOne({
      title: { $regex: /Acid Mine Drainage & Toxic Coal Slurry Runoff/i },
    });
    if (existingProblem) {
      await SolutionProposal.deleteMany({ problem: existingProblem._id });
      await Project.deleteMany({ problem: existingProblem._id });
      await Notification.deleteMany({ problemId: existingProblem._id });
      await Problem.findByIdAndDelete(existingProblem._id);
      console.log(`  ${colors.yellow}→ Cleaned up prior showcase run.${colors.reset}`);
    }

    // --------------------------------------------------------------------------
    // 6. CREATE REALISTIC PROBLEM (STAGE 1: CITIZEN SUBMISSION)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.cyan}▶ Step 1: Citizen Submits Realistic Challenge${colors.reset}`);

    const problem = await Problem.create({
      title: "Acid Mine Drainage & Toxic Coal Slurry Runoff Contaminating Garga River & Farmlands in Chandrapura-Bokaro Belt",
      description:
        "High-acidity runoff (pH 3.2) carrying dissolved iron, sulfur, and coal slurry has breached unlined containment pits near Chandrapura and Chas, flooding into the Garga River tributary. Over 650 bighas of standing paddy and winter vegetables across Telo and Chas panchayats have turned yellow and stunted. Drinking water handpumps are pumping foul-smelling reddish water causing chronic dermatitis and cattle illness. Local municipal teams lack neutralization technology. Urgently requires academic R&D and industrial slag neutralization to save village farmlands.\n\nCitizen Note (Hinglish): 'Khet ka paani bilkul peela aur acid jaisa teekha ho gaya hai, fasal jal rahi hai aur handpump se badbudaar paani nikal raha hai. Kripya turant madad karein.'",
      category: "water_sanitation",
      location: "Telo Village, Garga River Basin, Chas Block, Bokaro, Jharkhand",
      locationDetails: {
        district: "Bokaro",
        state: "Jharkhand",
        pincode: "827013",
        latitude: 23.6358,
        longitude: 86.1772,
      },
      images: [
        {
          url: "/sample-evidence/contaminated_water.jpg",
          publicId: "sample-evidence/contaminated_water",
        },
      ],
      submittedBy: citizen._id,
      status: targetStage === "submitted" ? "submitted" : targetStage === "assigned" ? "assigned" : targetStage === "in_progress" ? "in_progress" : "solved",
      upvotes: 42,
      upvotedBy: [citizen._id],
      tags: ["acid-mine-drainage", "water-pollution", "bokaro", "soil-remediation", "garga-river"],
      aiCategoryPrediction: {
        primaryCategory: "Water Management",
        confidence: 0.94,
        allScores: [
          { category: "Water Management", score: 0.94 },
          { category: "Sanitation & Waste Management", score: 0.88 },
          { category: "Agriculture", score: 0.79 },
        ],
      },
      priorityScore: 88,
      priorityLevel: "critical",
      assignedPartner: targetStage === "submitted" ? null : universityPartner._id,
      assignedAt: targetStage === "submitted" ? null : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      resolutionSubmitted: targetStage === "solved",
      resolutionApprovedAt: targetStage === "solved" ? new Date() : null,
      resolutionDetails: targetStage === "solved" ? {
        summary:
          "Successfully deployed a 3-stage Permeable Reactive Barrier (PRB) using 15 tonnes of alkaline granulated blast-furnace slag provided by Bokaro Steel Plant. Acidic mine runoff neutralized from pH 3.2 to 7.15, dissolved heavy iron precipitated by 94%, and safe irrigation restored to 650 bighas of farmlands in Chas.",
        leadPartnerName: universityPartner.name,
        collaboratorPartnerName: industryPartner.name,
        outcomes: [
          "River water pH permanently stabilized from 3.2 (toxic acidic) to 7.15 (safe neutral)",
          "Dissolved iron reduced from 14.8 mg/L to 0.4 mg/L (< WHO permissible limits)",
          "Clean irrigation restored for 650 bighas of agricultural crops across 4 villages",
          "Zero new dermatitis cases reported across local PHC health centers",
        ],
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approvedByAdmin: admin.name,
      } : null,
    });

    console.log(`  ${colors.green}✓ Problem Created: ${problem._id}${colors.reset}`);
    console.log(`    Title: "${problem.title}"`);
    console.log(`    Status: "${problem.status}"`);
    console.log(`    Category: ${problem.category} (AI Confidence: 94%)`);
    console.log(`    Priority: Critical (Score: 88/100)`);

    if (targetStage === "submitted" || targetStage === "assigned") {
      console.log(`\n${colors.bold}${colors.magenta}Showcase mounted at stage [${targetStage.toUpperCase()}]!${colors.reset}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // --------------------------------------------------------------------------
    // 7. MOUNT SOLUTION PROPOSAL (STAGE 2: UNIVERSITY PROPOSAL)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.cyan}▶ Step 2: University Submits Formal Solution Proposal${colors.reset}`);

    const proposal = await SolutionProposal.create({
      problem: problem._id,
      university: universityPartner._id,
      submittedBy: universityUser?._id || admin._id,
      title: "Granulated Blast Furnace Slag Permeable Reactive Barrier (PRB) for Acid Mine Drainage Remediation",
      description:
        "Comprehensive eco-engineering proposal to intercept and neutralize toxic acidic quarry seepage using alkaline granulated blast-furnace slag (GBFS) from Bokaro Steel Plant combined with local agricultural bio-char filtration.",
      approach:
        "1. Construct a multi-stage permeable reactive barrier trench along the 300m runoff contour.\n2. Pack with 15 tonnes of high-CaO (42%) blast furnace slag to neutralize sulfuric acidity into inert gypsum.\n3. Implement non-woven geotextile catch-basins to settle heavy iron sludge.\n4. Real-time IoT spectrophotometric water testing to ensure irrigation effluent adheres to CPCB norms.",
      team: [
        {
          name: "Dr. Arvind Kumar",
          role: "Lead Investigator",
          department: "Chemical & Environmental Engineering",
          email: "arvind.kumar@bitsindri.ac.in",
        },
        {
          name: "Sneha Kumari",
          role: "Water Chemistry Researcher",
          department: "Environmental Engineering (M.Tech)",
          email: "sneha.k@bitsindri.ac.in",
        },
        {
          name: "Rahul Verma",
          role: "Field Site Coordinator",
          department: "Metallurgical Engineering (B.Tech)",
          email: "rahul.v@bitsindri.ac.in",
        },
      ],
      timeline: {
        startDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            title: "Phase 1: Water Chemistry Profiling & Slag Alkalinity Formulation",
            description: "Core sampling of quarry seepage and formulation of slag/bio-char reactive matrix.",
            dueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
            status: "completed",
          },
          {
            title: "Phase 2: Barrier Trench Excavation & 15-Tonne Slag Emplacement",
            description: "Excavation of 3-stage PRB trench in Chas and packing of 15 tonnes of Bokaro Steel slag.",
            dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            status: "completed",
          },
          {
            title: "Phase 3: Field Validation & Farmer Irrigation Restoration",
            description: "Full effluent testing, heavy metal filtration sign-off, and handover to Village Panchayat.",
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: "completed",
          },
        ],
      },
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      reviewNotes:
        "Sanctioned under Jharkhand Clean River & Industrial Mitigation Protocol. University authorized to coordinate directly with Bokaro Steel Plant for slag material allocation.",
    });

    console.log(`  ${colors.green}✓ Proposal Created & Approved: ${proposal._id}${colors.reset}`);

    // --------------------------------------------------------------------------
    // 8. MOUNT COLLABORATIVE PROJECT (STAGE 3 & 4: WORKSPACE & MESSAGING)
    // --------------------------------------------------------------------------
    console.log(`\n${colors.cyan}▶ Step 3: University-Industry Collaborative Workspace${colors.reset}`);

    const project = await Project.create({
      title: "Garga River Acid Runoff Neutralization Pilot",
      description:
        "Collaborative R&D and field implementation initiative between Birla Institute of Technology and Bokaro Steel Plant (SAIL) to neutralize acid mine runoff using industrial slag.",
      problem: problem._id,
      partner: universityPartner._id,
      createdBy: universityUser?._id || admin._id,
      status: targetStage === "in_progress" ? "active" : "completed",
      collaborators: [
        {
          partner: industryPartner._id,
          role: "funder",
          joinedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
          status: "accepted",
          contributions: [
            {
              title: "15 Tonnes of Granulated Blast Furnace Slag",
              detail: "High-CaO (42.4%) alkaline slag for passive acid mine runoff neutralization",
              date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
            },
            {
              title: "₹1,50,000 CSR Grant",
              detail: "CSR funding for trench excavation, non-woven geotextile liners, and site logistics",
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            {
              title: "SAIL R&D Center (RDCIS) Lab Testing Access",
              detail: "Spectrophotometric heavy metal and water quality testing suite",
              date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
      milestones: [
        {
          title: "Milestone 1: Water Chemistry Profiling & Slag Alkalinity Formulation",
          description: "Core sampling of quarry seepage and formulation of slag/bio-char reactive matrix.",
          dueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          status: "completed",
          completedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Milestone 2: Barrier Trench Excavation & 15-Tonne Slag Emplacement",
          description: "Excavation of 3-stage PRB trench in Chas and packing of 15 tonnes of Bokaro Steel slag.",
          dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          status: "completed",
          completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Milestone 3: Field Validation & Farmer Irrigation Restoration",
          description: "Full effluent testing, heavy metal filtration sign-off, and handover to Village Panchayat.",
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: "completed",
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
      messages: [
        {
          sender: universityUser?._id || admin._id,
          senderPartner: universityPartner._id,
          senderName: "Dr. Arvind Kumar (Lead Faculty)",
          senderRole: "lead",
          message:
            "Welcome Bokaro Steel team. We have completed initial pH titration of the Garga runoff. Acidity is extreme at pH 3.18. We require 15 tonnes of granulated slag delivered to the Chas trench site by Tuesday.",
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        },
        {
          sender: industryUser?._id || admin._id,
          senderPartner: industryPartner._id,
          senderName: "Amitabh Verma (CSR & Metallurgy Head, SAIL)",
          senderRole: "collaborator",
          message:
            "Acknowledged Dr. Arvind. Batch #SLAG-B42 (15 tonnes) is cleared from Blast Furnace Yard 3. Lab test certificate attached: 42.4% CaO, negligible sulfides. Our transport team will deliver by 10 AM Tuesday.",
          createdAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
        },
        {
          sender: universityUser?._id || admin._id,
          senderPartner: universityPartner._id,
          senderName: "Dr. Arvind Kumar (Lead Faculty)",
          senderRole: "lead",
          message:
            "Slag shipment received and placed across all 3 permeable reactive trenches. The water passing through the final geotextile barrier has neutralized to pH 7.15, with 94% iron removal! The local farmers have begun pumping clean water.",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          sender: industryUser?._id || admin._id,
          senderPartner: industryPartner._id,
          senderName: "Amitabh Verma (CSR & Metallurgy Head, SAIL)",
          senderRole: "collaborator",
          message:
            "Outstanding achievement! This is a landmark model of circular economy converting industrial by-products into civic ecological relief. Bokaro Steel CSR committee has cleared final logistics funding. Ready for completion review.",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log(`  ${colors.green}✓ Project Created with Bokaro Steel Collaboration: ${project._id}${colors.reset}`);
    console.log(`    Contributed: 15 Tonnes Slag + ₹1,50,000 CSR Grant + Lab Access`);
    console.log(`    Messages Exchanged: 4 threaded two-way updates`);
    console.log(`    Milestones Completed: 3 of 3 (100%)`);

    // --------------------------------------------------------------------------
    // 9. SUMMARY OF WHAT CAN BE DEMONSTRATED IN THE UI
    // --------------------------------------------------------------------------
    console.log(`\n${colors.bold}${colors.magenta}==============================================================================`);
    console.log(`   SHOWCASE SCENARIO MOUNTED SUCCESSFULLY!                                    `);
    console.log(`==============================================================================${colors.reset}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Mount error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

mountShowcase();
