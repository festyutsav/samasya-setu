// ========================================
// SAMASYASETU DEMO DATA SEED
// ========================================
// Replaces all dummy/test citizen data with a realistic,
// living snapshot of the platform:
//   - 6 citizen accounts across Jharkhand
//   - 12 genuine societal problems across categories,
//     districts and every lifecycle stage
//   - university assignments, solution proposals,
//     projects (with industry collaborators) and
//     an active notification stream for every portal
//
// Existing partners + admins are preserved. All citizens,
// problems, proposals, projects and notifications are wiped.
//
// Usage: node server/scripts/seedDemoData.js
// ========================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

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
const {
  recommendPartners,
  saveRoutingAnalysis,
} = require(path.join(__dirname, "..", "services", "aiRoutingService"));

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// createdAt is immutable under Mongoose timestamps, so
// backdating goes through the native driver which bypasses
// schema immutability.

const backdate = async (Model, id, createdDaysAgo, updatedDaysAgo) => {
  await Model.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(String(id)) },
    {
      $set: {
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(updatedDaysAgo ?? createdDaysAgo),
      },
    },
  );
};

// ========================================
// DEMO CITIZENS
// ========================================

const CITIZEN_PASSWORD = "citizen123";

const citizens = [
  {
    name: "Sunita Devi",
    email: "sunita.devi@example.com",
    location: "Ranchi, Jharkhand",
  },
  {
    name: "Ramesh Kumar Mahato",
    email: "ramesh.mahato@example.com",
    location: "Dhanbad, Jharkhand",
  },
  {
    name: "Anita Horo",
    email: "anita.horo@example.com",
    location: "Khunti, Jharkhand",
  },
  {
    name: "Mohammed Farhan Ansari",
    email: "farhan.ansari@example.com",
    location: "Jamshedpur, Jharkhand",
  },
  {
    name: "Prakash Bhagat",
    email: "prakash.bhagat@example.com",
    location: "Deoghar, Jharkhand",
  },
  {
    name: "Laxmi Murmu",
    email: "laxmi.murmu@example.com",
    location: "Dumka, Jharkhand",
  },
];

// ========================================
// DEMO PROBLEMS
// ========================================
// statuses cover the whole pipeline: submitted → under_review
// → assigned → in_progress → solved.

