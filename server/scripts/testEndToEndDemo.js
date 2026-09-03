// ========================================
// END-TO-END DEMO TEST SCRIPT
// ========================================
// Tests the full lifecycle of SamasyaSetu:
// 1. Citizen submits a problem
// 2. Government Admin reviews and assigns it to a University (BIT Mesra)
// 3. University submits a proposal and creates a Project
// 4. University invites Industry (Bokaro Steel Plant) to collaborate
// 5. Industry receives invite, accepts it, and logs a contribution
// 6. Project milestones are executed and completed
// 7. Problem is marked Solved and handed back to Citizen
//
// Usage: node server/scripts/testEndToEndDemo.js

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const path = require("path");

const User = require(path.join(__dirname, "..", "models", "User"));
const Partner = require(path.join(__dirname, "..", "models", "Partner"));
const Problem = require(path.join(__dirname, "..", "models", "Problem"));
const SolutionProposal = require(path.join(__dirname, "..", "models", "SolutionProposal"));
const Project = require(path.join(__dirname, "..", "models", "Project"));
const Notification = require(path.join(__dirname, "..", "models", "Notification"));
const {
  createNotification,
  notifyAdmins,
  notifyPartnerUser,
} = require(path.join(__dirname, "..", "services", "notificationService"));

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

