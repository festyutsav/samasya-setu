// ========================================
// SAMASYASETU PARTNER SEED SCRIPT
// ========================================
// Populates the Partner collection with 30
// Jharkhand universities and 20 Jharkhand
// industries, plus linked login accounts.
//
// Usage:
//   node server/scripts/seedPartners.js
// ========================================

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const User = require(path.join(__dirname, "..", "models", "User"));
const Partner = require(path.join(__dirname, "..", "models", "Partner"));

// ========================================
// SEED DATA
// ========================================

const universities = [
  {
    name: "Central University of Jharkhand",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "contact@cuj.ac.in",
    website: "https://www.cuj.ac.in",
    description:
      "Central University established in 2009 offering Arts, Science, Engineering and Management programs with focus on tribal and regional development.",
    expertise: [
      "agriculture",
      "environment",
      "technology",
      "education",
      "healthcare",
    ],
    capabilities: [
      "research_development",
      "data_analysis",
      "field_surveys",
      "innovation_labs",
    ],
    districtsServed: ["Ranchi", "Khunti", "Ramgarh"],
    password: "cuj@2025",
  },
  {
    name: "Indian Institute of Technology (ISM) Dhanbad",
    type: "university",
    location: "Dhanbad, Jharkhand",
    email: "admin@iitism.ac.in",
    website: "https://www.iitism.ac.in",
    description:
      "Premier Institute of National Importance excelling in Science, Technology and Management with strong mining and earth sciences focus.",
    expertise: [
      "technology",
      "energy",
      "environment",
      "mining",
      "water",
    ],
    capabilities: [
      "research_development",
      "prototyping",
      "field_surveys",
      "innovation_labs",
    ],
    districtsServed: ["Dhanbad", "Bokaro", "Giridih", "Ramgarh"],
    password: "iitd@2025",
  },
  {
    name: "All India Institute of Medical Sciences Deoghar",
    type: "university",
    location: "Deoghar, Jharkhand",
    email: "info@aiimsdeoghar.edu.in",
    website: "https://www.aiimsdeoghar.edu.in",
    description:
      "Central medical institute providing super-specialty healthcare and medical education with rural outreach programs.",
    expertise: ["healthcare", "public_safety", "education"],
    capabilities: [
      "healthcare_services",
      "research_development",
      "field_surveys",
      "training",
    ],
    districtsServed: ["Deoghar", "Dumka", "Godda", "Sahebganj"],
    password: "aiimsd@2025",
  },
  {
    name: "Indian Institute of Information Technology Ranchi",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@iiitranchi.ac.in",
    website: "https://www.iiitranchi.ac.in",
    description:
      "Institute of National Importance focused on Information Technology, Computer Science and Management with innovation-driven curriculum.",
    expertise: ["technology", "education", "environment"],
    capabilities: [
      "software_development",
      "innovation_labs",
      "data_analysis",
      "prototyping",
    ],
    districtsServed: ["Ranchi", "Namkum", "Khunti"],
    password: "iiitr@2025",
  },
  {
    name: "National Institute of Technology Jamshedpur",
    type: "university",
    location: "Jamshedpur, Jharkhand",
    email: "admin@nitjsr.ac.in",
    website: "https://www.nitjsr.ac.in",
    description:
      "NIT offering Science, Technology and Management programs with strong industry linkages and research culture.",
    expertise: [
      "technology",
      "engineering",
      "manufacturing",
      "environment",
    ],
    capabilities: [
      "prototyping",
      "research_development",
      "field_surveys",
      "innovation_labs",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
    ],
    password: "nitj@2025",
  },
  {
    name: "Indian Institute of Management Ranchi",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@iimranchi.ac.in",
    website: "https://www.iimranchi.ac.in",
    description:
      "Premier management institute with programs in rural development, sustainable mining analytics and tribal economy solutions.",
    expertise: [
      "agriculture",
      "education",
      "environment",
      "rural_development",
    ],
    capabilities: [
      "consulting",
      "data_analysis",
      "research_development",
      "policy_design",
    ],
    districtsServed: ["Ranchi", "Khunti", "Lohardaga", "Gumla"],
    password: "iimr@2025",
  },
  {
    name: "Birla Institute of Technology Mesra",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@bitmesra.ac.in",
    website: "https://www.bitmesra.ac.in",
    description:
      "Deemed university with excellence in engineering, technology, sciences and management. Strong industry connect and research output.",
    expertise: [
      "technology",
      "engineering",
      "energy",
      "environment",
      "healthcare",
    ],
    capabilities: [
      "research_development",
      "prototyping",
      "software_development",
      "innovation_labs",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Dhanbad", "Ramgarh"],
    password: "bitm@2025",
  },
  {
    name: "National Institute of Advanced Manufacturing Technology",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "director@niamtranchi.org",
    website: "https://www.niamtranchi.org",
    description:
      "Deemed university focused on advanced manufacturing, foundry technology, production engineering and industrial tooling.",
    expertise: [
      "technology",
      "engineering",
      "manufacturing",
      "energy",
    ],
    capabilities: [
      "prototyping",
      "manufacturing",
      "training",
      "research_development",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Jamshedpur"],
    password: "niamt@2025",
  },
  {
    name: "Ranchi University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "vc@ranchiuniversity.ac.in",
    website: "http://www.ranchiuniversity.ac.in",
    description:
      "Oldest state university with multidisciplinary programs in arts, science, commerce, law and medicine. Affiliates 30+ colleges.",
    expertise: [
      "education",
      "healthcare",
      "environment",
      "agriculture",
      "public_safety",
    ],
    capabilities: [
      "field_surveys",
      "research_development",
      "training",
      "data_analysis",
    ],
    districtsServed: ["Ranchi", "Khunti", "Ramgarh", "Latehar"],
    password: "ru@2025",
  },
  {
    name: "Vinoba Bhave University",
    type: "university",
    location: "Hazaribagh, Jharkhand",
    email: "vc@vbu.ac.in",
    website: "https://www.vbu.ac.in",
    description:
      "State university promoting humanities, sciences, vocational courses and environmental studies for central Jharkhand.",
    expertise: [
      "education",
      "environment",
      "agriculture",
      "public_safety",
    ],
    capabilities: [
      "research_development",
      "field_surveys",
      "training",
      "policy_design",
    ],
    districtsServed: [
      "Hazaribagh",
      "Koderma",
      "Giridih",
      "Chatra",
      "Ramgarh",
    ],
    password: "vbu@2025",
  },
  {
    name: "Sido Kanhu Murmu University",
    type: "university",
    location: "Dumka, Jharkhand",
    email: "vc@skmu.ac.in",
    website: "https://www.skmu.ac.in",
    description:
      "State university headquartered in tribal Santhal Parganas region, focusing on inclusive higher education and community development.",
    expertise: [
      "education",
      "agriculture",
      "healthcare",
      "rural_development",
      "tribal_welfare",
    ],
    capabilities: [
      "field_surveys",
      "training",
      "research_development",
      "community_outreach",
    ],
    districtsServed: [
      "Dumka",
      "Pakur",
      "Jamtara",
      "Godda",
      "Sahibganj",
    ],
    password: "skmu@2025",
  },
  {
    name: "Kolhan University",
    type: "university",
    location: "Chaibasa, Jharkhand",
    email: "vc@kolhanuniversity.ac.in",
    website: "http://www.kolhanuniversity.ac.in",
    description:
      "State university serving East Singhbhum, West Singhbhum and Seraikela-Kharsawan with 19 constituent and 33 affiliated colleges.",
    expertise: [
      "education",
      "agriculture",
      "healthcare",
      "tribal_welfare",
    ],
    capabilities: [
      "field_surveys",
      "training",
      "research_development",
      "community_outreach",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Seraikela Kharsawan",
    ],
    password: "ku@2025",
  },
  {
    name: "Nilamber-Pitamber University",
    type: "university",
    location: "Medininagar, Jharkhand",
    email: "vc@npu.ac.in",
    website: "http://npu.ac.in",
    description:
      "State university managing colleges across Palamu, Garhwa and Latehar districts with focus on tribal and rural higher education.",
    expertise: [
      "education",
      "agriculture",
      "healthcare",
      "forestry",
    ],
    capabilities: [
      "field_surveys",
      "training",
      "research_development",
      "community_outreach",
    ],
    districtsServed: ["Palamu", "Garhwa", "Latehar"],
    password: "npu@2025",
  },
  {
    name: "Birsa Agricultural University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "vc@bau.ac.in",
    website: "https://www.bau.ac.in",
    description:
      "Specialized agricultural university with colleges of agriculture, forestry, veterinary sciences and agricultural engineering.",
    expertise: ["agriculture", "environment", "water", "rural_development"],
    capabilities: [
      "field_surveys",
      "research_development",
      "training",
      "prototyping",
    ],
    districtsServed: [
      "Ranchi",
      "Khunti",
      "Gumla",
      "Simdega",
      "Lohardaga",
    ],
    password: "bau@2025",
  },
  {
    name: "Jharkhand University of Technology",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "vc@jutranchi.ac.in",
    website: "https://www.jutranchi.ac.in",
    description:
      "State technical university affiliating engineering colleges across Jharkhand with focus on technology and management education.",
    expertise: [
      "technology",
      "engineering",
      "energy",
      "manufacturing",
    ],
    capabilities: [
      "software_development",
      "prototyping",
      "training",
      "innovation_labs",
    ],
    districtsServed: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    password: "jut@2025",
  },
  {
    name: "Amity University Ranchi",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@amity.edu",
    website: "https://www.amity.edu/ranchi",
    description:
      "Private university offering engineering, management, law, biotechnology programs with NAAC A+ accreditation.",
    expertise: [
      "technology",
      "engineering",
      "healthcare",
      "education",
      "management",
    ],
    capabilities: [
      "research_development",
      "software_development",
      "training",
      "data_analysis",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Dhanbad"],
    password: "amity@2025",
  },
  {
    name: "Arka Jain University",
    type: "university",
    location: "Gamharia, Jharkhand",
    email: "info@arkajainuniversity.ac.in",
    website: "https://www.arkajainuniversity.ac.in",
    description:
      "Private university offering engineering, commerce, arts and sciences with focus on skill-based and industry-oriented education.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "education",
    ],
    capabilities: [
      "training",
      "software_development",
      "research_development",
      "field_surveys",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
    ],
    password: "ajau@2025",
  },
  {
    name: "National University of Study and Research in Law",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@nusrl.ac.in",
    website: "https://www.nusrl.ac.in",
    description:
      "National Law University offering integrated law programs, research and policy advocacy with focus on tribal and human rights law.",
    expertise: ["law", "public_administration", "governance"],
    capabilities: [
      "policy_design",
      "legal_research",
      "training",
      "community_outreach",
    ],
    districtsServed: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    password: "nusrl@2025",
  },
  {
    name: "Capital University",
    type: "university",
    location: "Koderma, Jharkhand",
    email: "info@capitaluniversity.edu.in",
    website: "https://www.capitaluniversity.edu.in",
    description:
      "Private university offering multidisciplinary programs in engineering, management, pharmacy and agricultural sciences.",
    expertise: [
      "engineering",
      "technology",
      "pharmacy",
      "agriculture",
      "management",
    ],
    capabilities: [
      "research_development",
      "prototyping",
      "training",
      "field_surveys",
    ],
    districtsServed: ["Koderma", "Hazaribagh", "Giridih", "Bokaro"],
    password: "cu@2025",
  },
  {
    name: "Netaji Subhas University",
    type: "university",
    location: "Jamshedpur, Jharkhand",
    email: "info@nsubhasuniversity.com",
    website: "https://www.nsubhasuniversity.com",
    description:
      "Private university offering engineering, management, pharmacy and sciences with emphasis on industry-relevant curriculum.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "pharmacy",
    ],
    capabilities: [
      "training",
      "research_development",
      "software_development",
      "prototyping",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
    ],
    password: "nsu@2025",
  },
  {
    name: "Dr. Shyama Prasad Mukherjee University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "vc@dspmuranchi.ac.in",
    website: "https://www.dspmuranchi.ac.in",
    description:
      "State university formed from Ranchi College, offering arts, science and commerce with strong research focus.",
    expertise: [
      "education",
      "environment",
      "agriculture",
      "public_safety",
    ],
    capabilities: [
      "research_development",
      "field_surveys",
      "training",
      "data_analysis",
    ],
    districtsServed: ["Ranchi", "Khunti", "Ramgarh"],
    password: "dspm@2025",
  },
  {
    name: "Jharkhand Raksha Shakti University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "vc@jrsumail.ac.in",
    website: "https://www.jrsumail.ac.in",
    description:
      "State university focused on police science, security management, forensic science and defense studies.",
    expertise: [
      "public_safety",
      "law",
      "forensics",
      "cybersecurity",
    ],
    capabilities: [
      "training",
      "research_development",
      "policy_design",
      "field_surveys",
    ],
    districtsServed: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    password: "jrsu@2025",
  },
  {
    name: "Radha Govind University",
    type: "university",
    location: "Ramgarh, Jharkhand",
    email: "info@radhagovinduniversity.ac.in",
    website: "https://www.radhagovinduniversity.ac.in",
    description:
      "Private university offering engineering, management, pharmacy, law and education programs.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "pharmacy",
      "education",
    ],
    capabilities: [
      "training",
      "research_development",
      "prototyping",
      "field_surveys",
    ],
    districtsServed: ["Ramgarh", "Hazaribagh", "Bokaro", "Dhanbad"],
    password: "rgu@2025",
  },
  {
    name: "YBN University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@ybnu.ac.in",
    website: "https://www.ybnu.ac.in",
    description:
      "Private university offering engineering, management, pharmacy, law and nursing programs.",
    expertise: [
      "engineering",
      "technology",
      "healthcare",
      "management",
      "education",
    ],
    capabilities: [
      "training",
      "research_development",
      "healthcare_services",
      "prototyping",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Jamshedpur"],
    password: "ybnu@2025",
  },
  {
    name: "Sai Nath University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@sainathuniversity.ac.in",
    website: "https://www.sainathuniversity.ac.in",
    description:
      "Private university offering multidisciplinary programs in arts, science, commerce, management and education.",
    expertise: [
      "education",
      "agriculture",
      "management",
      "environment",
    ],
    capabilities: [
      "training",
      "field_surveys",
      "research_development",
      "community_outreach",
    ],
    districtsServed: [
      "Ranchi",
      "Khunti",
      "Gumla",
      "Lohardaga",
      "Simdega",
    ],
    password: "snu@2025",
  },
  {
    name: "Usha Martin University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@ushamartinuniversity.ac.in",
    website: "https://www.ushamartinuniversity.ac.in",
    description:
      "Private university offering engineering, management, pharmacy, law and humanities programs.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "law",
      "pharmacy",
    ],
    capabilities: [
      "training",
      "research_development",
      "prototyping",
      "software_development",
    ],
    districtsServed: ["Ranchi", "Jamshedpur", "Dhanbad"],
    password: "umu@2025",
  },
  {
    name: "Sarala Birla University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@saralabirlauniversity.ac.in",
    website: "https://www.saralabirlauniversity.ac.in",
    description:
      "Private university offering engineering, management, law, pharmacy and education programs.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "education",
      "law",
    ],
    capabilities: [
      "training",
      "research_development",
      "software_development",
      "prototyping",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Jamshedpur", "Dhanbad"],
    password: "sbu@2025",
  },
  {
    name: "Pragyan International University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@pragyanuniversity.edu.in",
    website: "https://www.pragyanuniversity.edu.in",
    description:
      "Private university offering engineering, management, pharmacy, law and education programs.",
    expertise: [
      "technology",
      "management",
      "pharmacy",
      "education",
      "engineering",
    ],
    capabilities: [
      "training",
      "research_development",
      "software_development",
      "field_surveys",
    ],
    districtsServed: ["Ranchi", "Khunti", "Ramgarh"],
    password: "piu@2025",
  },
  {
    name: "Jharkhand Rai University",
    type: "university",
    location: "Ranchi, Jharkhand",
    email: "info@jru.ac.in",
    website: "https://www.jru.ac.in",
    description:
      "Private university offering engineering, management, pharmacy, law and computer applications.",
    expertise: [
      "engineering",
      "technology",
      "management",
      "pharmacy",
      "computer_science",
    ],
    capabilities: [
      "software_development",
      "training",
      "research_development",
      "prototyping",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Dhanbad", "Jamshedpur"],
    password: "jru@2025",
  },
  {
    name: "Ramchandra Chandravansi University",
    type: "university",
    location: "Palamu, Jharkhand",
    email: "info@rcu.ac.in",
    website: "https://www.rcu.ac.in",
    description:
      "Private university serving Palamu, Garhwa and Latehar districts with focus on medical, engineering and management education.",
    expertise: [
      "healthcare",
      "engineering",
      "technology",
      "agriculture",
      "education",
    ],
    capabilities: [
      "healthcare_services",
      "training",
      "field_surveys",
      "research_development",
    ],
    districtsServed: ["Palamu", "Garhwa", "Latehar"],
    password: "rcu@2025",
  },
];

const industries = [
  {
    name: "Tata Steel",
    type: "industry",
    location: "Jamshedpur, Jharkhand",
    email: "corporate@tatasteel.com",
    website: "https://www.tatasteel.com",
    description:
      "World's 10th largest steel manufacturer with major operations in Jamshedpur. Strong in R&D, manufacturing, sustainability and community development.",
    expertise: [
      "manufacturing",
      "energy",
      "environment",
      "technology",
      "infrastructure",
    ],
    capabilities: [
      "prototyping",
      "manufacturing",
      "funding",
      "research_development",
      "field_surveys",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
      "Ranchi",
    ],
    password: "ts@2025",
  },
  {
    name: "Tata Motors",
    type: "industry",
    location: "Jamshedpur, Jharkhand",
    email: "contact@tatamotors.com",
    website: "https://www.tatamotors.com",
    description:
      "One of India's largest commercial vehicle manufacturers with a major plant in Jamshedpur. Expertise in automotive engineering and supply chains.",
    expertise: [
      "manufacturing",
      "engineering",
      "technology",
      "transportation",
      "energy",
    ],
    capabilities: [
      "prototyping",
      "manufacturing",
      "training",
      "research_development",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "Saraikela",
    ],
    password: "tm@2025",
  },
  {
    name: "Bokaro Steel Plant",
    type: "industry",
    location: "Bokaro, Jharkhand",
    email: "info@sailbokaro.co.in",
    website: "https://www.sailbokaro.co.in",
    description:
      "One of India's largest steel plants under SAIL. Major hub for steel, power, cement and chemical industries.",
    expertise: [
      "manufacturing",
      "energy",
      "environment",
      "infrastructure",
      "technology",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "research_development",
      "field_surveys",
    ],
    districtsServed: [
      "Bokaro",
      "Dhanbad",
      "Giridih",
      "Ramgarh",
      "Hazaribagh",
    ],
    password: "bsp@2025",
  },
  {
    name: "Usha Martin",
    type: "industry",
    location: "Ranchi, Jharkhand",
    email: "info@ushamartin.com",
    website: "https://www.ushamartin.com",
    description:
      "Leading wire rope and specialty steel manufacturer with strong R&D in material science and structural engineering.",
    expertise: [
      "manufacturing",
      "engineering",
      "technology",
      "infrastructure",
    ],
    capabilities: [
      "prototyping",
      "manufacturing",
      "research_development",
      "testing",
    ],
    districtsServed: ["Ranchi", "Bokaro", "Jamshedpur", "Dhanbad"],
    password: "um@2025",
  },
  {
    name: "Electrosteel Castings",
    type: "industry",
    location: "Bokaro, Jharkhand",
    email: "info@electrosteel.com",
    website: "https://www.electrosteel.com",
    description:
      "Global leader in ductile iron pipes with manufacturing in Bokaro. Strong in water infrastructure and metallurgy.",
    expertise: [
      "manufacturing",
      "water",
      "infrastructure",
      "environment",
      "technology",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "research_development",
      "deployment",
    ],
    districtsServed: [
      "Bokaro",
      "Dhanbad",
      "Ranchi",
      "Jamshedpur",
    ],
    password: "ec@2025",
  },
  {
    name: "Hindustan Copper Limited",
    type: "industry",
    location: "Singhbhum, Jharkhand",
    email: "contact@hindustancopper.com",
    website: "https://www.hindustancopper.com",
    description:
      "Only integrated copper producer in India. Operations in Singhbhum with expertise in mining, metallurgy and sustainable extraction.",
    expertise: [
      "mining",
      "energy",
      "environment",
      "manufacturing",
      "technology",
    ],
    capabilities: [
      "mining_operations",
      "research_development",
      "field_surveys",
      "prototyping",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Seraikela Kharsawan",
    ],
    password: "hcl@2025",
  },
  {
    name: "Central Coalfields Limited",
    type: "industry",
    location: "Ranchi, Jharkhand",
    email: "contact@centralcoalfields.in",
    website: "https://www.centralcoalfields.in",
    description:
      "CIL subsidiary with major coal mining operations across Dhanbad, Bokaro, Giridih and Ramgarh. Involved in CSR and community development.",
    expertise: [
      "energy",
      "mining",
      "environment",
      "infrastructure",
      "rural_development",
    ],
    capabilities: [
      "mining_operations",
      "funding",
      "field_surveys",
      "community_outreach",
    ],
    districtsServed: [
      "Dhanbad",
      "Bokaro",
      "Giridih",
      "Ramgarh",
      "Ranchi",
    ],
    password: "ccl@2025",
  },
  {
    name: "ACC Limited",
    type: "industry",
    location: "Chaibasa, Jharkhand",
    email: "info@acc.in",
    website: "https://www.acc.in",
    description:
      "Leading cement manufacturer with plant at Chaibasa. Strong in building materials, sustainable construction and logistics.",
    expertise: [
      "manufacturing",
      "infrastructure",
      "construction",
      "environment",
    ],
    capabilities: [
      "manufacturing",
      "deployment",
      "research_development",
      "training",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Seraikela Kharsawan",
    ],
    password: "acc@2025",
  },
  {
    name: "Uranium Corporation of India",
    type: "industry",
    location: "Singhbhum, Jharkhand",
    email: "info@ucil.gov.in",
    website: "https://www.ucil.gov.in",
    description:
      "Only uranium producer in India. Operations in Singhbhum with focus on nuclear fuel, mining safety and environmental management.",
    expertise: [
      "energy",
      "mining",
      "environment",
      "technology",
      "safety",
    ],
    capabilities: [
      "mining_operations",
      "research_development",
      "field_surveys",
      "testing",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Seraikela Kharsawan",
    ],
    password: "uci@2025",
  },
  {
    name: "Adhunik Group of Industries",
    type: "industry",
    location: "Jamshedpur, Jharkhand",
    email: "info@adhunikgroup.com",
    website: "https://www.adhunikgroup.com",
    description:
      "Integrated steel, power and mining group with sponge iron, steel products and captive power plants.",
    expertise: [
      "manufacturing",
      "energy",
      "mining",
      "infrastructure",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "funding",
      "research_development",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
    ],
    password: "ag@2025",
  },
  {
    name: "ESL Steel Limited",
    type: "industry",
    location: "Bokaro, Jharkhand",
    email: "info@eslsteel.com",
    website: "https://www.eslsteel.com",
    description:
      "Formerly Electrosteel Steels, now part of Vedanta. Large greenfield steel plant with ductile iron pipe and steelmaking capabilities.",
    expertise: [
      "manufacturing",
      "steel",
      "infrastructure",
      "environment",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "research_development",
      "deployment",
    ],
    districtsServed: ["Bokaro", "Dhanbad", "Ranchi", "Jamshedpur"],
    password: "esl@2025",
  },
  {
    name: "Jindal Steel and Power",
    type: "industry",
    location: "Jamshedpur / Angul",
    email: "info@jindalsteel.com",
    website: "https://www.jindalsteel.com",
    description:
      "Major steel and power producer with operations in Jharkhand. Strong in steel products, power generation and rural infrastructure.",
    expertise: [
      "manufacturing",
      "energy",
      "infrastructure",
      "mining",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "funding",
      "research_development",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
      "Ranchi",
    ],
    password: "jsp@2025",
  },
  {
    name: "Steel Authority of India Limited",
    type: "industry",
    location: "Ranchi / Bokaro / Dhanbad",
    email: "contact@sail.co.in",
    website: "https://www.sail.co.in",
    description:
      "India's largest steel producer with plants in Bokaro, Dhanbad and Ranchi. Major CSR contributor in education and healthcare.",
    expertise: [
      "manufacturing",
      "energy",
      "environment",
      "infrastructure",
      "education",
    ],
    capabilities: [
      "manufacturing",
      "prototyping",
      "funding",
      "community_outreach",
      "training",
    ],
    districtsServed: [
      "Bokaro",
      "Dhanbad",
      "Ranchi",
      "Giridih",
      "Ramgarh",
    ],
    password: "sail@2025",
  },
  {
    name: "NMDC Limited",
    type: "industry",
    location: "Bokaro / Singhbhum",
    email: "contact@nmdc.co.in",
    website: "https://www.nmdc.co.in",
    description:
      "Largest iron ore producer in India with mining operations in Jharkhand. Strong in mineral exploration and sustainable mining.",
    expertise: [
      "mining",
      "environment",
      "energy",
      "infrastructure",
    ],
    capabilities: [
      "mining_operations",
      "field_surveys",
      "research_development",
      "testing",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Bokaro",
      "Dhanbad",
    ],
    password: "nmdc@2025",
  },
  {
    name: "TRF Limited",
    type: "industry",
    location: "Jamshedpur, Jharkhand",
    email: "info@trf.tatagroup.com",
    website: "https://www.trf.tatagroup.com",
    description:
      "Tata Group company specializing in material handling, mining equipment and industrial solutions.",
    expertise: [
      "engineering",
      "technology",
      "mining",
      "manufacturing",
    ],
    capabilities: [
      "prototyping",
      "manufacturing",
      "research_development",
      "deployment",
    ],
    districtsServed: [
      "East Singhbhum",
      "Seraikela Kharsawan",
      "West Singhbhum",
    ],
    password: "trf@2025",
  },
  {
    name: "Jharkhand State Forest Development Corporation",
    type: "industry",
    location: "Ranchi, Jharkhand",
    email: "info@jsfdc.org",
    website: "https://www.jsfdc.org",
    description:
      "State enterprise focused on forest management, wildlife conservation, afforestation and eco-tourism in Jharkhand.",
    expertise: [
      "environment",
      "forestry",
      "wildlife",
      "sustainability",
    ],
    capabilities: [
      "field_surveys",
      "community_outreach",
      "training",
      "data_analysis",
    ],
    districtsServed: [
      "Ranchi",
      "Khunti",
      "Gumla",
      "Simdega",
      "Lohardaga",
      "West Singhbhum",
    ],
    password: "jsfdc@2025",
  },
  {
    name: "Hindustan Zinc Limited",
    type: "industry",
    location: "Jamshedpur / Singhbhum",
    email: "info@hindustanzinc.com",
    website: "https://www.hindustanzinc.com",
    description:
      "Integrated zinc, lead and silver producer with operations in Jharkhand. Strong in mining, metallurgy and sustainability.",
    expertise: [
      "mining",
      "energy",
      "environment",
      "manufacturing",
    ],
    capabilities: [
      "mining_operations",
      "manufacturing",
      "research_development",
      "testing",
    ],
    districtsServed: [
      "East Singhbhum",
      "West Singhbhum",
      "Seraikela Kharsawan",
    ],
    password: "hzl@2025",
  },
];

// ========================================
// HELPERS
// ========================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateUsername = (name, index) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  return `${slug}_${String(index).padStart(2, "0")}`;
};