const problems = [
  {
    key: "fluoride_water",
    citizenEmail: "sunita.devi@example.com",
    title: "Fluoride contamination in borewell water, Bhagwanpur",
    description:
      "Handpump and borewell water in Bhagwanpur village turns teeth yellow-brown; the PHC confirmed early skeletal fluorosis in four elderly residents. Lab strips we used show fluoride far above the safe limit. Around 800 people drink this water daily. We need the water tested properly and an affordable defluoridation or safe-supply solution designed for a village of our size.",
    category: "Water Management",
    aiCategory: "water",
    location: "Bhagwanpur, Ranchi, Jharkhand",
    district: "Ranchi",
    lat: 23.42,
    lng: 85.29,
    pincode: "834001",
    affectedPeople: 800,
    severity: "critical",
    status: "in_progress",
    ageDays: 55,
  },
  {
    key: "sand_mining",
    citizenEmail: "farhan.ansari@example.com",
    title: "Illegal sand mining eroding Subarnarekha riverbank farmland",
    description:
      "Night-time sand mining on the Subarnarekha bank near Ghorabandha has eaten almost 6 metres of farmland this year. Two farmers lost their vegetable plots and the river now threatens the village approach road during monsoon. Despite complaints, mining resumes within days. We need continuous monitoring evidence that the administration can act on.",
    category: "Environment",
    aiCategory: "environment",
    location: "Ghorabandha, Jamshedpur, Jharkhand",
    district: "East Singhbhum",
    lat: 22.83,
    lng: 86.28,
    pincode: "831018",
    affectedPeople: 350,
    severity: "high",
    status: "under_review",
    ageDays: 12,
  },
  {
    key: "malaria",
    citizenEmail: "laxmi.murmu@example.com",
    title: "Seasonal malaria surge overwhelming Dumka tribal blocks",
    description:
      "Every monsoon the block hospital runs out of malaria test kits and bed nets, and this year 40+ villagers from our panchayat alone were hospitalised. Stagnant water in abandoned brick pits breeds mosquitoes right next to homes. We need a practical prevention and early-detection programme that health workers can actually run with limited staff.",
    category: "Healthcare",
    aiCategory: "healthcare",
    location: "Saraiyahat Block, Dumka, Jharkhand",
    district: "Dumka",
    lat: 24.32,
    lng: 87.18,
    pincode: "814151",
    affectedPeople: 2400,
    severity: "critical",
    status: "assigned",
    ageDays: 30,
  },
  {
    key: "dropouts",
    citizenEmail: "ramesh.mahato@example.com",
    title: "Middle-school dropout spike among migrant families in Dhanbad",
    description:
      "When families migrate to the coal belt for work between seasons, children in our Kasturba Gandhi Awasiya Vidyalaya catchment drop out — 60 students this year alone, mostly class 6-8. There is no transfer tracking between schools and no bridge classes when they return. We need a system to track migrant children and keep them learning.",
    category: "Education",
    aiCategory: "education",
    location: "Jharia, Dhanbad, Jharkhand",
    district: "Dhanbad",
    lat: 23.75,
    lng: 86.43,
    pincode: "828111",
    affectedPeople: 60,
    severity: "high",
    status: "assigned",
    ageDays: 21,
  },
  {
    key: "handpumps",
    citizenEmail: "anita.horo@example.com",
    title: "12 broken handpumps leave three Hamara Gaon hamlets dry",
    description:
      "Twelve of the eighteen government handpumps in our three hamlets have been broken for over six months. Women walk 2 km each way for water and the summer is coming. The Jal Nigam says parts are 'in process'. We need transparent tracking of repair requests and a maintenance model that does not take half a year per pump.",
    category: "Water Management",
    aiCategory: "water",
    location: "Murhu Block, Khunti, Jharkhand",
    district: "Khunti",
    lat: 23.06,
    lng: 85.31,
    pincode: "835216",
    affectedPeople: 1200,
    severity: "high",
    status: "submitted",
    ageDays: 3,
  },
  {
    key: "stubble",
    citizenEmail: "sunita.devi@example.com",
    title: "Crop residue burning choking villages around Ranchi every winter",
    description:
      "After the paddy harvest, farmers burn stubble because collection and composting is not economical. Our village AQI visibly worsens each November and children with asthma suffer the most. Farmers tell us they would stop if residue collection or vermicomposting were viable. We need a low-cost alternative that reaches small holders.",
    category: "Environment",
    aiCategory: "environment",
    location: "Bero Block, Ranchi, Jharkhand",
    district: "Ranchi",
    lat: 23.33,
    lng: 85.02,
    pincode: "835202",
    affectedPeople: 1500,
    severity: "medium",
    status: "under_review",
    ageDays: 8,
  },
  {
    key: "streetlight",
    citizenEmail: "anita.horo@example.com",
    title: "No street lighting on Murhu haat road, women unsafe after dusk",
    description:
      "The 1.5 km road from Murhu market to Kochoji has no working streetlights after the wiring was stolen two years ago. Women avoid the haat after 5 pm and there have been three snatching incidents. Solar standalones were promised but never arrived. We need safe, theft-resistant lighting installed and maintained.",
    category: "Public Safety",
    aiCategory: "public_safety",
    location: "Murhu, Khunti, Jharkhand",
    district: "Khunti",
    lat: 23.07,
    lng: 85.28,
    pincode: "835216",
    affectedPeople: 900,
    severity: "high",
    status: "submitted",
    ageDays: 1,
  },
  {
    key: "vermicompost",
    citizenEmail: "prakash.bhagat@example.com",
    title: "Vermicompost units idle for want of training and market linkage",
    description:
      "Twelve vermicompost units built under MGNREGA in our panchayat sit idle — farmers were never trained on operations and there is no buyer network. Meanwhile the same farmers buy chemical fertiliser at full price. A working model with training and market linkage would convert waste into income for 200+ families.",
    category: "Agriculture",
    aiCategory: "agriculture",
    location: "Sarwan Block, Deoghar, Jharkhand",
    district: "Deoghar",
    lat: 24.44,
    lng: 86.62,
    pincode: "814121",
    affectedPeople: 200,
    severity: "medium",
    status: "solved",
    ageDays: 120,
  },
  {
    key: "digital_panchayat",
    citizenEmail: "ramesh.mahato@example.com",
    title: "Panchayat staff in Gumla still run schemes entirely on paper",
    description:
      "Our panchayat has 40+ scheme beneficiary lists maintained only in handwritten registers. Pension payments get delayed for months, and RTI replies take weeks because records must be searched by hand. Staff are willing but have no training and no simple software. A light digital register with training would fix 80% of the delays.",
    category: "Technology",
    aiCategory: "technology",
    location: "Gumla Sadar Block, Gumla, Jharkhand",
    district: "Gumla",
    lat: 23.04,
    lng: 84.54,
    pincode: "835207",
    affectedPeople: 5000,
    severity: "medium",
    status: "assigned",
    ageDays: 15,
  },
  {
    key: "drainage",
    citizenEmail: "farhan.ansari@example.com",
    title: "Encroached drains flood Azadnagar every monsoon",
    description:
      "Shops have built over the main storm drain in Azadnagar, so every monsoon knee-deep water enters 150 homes; last year two children got dengue from the stagnant pools. Desilting happens once a year at best. We need the drainage restored and a plan that stops re-encroachment.",
    category: "Waste Management",
    aiCategory: "waste",
    location: "Azadnagar, Jamshedpur, Jharkhand",
    district: "East Singhbhum",
    lat: 22.79,
    lng: 86.19,
    pincode: "831012",
    affectedPeople: 750,
    severity: "high",
    status: "in_progress",
    ageDays: 75,
  },
  {
    key: "crafts",
    citizenEmail: "laxmi.murmu@example.com",
    title: "Dumka tribal artisans have no market beyond weekly haats",
    description:
      "Our soi-paint and bamboo craft cluster of 60 artisans sells only at the weekly haat to middlemen who pay a third of city prices. An e-commerce pilot by a local NGO died for want of logistics and quality packaging. With design input, fair pricing and a delivery partner these crafts could reach urban buyers and double artisan incomes.",
    category: "Other",
    aiCategory: "other",
    location: "Ranishwar Block, Dumka, Jharkhand",
    district: "Dumka",
    lat: 24.18,
    lng: 87.42,
    pincode: "814148",
    affectedPeople: 60,
    severity: "medium",
    status: "in_progress",
    ageDays: 45,
  },
  {
    key: "anganwadi",
    citizenEmail: "prakash.bhagat@example.com",
    title: "Anganwadi centre in Kusunda has no safe drinking water",
    description:
      "The Anganwadi centre that feeds 45 children daily draws water from an open well shared with cattle. Two children had severe diarrhoea last month. A filter or piped connection plus a storage tank would protect the most vulnerable kids in our ward. The centre has space and an electric connection already.",
    category: "Healthcare",
    aiCategory: "healthcare",
    location: "Kusunda, Dhanbad, Jharkhand",
    district: "Dhanbad",
    lat: 23.79,
    lng: 86.42,
    pincode: "828113",
    affectedPeople: 45,
    severity: "high",
    status: "submitted",
    ageDays: 5,
  },
];