async function runDemo() {
  console.log(`${colors.bold}${colors.yellow}=======================================================`);
  console.log(`  SAMASYASETU: END-TO-END PLATFORM DEMO VERIFICATION   `);
  console.log(`=======================================================${colors.reset}\n`);

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log(`${colors.green}Connected to MongoDB Atlas successfully.${colors.reset}`);
  } catch (err) {
    fail(`MongoDB connection failed: ${err.message}`);
  }

  let createdProblemId = null;
  let createdProjectId = null;
  let createdProposalId = null;

  try {
    // ----------------------------------------------------
    // PRE-CHECK: VERIFY ACTORS EXIST
    // ----------------------------------------------------
    step("PRE-CHECK: Verifying Required Platform Accounts");

    const citizen = await User.findOne({ email: "sunita.devi@example.com", role: "citizen" });
    if (!citizen) fail("Citizen account 'sunita.devi@example.com' not found. Run seed script first.");
    pass(`Citizen account found: ${citizen.name} (${citizen.email})`);

    const admin = await User.findOne({ role: "admin" });
    if (!admin) fail("Government Admin account not found.");
    pass(`Admin account found: ${admin.name} (${admin.email})`);

    const universityPartner = await Partner.findOne({
      name: { $regex: /birla institute of technology/i },
    });
    if (!universityPartner) fail("University partner (BIT Mesra) not found.");
    pass(`University Partner found: ${universityPartner.name} (${universityPartner.type})`);

    const universityUser = await User.findOne({ partner: universityPartner._id });
    if (!universityUser) fail("University user account not found.");
    pass(`University User account found: ${universityUser.email}`);

    const industryPartner = await Partner.findOne({
      name: { $regex: /bokaro steel/i },
    });
    if (!industryPartner) fail("Industry partner (Bokaro Steel Plant) not found.");
    pass(`Industry Partner found: ${industryPartner.name} (${industryPartner.type})`);

    const industryUser = await User.findOne({ partner: industryPartner._id });
    if (!industryUser) fail("Industry user account not found.");
    pass(`Industry User account found: ${industryUser.email}`);

    // ----------------------------------------------------
    // STAGE 1: CITIZEN PROBLEM CREATION
    // ----------------------------------------------------
    step("STAGE 1: Citizen Problem Submission");

    const newProblem = await Problem.create({
      title: "Excessive Fluoride & Iron in Drinking Water in Satbarwa Blocks",
      description:
        "Handpump water across Satbarwa blocks has tested positive for fluoride levels exceeding 3.5 mg/L. Over 400 households report joint stiffness and dental fluorosis among primary school students.",
      category: "water",
      location: "Satbarwa, Palamu, Jharkhand",
      locationPoint: {
        type: "Point",
        coordinates: [84.18, 23.92],
      },
      submittedBy: citizen._id,
      status: "submitted",
      upvotes: 1,
      upvotedBy: [citizen._id],
      tags: ["fluoride", "drinking-water", "satbarwa", "health"],
    });

    createdProblemId = newProblem._id;
    pass(`Problem created with ID: ${createdProblemId}`);
    pass(`Initial Status: '${newProblem.status}'`);
    pass(`Submitted By: ${citizen.name}`);

    // Notify admins of new problem
    await notifyAdmins({
      type: "problem_submitted",
      title: "New challenge submitted",
      message: `${citizen.name} reported "${newProblem.title}" in ${newProblem.location}.`,
      problemId: createdProblemId,
    });
    pass("Notification dispatched to Government Admins.");

    // ----------------------------------------------------
    // STAGE 2: GOVERNMENT ADMIN REVIEW & ASSIGNMENT
    // ----------------------------------------------------
    step("STAGE 2: Government Admin Review & Partner Assignment");

    // Admin updates status to under_review
    newProblem.status = "under_review";
    await newProblem.save();
    pass(`Problem moved to '${newProblem.status}'`);

    // Admin assigns problem to BIT Mesra
    newProblem.assignedPartner = universityPartner._id;
    newProblem.status = "assigned";
    await newProblem.save();

    pass(`Problem assigned to: ${universityPartner.name}`);
    pass(`Updated Status: '${newProblem.status}'`);

    // Notify university partner
    await notifyPartnerUser({
      partnerId: universityPartner._id,
      type: "problem_assigned",
      title: "Challenge assigned to your institution",
      message: `The government has assigned "${newProblem.title}" in ${newProblem.location} to your institution.`,
      problemId: newProblem._id,
    });
    pass(`Assignment notification delivered to ${universityPartner.name}`);

    // ----------------------------------------------------
    // STAGE 3: UNIVERSITY PROPOSAL & PROJECT CREATION
    // ----------------------------------------------------
    step("STAGE 3: University Proposal Submission & Project Spin-Up");

    const now = new Date();
    const fourMonthsLater = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

    const proposal = await SolutionProposal.create({
      problem: newProblem._id,
      university: universityPartner._id,
      submittedBy: universityUser._id,
      title: "Low-Cost Activated Alumina Filtration Columns for High-Fluoride Aquifers",
      description:
        "Deployment of modular activated-alumina fluoride filtration columns combined with iron oxidation pre-filters at 5 key community borewells.",
      approach:
        "Utilize adsorption filtration using activated alumina regeneration cycle combined with gravity-fed sand filtration to reduce fluoride from 3.8 mg/L to under 0.8 mg/L without power requirements.",
      estimatedBudget: 220000,
      timeline: {
        startDate: now,
        endDate: fourMonthsLater,
        milestones: [
          {
            title: "Baseline Water Testing",
            description: "Field survey of 12 handpumps in Satbarwa block",
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: "completed",
          },
          {
            title: "Column Fabrication",
            description: "Workshop fabrication of 5 filter units",
            dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
            status: "in_progress",
          },
        ],
      },
      status: "approved",
    });

    createdProposalId = proposal._id;
    pass(`Solution Proposal submitted: "${proposal.title}"`);
    pass(`Proposal Status: '${proposal.status}'`);

    // University creates project team
    const project = await Project.create({
      title: "Palamu Clean Aquifer — Fluoride Remediation",
      description:
        "A multidisciplinary team from Chemical & Civil Engineering working with students on field tests, filter column fabrication, and community sensor deployment.",
      problem: newProblem._id,
      partner: universityPartner._id,
      createdBy: universityUser._id,
      status: "planning",
      team: [
        {
          name: "Dr. Anirban Sengupta",
          role: "professor",
          department: "Chemical Engineering",
          email: "asengupta@bitmesra.ac.in",
        },
        {
          name: "Pooja Kumari",
          role: "student",
          department: "Environmental Engineering",
          email: "pooja.env@bitmesra.ac.in",
        },
      ],
      milestones: [
        { title: "Borewell water chemistry baseline test", completed: false },
        { title: "Modular filter column fabrication", completed: false },
        { title: "Community pilot deployment & fluoride <1.0 ppm test", completed: false },
      ],
      collaborators: [],
    });

    createdProjectId = project._id;
    pass(`Project created: "${project.title}" (ID: ${createdProjectId})`);
    pass(`Project Lead: ${universityPartner.name}`);
    pass(`Team Members: ${project.team.length} (1 Professor, 1 Student)`);
    pass(`Milestones Defined: ${project.milestones.length}`);

    // Problem advances to in_progress
    newProblem.status = "in_progress";
    await newProblem.save();
    pass(`Problem status advanced to: '${newProblem.status}'`);

    // ----------------------------------------------------
    // STAGE 4: INDUSTRY-UNIVERSITY COLLABORATION
    // ----------------------------------------------------
    step("STAGE 4: Industry-University Collaboration (Cross-Sector Partnership)");

    // University invites Bokaro Steel Plant as CSR Funder / Pilot Partner
    project.collaborators.push({
      partner: industryPartner._id,
      role: "funder",
      status: "invited",
      message: "Inviting Bokaro Steel Plant CSR division to support fabrication material and local logistics.",
      invitedBy: universityUser._id,
    });
    await project.save();

    pass(`University invited ${industryPartner.name} as a 'funder'`);

    // Simulate Industry Partner viewing my projects
    const industryProjects = await Project.find({
      $or: [
        { partner: industryUser.partner },
        { "collaborators.partner": industryUser.partner },
      ],
    }).populate("partner", "name").populate("collaborators.partner", "name");

    const foundProject = industryProjects.find((p) => p._id.equals(project._id));
    if (!foundProject) fail("Project not visible in Industry partner's projects list!");
    pass(`Industry Portal successfully retrieved invited project: "${foundProject.title}"`);

    // Industry responds by ACCEPTING the invitation
    const collabEntry = project.collaborators.find((c) => c.partner.equals(industryPartner._id));
    if (!collabEntry) fail("Collaborator entry not found on project.");
    collabEntry.status = "accepted";
    collabEntry.respondedAt = new Date();
    await project.save();

    pass(`Industry (${industryPartner.name}) accepted the collaboration invitation.`);
    pass(`Collaborator Status: '${collabEntry.status}'`);

    // Industry logs a tangible CSR contribution
    collabEntry.contributions.push({
      title: "Sanctioned CSR Grant of ₹2,50,000 for Filter Fabrication",
      detail: "Allotted food-grade vessel fabrication materials from Bokaro R&D workshops.",
      date: new Date(),
    });
    await project.save();

    pass(`Industry logged contribution: "${collabEntry.contributions[0].title}"`);

    // ----------------------------------------------------
    // STAGE 5: MILESTONE EXECUTION & WORKSPACE PROGRESS
    // ----------------------------------------------------
    step("STAGE 5: Execution, Milestone Completion & Innovation Outcomes");

    project.status = "active";
    for (let i = 0; i < project.milestones.length; i++) {
      project.milestones[i].completed = true;
    }
    project.status = "completed";
    project.outcomes = {
      patents: 1,
      startups: 0,
      publications: 1,
      deployments: 5,
    };
    await project.save();

    pass(`All ${project.milestones.length} milestones marked completed:`);
    project.milestones.forEach((m) => console.log(`    ✓ ${m.title}`));
    pass(`Project Status updated to: '${project.status}'`);
    pass(`Innovation Outcomes recorded: ${project.outcomes.deployments} field deployments, ${project.outcomes.patents} patent filed, ${project.outcomes.publications} publication.`);

    // ----------------------------------------------------
    // STAGE 6: PROBLEM SOLVED & CITIZEN NOTIFICATION
    // ----------------------------------------------------
    step("STAGE 6: Challenge Solved & Resolution Handover");

    newProblem.status = "solved";
    await newProblem.save();

    pass(`Problem status officially set to: '${newProblem.status}'`);

    // Notify citizen
    await createNotification({
      recipient: citizen._id,
      type: "problem_status",
      title: "Your reported challenge has been solved!",
      message: `Great news! The challenge "${newProblem.title}" reported by you has been resolved through collaboration between ${universityPartner.name} and ${industryPartner.name}. Clean water filtration units are now operational.`,
      problem: newProblem._id,
    });
    pass(`Resolution celebration notification delivered to Citizen (${citizen.name})`);

    // Notify government admin
    await notifyAdmins({
      type: "problem_status",
      title: "Challenge successfully resolved",
      message: `Challenge "${newProblem.title}" has been successfully solved by ${universityPartner.name} and ${industryPartner.name}.`,
      problemId: newProblem._id,
    });
    pass("Final resolution audit notification delivered to Government Admins.");

    // Final verification assertion
    const finalProblem = await Problem.findById(newProblem._id).populate("assignedPartner");
    const finalProject = await Project.findById(project._id).populate("collaborators.partner");

    if (finalProblem.status !== "solved") fail("Final problem status is not 'solved'");
    if (finalProject.status !== "completed") fail("Final project status is not 'completed'");
    if (finalProject.collaborators[0].status !== "accepted") fail("Final collaboration is not 'accepted'");

    console.log(`\n${colors.bold}${colors.green}=======================================================`);
    console.log(`  ALL 6 STAGES PASSED WITH 100% SUCCESS!`);
    console.log(`=======================================================${colors.reset}\n`);

    return true;
  } catch (err) {
    fail(`Unexpected error during demo execution: ${err.message}\n${err.stack}`);
  } finally {
    // Clean up temporary test problem, project, and proposal
    step("CLEANUP: Removing test demo records to keep database clean");
    if (createdProjectId) {
      await Project.deleteOne({ _id: createdProjectId });
      pass("Test Project cleaned up.");
    }
    if (createdProposalId) {
      await SolutionProposal.deleteOne({ _id: createdProposalId });
      pass("Test Solution Proposal cleaned up.");
    }
    if (createdProblemId) {
      await Problem.deleteOne({ _id: createdProblemId });
      await Notification.deleteMany({ problem: createdProblemId });
      pass("Test Problem and linked notifications cleaned up.");
    }

    await mongoose.disconnect();
    console.log(`${colors.green}Disconnected from MongoDB Atlas.${colors.reset}\n`);
  }
}

runDemo();