const generateEmail = (name, type) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const domain = type === "university" ? "edu.in" : "com";

  return `${slug}@${domain}`;
};

const generatePassword = (orgName) => {
  const base = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 8);

  return `${base}@2025`;
};

// ========================================
// SEED FUNCTION
// ========================================

const seedPartners = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected.");

    const allPartners = [...universities, ...industries];

    console.log(`Seeding ${allPartners.length} partners...`);

    const credentials = [];

    for (let i = 0; i < allPartners.length; i++) {
      const data = allPartners[i];

      const username = generateUsername(data.name, i + 1);

      const password = data.password || generatePassword(data.name);

      const email = generateEmail(data.name, data.type);

      const hashedPassword = await bcrypt.hash(password, 12);

      let user = await User.findOne({ username });

      if (!user) {
        user = await User.create({
          username,
          name: data.name,
          email,
          password: hashedPassword,
          role: "partner",
        });
      }

      let partner = await Partner.findOne({ name: data.name });

      if (!partner) {
        partner = await Partner.create({
          name: data.name,
          type: data.type,
          description: data.description,
          location: data.location,
          email: data.email,
          website: data.website,
          expertise: data.expertise || [],
          capabilities: data.capabilities || [],
          districtsServed: data.districtsServed || [],
          user: user._id,
        });

        console.log(`  ✓ ${partner.name}`);
      } else {
        console.log(`  → ${partner.name} already exists, skipping.`);
      }

      credentials.push({
        name: data.name,
        type: data.type,
        username,
        password,
        email: data.email,
        website: data.website,
      });

      await sleep(100);
    }

    // ========================================
    // SAVE CREDENTIALS FILE
    // ========================================

    const fs = require("fs");

    const outputPath = path.join(__dirname, "..", "scripts", "partner_credentials.json");

    fs.writeFileSync(
      outputPath,
      JSON.stringify(credentials, null, 2),
      "utf8"
    );

    console.log(`\nCredentials saved to: ${outputPath}`);

    console.log("\nSeeding complete.");

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedPartners();