// ========================================
// SEED
// ========================================

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    // ========================================
    // ADMIN GUARANTEE
    // ========================================

    const admin = await User.findOne({
      email: "admin@example.com",
      role: "admin",
    });

    if (!admin) {
      console.log("Admin account missing — creating admin@example.com");

      await User.create({
        name: "Government Admin",
        email: "admin@example.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      });
    } else {
      console.log("✓ Admin account present");
    }

    // ========================================
    // WIPE DUMMY DATA
    // ========================================

    console.log("Clearing citizens, problems, proposals, projects, notifications...");

    await Promise.all([
      User.deleteMany({ role: "citizen" }),
      Problem.deleteMany({}),
      SolutionProposal.deleteMany({}),
      Project.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ========================================
    // PARTNER LOOKUP
    // ========================================

    const partners = await Partner.find({});

    const partnerByName = (needle) => {
      const partner = partners.find((p) =>
        p.name.toLowerCase().includes(needle.toLowerCase()),
      );

      if (!partner) {
        throw new Error(`Partner not found for lookup: ${needle}`);
      }

      return partner;
    };

    const iitIsm = partnerByName("Indian Institute of Technology (ISM)");
    const aiimsDeoghar = partnerByName("All India Institute of Medical Sciences");
    const cuj = partnerByName("Central University of Jharkhand");
    const nitJamshedpur = partnerByName("National Institute of Technology Jamshedpur");
    const tataSteel = partnerByName("Tata Steel");

    // ========================================
    // CITIZENS
    // ========================================

    console.log("Creating citizens...");

    const hashedCitizenPassword = await bcrypt.hash(CITIZEN_PASSWORD, 10);

    const citizenByEmail = {};

    for (const citizen of citizens) {
      const user = await User.create({
        name: citizen.name,
        email: citizen.email,
        password: hashedCitizenPassword,
        role: "citizen",
      });

      citizenByEmail[citizen.email] = user;

      await backdate(User, user._id, 90);

      console.log(`  ✓ ${citizen.name} <${citizen.email}>`);
    }

    // Write citizen credentials so admins/demo viewers can log in.

    const credentialsPath = path.join(
      __dirname,
      "demo_citizen_credentials.json",
    );

    fs.writeFileSync(
      credentialsPath,
      JSON.stringify(
        {
          sharedPassword: CITIZEN_PASSWORD,
          citizens: citizens.map(({ name, email }) => ({
            name,
            email,
            password: CITIZEN_PASSWORD,
          })),
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`  ✓ Credentials written to ${credentialsPath}`);

    // ========================================
    // PROBLEMS
    // ========================================

    console.log("Creating problems...");

    const problemByKey = {};

    const priorityFor = (severity) =>
      ({ critical: 78, high: 52, medium: 34, low: 18 })[severity] ?? 30;

    for (const problem of problems) {
      const citizen = citizenByEmail[problem.citizenEmail];

      const doc = await Problem.create({
        title: problem.title,
        description: problem.description,
        category: problem.category,
        aiCategory: problem.aiCategory,
        aiKeywords: problem.title.toLowerCase().split(" ").filter((w) => w.length > 5),
        aiConfidence: 0.88,
        aiSummary: `${problem.description.split(". ")[0]}.`,
        aiPriorityScore: priorityFor(problem.severity),
        aiPriorityBand:
          priorityFor(problem.severity) >= 70
            ? "urgent"
            : priorityFor(problem.severity) >= 45
              ? "elevated"
              : "standard",
        aiPriorityAnalyzedAt: daysAgo(problem.ageDays),
        aiRoutingAnalyzedAt: daysAgo(problem.ageDays),
        location: problem.location,
        locationDetails: {
          district: problem.district,
          state: "Jharkhand",
          pincode: problem.pincode,
          latitude: problem.lat,
          longitude: problem.lng,
        },
        locationPoint: {
          type: "Point",
          coordinates: [problem.lng, problem.lat],
        },
        affectedPeople: problem.affectedPeople,
        severity: problem.severity,
        status: problem.status,
        submittedBy: citizen._id,
        clusterSize: problem.severity === "critical" ? 4 : 1,
      });

      await backdate(Problem, doc._id, problem.ageDays, problem.ageDays);

      problemByKey[problem.key] = doc;

      console.log(`  ✓ [${problem.status}] ${doc.title}`);
    }

    // ========================================
    // AI ROUTING CANDIDATES
    // ========================================
    // Problems created here bypass createProblem, so the
    // routing engine never ran. Compute and persist real
    // suggestions for every problem so the Admin panel shows
    // AI partner recommendations out of the box.

    console.log("Running AI routing for each problem...");

    for (const problem of problems) {
      try {
        const { suggestions } = await recommendPartners(problemByKey[problem.key]);

        if (suggestions.length > 0) {
          await saveRoutingAnalysis(problemByKey[problem.key]._id, suggestions);

          console.log(
            `  ✓ ${problem.key}: ${suggestions.map((s) => s.partner.name).join(", ")}`,
          );
        } else {
          console.log(`  ⚠ ${problem.key}: no suggestions`);
        }
      } catch (routingError) {
        console.error(`  ✗ ${problem.key}: ${routingError.message}`);
      }
    }

    // ========================================
    // ASSIGNMENTS
    // ========================================

    console.log("Assigning problems to universities...");

    const assignments = [
      { key: "fluoride_water", partner: iitIsm, daysAgo: 40 },
      { key: "malaria", partner: aiimsDeoghar, daysAgo: 22 },
      { key: "dropouts", partner: cuj, daysAgo: 14 },
      { key: "digital_panchayat", partner: nitJamshedpur, daysAgo: 9 },
      { key: "drainage", partner: nitJamshedpur, daysAgo: 60 },
      { key: "vermicompost", partner: cuj, daysAgo: 100 },
      { key: "crafts", partner: cuj, daysAgo: 35 },
    ];

    for (const assignment of assignments) {
      const problem = problemByKey[assignment.key];

      await Problem.updateOne(
        { _id: problem._id },
        { $set: { assignedPartner: assignment.partner._id } },
      );

      problem.assignedPartner = assignment.partner._id;

      // Citizen + partner notifications for the assignment.

      await createNotification({
        recipientId: problem.submittedBy,
        type: "problem_assigned",
        title: "Your problem has been assigned",
        message: `Your problem "${problem.title}" has been assigned to ${assignment.partner.name} for a solution.`,
        problemId: problem._id,
      });

      await notifyPartnerUser({
        partnerId: assignment.partner._id,
        type: "problem_assigned",
        title: "New problem assigned",
        message: `"${problem.title}" has been assigned to your organization for evaluation and action.`,
        problemId: problem._id,
      });

      const [assignmentDoc] = await Notification.find({
        type: "problem_assigned",
        problem: problem._id,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      if (assignmentDoc) {
        await backdate(Notification, assignmentDoc._id, assignment.daysAgo);
      }

      console.log(`  ✓ ${problem.title.slice(0, 48)}... → ${assignment.partner.name}`);
    }

    // ========================================
    // SOLUTION PROPOSALS
    // ========================================

    console.log("Creating solution proposals...");

    const proposals = [
      {
        problemKey: "fluoride_water",
        partner: iitIsm,
        status: "under_review",
        submittedByDaysAgo: 32,
        title: "Community defluoridation units using activated alumina",
        approach:
          "Phase 1: lab-verify fluoride levels across 12 sampling points. Phase 2: pilot three low-maintenance activated-alumina + activated-carbon filters at the school and two community taps, designed for 200 L/day. Phase 3: train a village water committee on cartridge regeneration. Student team from Environmental Engineering with the district water lab as testing partner.",
        team: [
          { name: "Dr. Arun Kumar Sinha", role: "Professor — Environmental Engineering", email: "aksinha@iitism.ac.in" },
          { name: "Dr. Meera Lakra", role: "Professor — Chemistry", email: "mlakra@iitism.ac.in" },
          { name: "Vikash Ranjan", role: "Student", email: "vikash.ranjan@student.iitism.ac.in" },
          { name: "Pooja Kumari", role: "Student", email: "pooja.kumari@student.iitism.ac.in" },
        ],
        startDateDaysAgo: 28,
        endDateInDays: 120,
        milestones: [
          { title: "Water sampling across 12 points", status: "completed", dueInDays: -14 },
          { title: "Filter prototype assembled", status: "in_progress", dueInDays: 14 },
          { title: "Community pilot installation", status: "pending", dueInDays: 45 },
          { title: "Water committee training + handover", status: "pending", dueInDays: 100 },
        ],
      },
      {
        problemKey: "malaria",
        partner: aiimsDeoghar,
        status: "approved",
        submittedByDaysAgo: 18,
        title: "Block-level malaria early-warning and net programme",
        approach:
          "Community health workers map and treat brick-pit breeding sites, a door-to-door fever-diary system flags cases early, and the block hospital gets a standing kit buffer before monsoon. Public-health students run the data side; AIIMS provides protocol and medical oversight.",
        team: [
          { name: "Dr. Sanjay Prasad", role: "Professor — Community Medicine", email: "sprasad@aiimsdeoghar.edu.in" },
          { name: "Nikita Hansda", role: "Student", email: "nikita.hansda@aiimsdeoghar.edu.in" },
        ],
        startDateDaysAgo: 14,
        endDateInDays: 150,
        milestones: [
          { title: "Breeding-site mapping drive", status: "pending", dueInDays: 20 },
          { title: "Fever-diary pilot in 5 villages", status: "pending", dueInDays: 60 },
          { title: "Kit buffer stock deployment", status: "pending", dueInDays: 110 },
        ],
      },
      {
        problemKey: "dropouts",
        partner: cuj,
        status: "approved",
        submittedByDaysAgo: 10,
        title: "Migrant child tracking + bridge learning programme",
        approach:
          "A shared migrant-child register co-managed by sending and receiving schools, SMS-based attendance check-ins for migrated families, and weekend bridge classes run by B.Ed. students when children return. Education department students handle the data pilot in Jharia first.",
        team: [
          { name: "Dr. Renu Toppo", role: "Professor — Education", email: "rtoppo@cuj.ac.in" },
          { name: "Alok Minz", role: "Student", email: "alok.minz@cuj.ac.in" },
        ],
        startDateDaysAgo: 7,
        endDateInDays: 180,
        milestones: [
          { title: "Register design with 4 schools", status: "pending", dueInDays: 25 },
          { title: "Bridge-class weekend pilot", status: "pending", dueInDays: 90 },
          { title: "Department handover workshop", status: "pending", dueInDays: 160 },
        ],
      },
      {
        problemKey: "drainage",
        partner: nitJamshedpur,
        status: "approved",
        submittedByDaysAgo: 52,
        title: "Drain restoration and encroachment-proof redesign, Azadnagar",
        approach:
          "Survey the choked drain stretch, redesign with grating so shopfronts cannot cover it, desilt with the notified contractor, and set up a resident monitoring group with before/after photo logs. Civil engineering students lead survey and design.",
        team: [
          { name: "Dr. Prabhat Kumar Roy", role: "Professor — Civil Engineering", email: "pkroy@nitjsr.ac.in" },
          { name: "Sneha Agarwal", role: "Student", email: "sneha.agarwal@nitjsr.ac.in" },
        ],
        startDateDaysAgo: 48,
        endDateInDays: 60,
        milestones: [
          { title: "Drain survey and encroachment map", status: "completed", dueInDays: -30 },
          { title: "Grated redesign approved by JNAC", status: "completed", dueInDays: -10 },
          { title: "Desilting + grating installation", status: "in_progress", dueInDays: 25 },
          { title: "Resident monitoring group handover", status: "pending", dueInDays: 55 },
        ],
      },
      {
        problemKey: "vermicompost",
        partner: cuj,
        status: "approved",
        submittedByDaysAgo: 95,
        title: "Vermicompost revival: training, certification and buyer network",
        approach:
          "Retrain all 12 unit operators, standardise output quality with a simple moisture/NPK test protocol, brand the output as 'Sarwan Organic', and link to urban nursery and hotel buyers in Ranchi. Agribusiness students ran the pilot and documented an operating handbook.",
        team: [
          { name: "Dr. Ashok Verma", role: "Professor — Agricultural Extension", email: "averma@cuj.ac.in" },
          { name: "Rina Soy", role: "Student", email: "rina.soy@cuj.ac.in" },
        ],
        startDateDaysAgo: 90,
        endDateInDays: -10,
        milestones: [
          { title: "All 12 units retrained", status: "completed", dueInDays: -60 },
          { title: "Quality protocol + branding", status: "completed", dueInDays: -35 },
          { title: "Buyer network signed (8 buyers)", status: "completed", dueInDays: -15 },
        ],
      },
      {
        problemKey: "crafts",
        partner: cuj,
        status: "under_review",
        submittedByDaysAgo: 20,
        title: "Artisan-to-market bridge: design, packaging and logistics",
        approach:
          "Design-sprint with the cluster to lift product finishing, standardised eco packaging, a shared catalogue with fixed artisan pricing, and a logistics partner for city deliveries. Commerce and design students run the catalogue and accounting basics.",
        team: [
          { name: "Dr. Joyati Bhattacharya", role: "Professor — Commerce", email: "jbhatta@cuj.ac.in" },
          { name: "Suraj Hembrom", role: "Student", email: "suraj.hembrom@cuj.ac.in" },
        ],
        startDateDaysAgo: 15,
        endDateInDays: 130,
        milestones: [
          { title: "Design sprint with 60 artisans", status: "pending", dueInDays: 20 },
          { title: "Catalogue + packaging finalised", status: "pending", dueInDays: 60 },
          { title: "First city exhibition sale", status: "pending", dueInDays: 120 },
        ],
      },
    ];

    const proposalByKey = {};

    for (const proposal of proposals) {
      const problem = problemByKey[proposal.problemKey];

      const doc = await SolutionProposal.create({
        problem: problem._id,
        university: proposal.partner._id,
        submittedBy: (await User.findOne({ partner: proposal.partner._id }))?._id || admin._id,
        title: proposal.title,
        description: proposal.title,
        approach: proposal.approach,
        team: proposal.team.map((member) => ({
          name: member.name,
          role: member.role,
          email: member.email,
        })),
        timeline: {
          startDate: daysAgo(proposal.startDateDaysAgo),
          endDate: new Date(Date.now() + proposal.endDateInDays * 24 * 60 * 60 * 1000),
          milestones: proposal.milestones.map((milestone) => ({
            title: milestone.title,
            description: "",
            dueDate: new Date(Date.now() + milestone.dueInDays * 24 * 60 * 60 * 1000),
            status: milestone.status,
          })),
        },
        documents: [],
        status: proposal.status,
        reviewNotes:
          proposal.status === "approved"
            ? "Sound approach with clear community ownership. Approved."
            : "",
        reviewedBy: proposal.status === "approved" ? admin._id : null,
        reviewedAt: proposal.status === "approved" ? daysAgo(proposal.submittedByDaysAgo - 4) : null,
      });

      await backdate(SolutionProposal, doc._id, proposal.submittedByDaysAgo);

      proposalByKey[proposal.problemKey] = doc;

      // Review notification to the university for approved ones.

      if (proposal.status === "approved") {
        await notifyPartnerUser({
          partnerId: proposal.partner._id,
          type: "proposal_reviewed",
          title: "Proposal approved",
          message: `Your solution proposal "${proposal.title}" for "${problem.title}" was approved by the government admin.`,
          problemId: problem._id,
        });
      }

      console.log(`  ✓ [${proposal.status}] ${proposal.title}`);
    }

    // ========================================
    // PROJECTS
    // ========================================

    console.log("Creating projects with industry collaboration...");

    const projectByKey = {};

    const projectCreatorFor = async (partnerName) => {
      const user = await User.findOne({
        partner: partnerByName(partnerName)._id,
      });

      return user?._id || admin._id;
    };

    const projects = [
      {
        problemKey: "drainage",
        partner: nitJamshedpur,
        creatorPartner: "National Institute of Technology Jamshedpur",
        title: "Azadnagar drain restoration project",
        description:
          "Civil engineering student team restoring the encroached storm drain with a grated, maintenance-friendly redesign and a resident monitoring group.",
        status: "active",
        startedDaysAgo: 45,
        team: [
          { name: "Dr. Prabhat Kumar Roy", role: "professor", department: "Civil Engineering", email: "pkroy@nitjsr.ac.in" },
          { name: "Dr. Shalini Gupta", role: "professor", department: "Environmental Science", email: "sgupta@nitjsr.ac.in" },
          { name: "Sneha Agarwal", role: "student", department: "Civil Engineering", email: "sneha.agarwal@nitjsr.ac.in" },
          { name: "Rohit Besra", role: "student", department: "Civil Engineering", email: "rohit.besra@nitjsr.ac.in" },
        ],
        milestones: [
          { title: "Drain survey and encroachment map", completed: true },
          { title: "Grated redesign approved by JNAC", completed: true },
          { title: "Desilting and grating installation", completed: false },
          { title: "Resident monitoring group handover", completed: false },
        ],
        collaborators: [
          {
            partner: tataSteel,
            role: "co-developer",
            status: "accepted",
            contributions: [
              {
                title: "Excavator and desilting equipment on loan",
                detail: "Provided 2 excavators and 15 labour-days for the desilting drive at no cost.",
                daysAgo: 18,
              },
              {
                title: "Employee volunteering for resident survey",
                detail: "Six CSR volunteers joined the door-to-door flood-damage survey.",
                daysAgo: 10,
              },
            ],
            invitedDaysAgo: 30,
            respondedDaysAgo: 27,
          },
        ],
      },
      {
        problemKey: "fluoride_water",
        partner: iitIsm,
        creatorPartner: "Indian Institute of Technology (ISM)",
        title: "Bhagwanpur safe-water pilot",
        description:
          "Pilot of three community defluoridation filters with a trained village water committee for long-term operation.",
        status: "active",
        startedDaysAgo: 25,
        team: [
          { name: "Dr. Arun Kumar Sinha", role: "professor", department: "Environmental Engineering", email: "aksinha@iitism.ac.in" },
          { name: "Vikash Ranjan", role: "student", department: "Environmental Engineering", email: "vikash.ranjan@student.iitism.ac.in" },
          { name: "Pooja Kumari", role: "student", department: "Chemistry", email: "pooja.kumari@student.iitism.ac.in" },
        ],
        milestones: [
          { title: "Water sampling across 12 points", completed: true },
          { title: "Filter prototype assembled", completed: false },
          { title: "Community pilot installation", completed: false },
          { title: "Water committee training + handover", completed: false },
        ],
        collaborators: [
          {
            partner: tataSteel,
            role: "funder",
            status: "invited",
            invitedDaysAgo: 2,
          },
        ],
      },
      {
        problemKey: "vermicompost",
        partner: cuj,
        creatorPartner: "Central University of Jharkhand",
        title: "Sarwan vermicompost revival",
        description:
          "Completed project that retrained 12 vermicompost units, standardised quality and signed 8 urban buyers under the Sarwan Organic brand.",
        status: "completed",
        startedDaysAgo: 88,
        team: [
          { name: "Dr. Ashok Verma", role: "professor", department: "Agricultural Extension", email: "averma@cuj.ac.in" },
          { name: "Rina Soy", role: "student", department: "Commerce", email: "rina.soy@cuj.ac.in" },
        ],
        milestones: [
          { title: "All 12 units retrained", completed: true },
          { title: "Quality protocol + branding", completed: true },
          { title: "Buyer network signed (8 buyers)", completed: true },
        ],
        collaborators: [],
      },
    ];

    for (const project of projects) {
      const problem = problemByKey[project.problemKey];

      const doc = await Project.create({
        title: project.title,
        description: project.description,
        problem: problem._id,
        partner: project.partner._id,
        team: project.team,
        status: project.status,
        milestones: project.milestones,
        collaborators: project.collaborators.map((collaborator) => ({
          partner: collaborator.partner._id,
          role: collaborator.role,
          status: collaborator.status,
          contributions: (collaborator.contributions || []).map((contribution) => ({
            title: contribution.title,
            detail: contribution.detail,
            date: daysAgo(contribution.daysAgo),
          })),
          invitedBy: admin._id,
          respondedAt: collaborator.respondedDaysAgo
            ? daysAgo(collaborator.respondedDaysAgo)
            : null,
        })),
        createdBy: await projectCreatorFor(project.creatorPartner),
      });

      await backdate(Project, doc._id, project.startedDaysAgo, 3);

      projectByKey[project.problemKey] = doc;

      // Project notifications: admins + citizen.

      await notifyAdmins({
        type: "project_created",
        title: "New solution project",
        message: `${project.partner.name} started the project "${doc.title}" for "${problem.title}".`,
        problemId: problem._id,
      });

      await createNotification({
        recipientId: problem.submittedBy,
        type: "project_created",
        title: "Work has started",
        message: `${project.partner.name} started the project "${doc.title}" on your problem "${problem.title}".`,
        problemId: problem._id,
      });

      // Collaboration notifications.

      for (const collaborator of project.collaborators) {
        await notifyPartnerUser({
          partnerId: collaborator.partner._id,
          type: "collaboration_invited",
          title: "Collaboration invitation",
          message: `${project.partner.name} invited you to join "${doc.title}" as a ${collaborator.role.replace("-", " ")} on the problem "${problem.title}".`,
          problemId: problem._id,
        });

        if (collaborator.status === "accepted") {
          await notifyPartnerUser({
            partnerId: project.partner._id,
            type: "collaboration_responded",
            title: "Invitation accepted",
            message: `${collaborator.partner.name} accepted your invitation to collaborate on "${doc.title}" as a ${collaborator.role.replace("-", " ")}.`,
            problemId: problem._id,
          });

          await notifyAdmins({
            type: "collaboration_responded",
            title: "Collaboration invitation accepted",
            message: `${collaborator.partner.name} accepted the invitation from ${project.partner.name} to collaborate on "${doc.title}".`,
            problemId: problem._id,
          });

          for (const contribution of collaborator.contributions || []) {
            await notifyAdmins({
              type: "collaboration_contribution",
              title: "New collaboration contribution",
              message: `${collaborator.partner.name} logged "${contribution.title}" on "${doc.title}" as a ${collaborator.role.replace("-", " ")}.`,
              problemId: problem._id,
            });
          }
        }
      }

      console.log(`  ✓ [${project.status}] ${doc.title}`);
    }

    // ========================================
    // STATUS + SUBMISSION NOTIFICATIONS
    // ========================================

    console.log("Creating submission and status notifications...");

    for (const problem of problems) {
      const doc = problemByKey[problem.key];

      // New-submission alerts to admins.

      await notifyAdmins({
        type: "problem_submitted",
        title: "New problem submitted",
        message: `${citizenName(problem.citizenEmail)} reported "${doc.title}" in ${doc.location}.`,
        problemId: doc._id,
      });

      // Progress updates to the citizen.

      if (["in_progress", "solved"].includes(problem.status)) {
        await createNotification({
          recipientId: doc.submittedBy,
          type: "problem_status",
          title: problem.status === "solved" ? "Your problem is solved" : "Work is in progress",
          message:
            problem.status === "solved"
              ? `The solution for "${doc.title}" has been deployed and the problem is marked solved.`
              : `Universities and partners have started working on "${doc.title}".`,
          problemId: doc._id,
        });
      }
    }

    // ========================================
    // NOTIFICATION TIMESTAMPS + READ FLAGS
    // ========================================
    // The notify helpers stamp notifications at seed time, so
    // backdate each one to its semantic age: submissions get
    // the problem's age, project events the project's start,
    // collaboration events the invite/response/contribution
    // dates. Anything older than ~2 weeks reads as read.

    console.log("Applying notification timestamps...");

    const processedNotifications = new Set();

    const backdateNotification = async (type, problemId, ageDays, needle) => {
      const query = {
        type,
        problem: problemId,
        _id: { $nin: [...processedNotifications] },
      };

      if (needle) {
        query.message = { $regex: needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      }

      const notification = await Notification.findOne(query).sort({ createdAt: -1 });

      if (!notification) return;

      processedNotifications.add(String(notification._id));

      const createdAt = daysAgo(Math.max(0, ageDays));

      await Notification.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(String(notification._id)) },
        { $set: { createdAt, updatedAt: createdAt } },
      );
    };

    // Submissions → problem age.

    for (const problem of problems) {
      await backdateNotification(
        "problem_submitted",
        problemByKey[problem.key]._id,
        problem.ageDays,
      );
    }

    // Proposal reviews → shortly after submission.

    for (const proposal of proposals) {
      if (proposal.status !== "approved") continue;

      await backdateNotification(
        "proposal_reviewed",
        problemByKey[proposal.problemKey]._id,
        proposal.submittedByDaysAgo - 4,
      );
    }

    // Project events → project start age.

    for (const project of projects) {
      await backdateNotification(
        "project_created",
        problemByKey[project.problemKey]._id,
        project.startedDaysAgo,
      );
    }

    // Collaboration events → invite / response / contribution ages.

    for (const project of projects) {
      for (const collaborator of project.collaborators) {
        await backdateNotification(
          "collaboration_invited",
          problemByKey[project.problemKey]._id,
          collaborator.invitedDaysAgo,
        );

        if (collaborator.status === "accepted") {
          await backdateNotification(
            "collaboration_responded",
            problemByKey[project.problemKey]._id,
            collaborator.respondedDaysAgo,
          );

          for (const contribution of collaborator.contributions || []) {
            await backdateNotification(
              "collaboration_contribution",
              problemByKey[project.problemKey]._id,
              contribution.daysAgo,
              contribution.title,
            );
          }
        }
      }
    }

    // Status updates to citizens → mid-problem age.

    for (const problem of problems) {
      if (!["in_progress", "solved"].includes(problem.status)) continue;

      await backdateNotification(
        "problem_status",
        problemByKey[problem.key]._id,
        Math.max(2, Math.round(problem.ageDays * 0.6)),
      );
    }

    console.log("Setting notification read flags...");

    for (const notification of await Notification.find({})) {
      const ageDays = (Date.now() - notification.createdAt.getTime()) /
        (24 * 60 * 60 * 1000);

      await Notification.updateOne(
        { _id: notification._id },
        { $set: { read: ageDays > 15 } },
      );
    }

    // ========================================
    // SUMMARY
    // ========================================

    const [problemCount, proposalCount, projectCount, citizenCount, notificationCount] =
      await Promise.all([
        Problem.countDocuments(),
        SolutionProposal.countDocuments(),
        Project.countDocuments(),
        User.countDocuments({ role: "citizen" }),
        Notification.countDocuments(),
      ]);

    console.log("\n========================================");
    console.log("DEMO DATA SEEDED SUCCESSFULLY");
    console.log("========================================");
    console.log(`Citizens:       ${citizenCount} (password: ${CITIZEN_PASSWORD})`);
    console.log(`Problems:       ${problemCount}`);
    console.log(`Proposals:      ${proposalCount}`);
    console.log(`Projects:       ${projectCount}`);
    console.log(`Notifications:  ${notificationCount}`);
    console.log(`Admin login:    admin@example.com / admin123`);
    console.log("========================================\n");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// Citizen name lookup helper.

const citizenName = (email) =>
  citizens.find((citizen) => citizen.email === email)?.name || "A citizen";

seed();
