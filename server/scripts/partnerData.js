// ========================================
// PARTNER DATA ENRICHMENT OVERLAY
// ========================================
// Authenticated enrichment dataset for SamasyaSetu partners.
// Every fact below was verified against the organization's
// official website or credible secondary sources during the
// enrichment pass (see partnerEnrichmentSources.md).
//
// Usage:
//   - enrichPartners.js applies this overlay to the live DB.
//   - seedPartners.js applies it after seeding so fresh seeds
//     get the same enriched data.
//
// `removals` lists partners that must not exist in the
// directory (factual errors: no real Jharkhand operations /
// repealed university act).

const removals = [
  // No operational presence in Jharkhand — its Tundoo lead
  // smelter (Dhanbad) is a discontinued unit; all active mines
  // and smelters are in Rajasthan.

  "Hindustan Zinc Limited",

  "Hindustan Zinc",

  // The Pragyan International University Act was repealed by
  // the Jharkhand legislature (Repeal Act, 2023, notified
  // March 2024); the university never commenced teaching and
  // has been removed from the UGC 2(f) list.

  "Pragyan International University Ranchi",

  "Pragyan International University",
];

// ========================================
// ENRICHED PROFILES FOR EXISTING PARTNERS
// ========================================
// Keyed by the exact partner name used in seedPartners.js.

const enrichments = {
  "Central University of Jharkhand": {
    website: "https://www.cuj.ac.in",

    description:
      "Established on 1 March 2009 under the Central Universities Act, 2009, CUJ is a central university in Ranchi with a 510-acre permanent campus at Cheri-Manatu. It offers UG, PG and PhD programmes with an emphasis on research in cutting-edge technologies, and hosts centres for Indigenous Culture Studies, Tribal & Customary Law, and Tribal Folklore, Language & Literature.",

    expertise: ["education", "technology", "environment", "public_safety", "law"],

    capabilities: [
      "research_development",
      "training",
      "field_surveys",
      "data_analysis",
      "community_outreach",
    ],

    districtsServed: ["Ranchi"],
  },

  "Indian Institute of Technology (ISM) Dhanbad": {
    website: "https://www.iitism.ac.in",

    description:
      "Established in 1926 as the Indian School of Mines at Dhanbad, it was conferred IIT status on 6 September 2016. The fully residential 393-acre campus has 18 academic departments and is renowned for mining engineering, earth sciences, petroleum engineering and applied geophysics, offering B.Tech, M.Tech, MSc, MBA and PhD programmes.",

    expertise: ["mining", "energy", "environment", "water", "technology"],

    capabilities: [
      "research_development",
      "testing",
      "consulting",
      "training",
      "innovation_labs",
    ],

    districtsServed: ["Dhanbad"],
  },

  "National Institute of Technology Jamshedpur": {
    website: "https://nitjsr.ac.in",

    description:
      "Established on 15 August 1960 as the Regional Institute of Technology, it was upgraded to a National Institute of Technology on 27 December 2002. The 341.3-acre self-contained campus on Jamshedpur's outskirts has 11 departments spanning engineering, sciences and humanities, with around 200 faculty and 4,000 students.",

    expertise: ["technology", "manufacturing", "energy", "transportation"],

    capabilities: [
      "research_development",
      "prototyping",
      "software_development",
      "training",
      "consulting",
    ],

    districtsServed: ["East Singhbhum"],
  },

  "All India Institute of Medical Sciences Deoghar": {
    website: "https://www.aiimsdeoghar.edu.in",

    email: "admin@aiimsdeoghar.edu.in",

    description:
      "AIIMS Deoghar is a public medical university and hospital of the All India Institutes of Medical Sciences that started operations in 2019 under the Pradhan Mantri Swasthya Suraksha Yojna. Its campus at Devipur spans about 236.92 acres and it provides medical education, research and patient care including OPD, IPD, emergency and laboratory services.",

    expertise: ["healthcare", "education", "public_safety"],

    capabilities: [
      "healthcare_services",
      "research_development",
      "training",
      "testing",
      "community_outreach",
    ],

    districtsServed: ["Deoghar"],
  },

  "Indian Institute of Information Technology Ranchi": {
    website: "https://iiitranchi.ac.in",

    description:
      "Established in 2016, IIIT Ranchi is an Institute of National Importance set up under a public-private partnership by the Ministry of Education, Government of India, Government of Jharkhand and industry partners Tata Technologies, TCS and Central Coalfields. It focuses on information technology, mainly offering undergraduate programmes in computer science and electronics.",

    expertise: ["technology", "education", "mining"],

    capabilities: [
      "software_development",
      "research_development",
      "training",
      "prototyping",
    ],

    districtsServed: ["Ranchi"],
  },

  "Indian Institute of Management Ranchi": {
    website: "https://iimranchi.ac.in",

    description:
      "Established in 2009 under the Government of India, IIM Ranchi is a premier public management institute operating from its permanent residential campus at Prabandhan Nagar, Nayasarai, Ranchi, with an executive education campus in Hyderabad. It offers MBA, MBA-HR, MBA-BA, IPM, PhD and executive education programmes and holds AMBA accreditation.",

    expertise: ["education", "technology", "public_safety"],

    capabilities: [
      "research_development",
      "consulting",
      "training",
      "policy_design",
      "data_analysis",
    ],

    districtsServed: ["Ranchi"],
  },

  "Birla Institute of Technology Mesra": {
    website: "https://www.bitmesra.ac.in",

    description:
      "Founded in 1955 by industrialist B.M. Birla, BIT Mesra is a deemed-to-be university approved by AICTE and recognised by UGC, accredited with an 'A' grade by NAAC. It pioneered India's first Department of Space Engineering and Rocketry (1964) and the Science & Technology Entrepreneurs' Park, and runs a Deoghar Extension Centre.",

    expertise: ["technology", "manufacturing", "environment", "education"],

    capabilities: [
      "research_development",
      "prototyping",
      "innovation_labs",
      "training",
      "software_development",
    ],

    districtsServed: ["Ranchi", "Deoghar"],
  },

  "National Institute of Advanced Manufacturing Technology Ranchi": {
    website: "https://niamt.ac.in",

    email: "smc@niamt.ac.in",

    description:
      "NIAMT Ranchi was established in 1966 by the Government of India with UNESCO assistance as the National Institute of Foundry and Forge Technology and was later renamed National Institute of Advanced Manufacturing Technology. The fully residential 58-acre campus offers UG and PG programmes admitted via JEE Main and CCMT, focused on manufacturing technology.",

    expertise: ["manufacturing", "technology", "energy"],

    capabilities: [
      "research_development",
      "prototyping",
      "manufacturing",
      "testing",
      "training",
    ],

    districtsServed: ["Ranchi"],
  },

  "Ranchi University": {
    website: "http://ranchiuniversity.ac.in",

    description:
      "Ranchi University was established on 12 July 1960 after separation from the erstwhile Bihar University, beginning with ten postgraduate departments, one constituent college and 20 affiliated colleges. A teaching-cum-affiliating state university, it was bifurcated over the years to create Vinoba Bhave, Nilamber-Pitamber, Kolhan and Dr. Shyama Prasad Mukherjee universities, and its jurisdiction now spans five major districts of Jharkhand.",

    expertise: ["education", "healthcare", "environment", "technology"],

    capabilities: [
      "research_development",
      "training",
      "field_surveys",
      "community_outreach",
      "data_analysis",
    ],

    districtsServed: ["Ranchi"],
  },

  "Vinoba Bhave University Hazaribagh": {
    website: "https://www.vbu.ac.in",

    description:
      "Vinoba Bhave University was established in 1992 with its headquarters at Hazaribagh, following bifurcation of Ranchi University. It imparts postgraduate teaching and research in physical, life and earth sciences, social science, humanities, commerce, technology and medical science, and manages colleges including St. Columba's College Hazaribag alongside around seventy affiliated colleges teaching up to undergraduate level.",

    expertise: ["education", "healthcare", "environment", "technology", "law"],

    capabilities: [
      "research_development",
      "training",
      "community_outreach",
      "field_surveys",
    ],

    districtsServed: ["Hazaribagh"],
  },

  "Sido Kanhu Murmu University Dumka": {
    website: "https://skmu.ac.in",

    email: "s.k.m.university.dumka@gmail.com",

    description:
      "Founded on 10 January 1992 by an act of the Bihar Legislative Assembly and renamed Sido Kanhu Murmu University, it is a state university headquartered at Dumka. Its jurisdiction extends over the six districts of Santhal Pargana, where its 13 constituent and 9 permanently affiliated colleges are located, and it received UGC recognition under Section 12(B) in 2007.",

    expertise: ["education", "agriculture", "healthcare"],

    capabilities: [
      "research_development",
      "training",
      "community_outreach",
      "field_surveys",
    ],

    districtsServed: ["Dumka", "Sahibganj", "Godda", "Jamtara", "Pakur"],
  },

  "Kolhan University Chaibasa": {
    website: "https://www.kolhanuniversity.ac.in",

    description:
      "Kolhan University is a public state university established in 2009 at Chaibasa, carved out of Ranchi University. It offers undergraduate and postgraduate courses across constituent and affiliated colleges, with jurisdiction over the East Singhbhum, West Singhbhum and Seraikela-Kharsawan districts of the largely tribal Kolhan region, and is associated with MGM Medical College Jamshedpur.",

    expertise: ["education", "healthcare", "mining", "environment"],

    capabilities: [
      "research_development",
      "training",
      "community_outreach",
      "field_surveys",
    ],

    districtsServed: ["West Singhbhum", "East Singhbhum", "Seraikela-Kharsawan"],
  },

  "Nilamber-Pitamber University Palamu": {
    website: "http://npu.ac.in",

    description:
      "Established on 17 January 2009 with its headquarters at Medininagar (formerly Daltonganj), NPU is a state university in the Palamu division of Jharkhand. It imparts postgraduate education in science, social science, humanities, commerce, education, medicine and dental faculties, and serves constituent and affiliated colleges across the Palamu region, including in Garhwa and Latehar.",

    expertise: ["education", "healthcare", "environment"],

    capabilities: [
      "research_development",
      "training",
      "community_outreach",
      "field_surveys",
    ],

    districtsServed: ["Palamu", "Garhwa", "Latehar"],
  },

  "Birsa Agricultural University Ranchi": {
    website: "https://bauranchi.org",

    description:
      "Established on 26 June 1981 and inaugurated by Prime Minister Indira Gandhi, Birsa Agricultural University is a state agricultural university named after tribal freedom fighter Birsa Munda. Set on a 3,551-acre campus at Kanke with eleven colleges, it develops area-specific technologies and manpower in agriculture, animal husbandry, forestry, dairy and fisheries for the Chhotanagpur and Santhal Pargana regions.",

    expertise: [
      "agriculture",
      "forestry",
      "environment",
      "education",
      "healthcare",
    ],

    capabilities: [
      "research_development",
      "field_surveys",
      "training",
      "community_outreach",
      "testing",
    ],

    districtsServed: ["Ranchi"],
  },

  "Jharkhand University of Technology Ranchi": {
    website: "https://jutranchi.ac.in",

    email: "jutestablishment@gmail.com",

    description:
      "Jharkhand University of Technology was established under the Jharkhand University of Technology Act, 2011 (gazette notification of 8 December 2015) and is located at the Science & Technology Campus, Sirkha Toli, Namkum, Ranchi. Its territorial jurisdiction covers the whole of Jharkhand, and it promotes education and research in engineering, technology, management, town planning, pharmacy and applied arts and crafts, affiliating technical institutions including BIT Sindri.",

    expertise: ["technology", "education", "manufacturing", "public_safety"],

    capabilities: ["research_development", "training", "data_analysis", "policy_design"],

    districtsServed: ["Ranchi"],
  },

  "National University of Study and Research in Law Ranchi": {
    website: "https://nusrlranchi.ac.in",

    description:
      "NUSRL Ranchi was established by Act No. 4 of the Jharkhand State Assembly in 2010 and started functioning in September 2010. Recognised by the UGC in 2011 and by the Bar Council of India, it is a member of CLAT since 2012 and focuses on legal education and research in advocacy, judicial services, legislation and law reform, with a campus at Nagri, Kanke, Ranchi.",

    expertise: ["law", "education", "public_safety"],

    capabilities: [
      "legal_research",
      "research_development",
      "training",
      "policy_design",
      "consulting",
    ],

    districtsServed: ["Ranchi"],
  },

  "Jharkhand Raksha Shakti University Ranchi": {
    website: "http://jrsu.ac.in",

    description:
      "Established by the Government of Jharkhand on 3 October 2016 and recognised by the UGC, Jharkhand Raksha Shakti University is a state university described as the first of its kind in Jharkhand and third in the country offering certificate, diploma and degree courses in police science and internal security. It currently operates from the SKIPA campus in Ranchi, with a 75-acre permanent campus being established near Khunti.",

    expertise: ["public_safety", "law", "education", "technology"],

    capabilities: ["training", "research_development", "policy_design", "community_outreach"],

    districtsServed: ["Ranchi", "Khunti"],
  },

  "Dr. Shyama Prasad Mukherjee University Ranchi": {
    website: "https://www.dspmuranchi.ac.in",

    description:
      "Dr. Shyama Prasad Mukherjee University is a unitary state university in Ranchi formed from the upgrade of Ranchi College, which was established in 1926 as a Government Intermediate College and began undergraduate and postgraduate courses in arts and science in 1946. Ranchi University's records list the university's creation as a bifurcation of Ranchi University in 2019, and it teaches humanities, science and social science faculties.",

    expertise: ["education", "environment", "technology"],

    capabilities: [
      "research_development",
      "training",
      "community_outreach",
      "data_analysis",
    ],

    districtsServed: ["Ranchi"],
  },

  "Amity University Ranchi": {
    website: "https://ranchi.amity.edu",

    description:
      "Established 2016 by the Amity University, Jharkhand Act (State Act No. 13 of 2016), notified 16 May 2016, and recognized under Section 2(f) of the UGC Act, 1956. It is part of the Amity Education Group and located in Ranchi. Offers UG and PG programmes across multiple disciplines, with Bar Council of India approval for its law programmes.",

    expertise: ["education", "technology", "law", "healthcare"],

    capabilities: ["training", "research_development", "consulting", "community_outreach"],

    districtsServed: ["Ranchi"],
  },

  "Arka Jain University Jamshedpur": {
    website: "https://arkajainuniversity.ac.in",

    description:
      "Established 2017 under the Arka Jain University Act (Jharkhand Act 14 of 2017) by the Arka Educational and Cultural Trust (JGI Group). First state private university in the Kolhan region; states it is NAAC 'A' Grade accredited in its first cycle. Recognized by UGC, with approvals from AICTE, BCI, PCI and INC for relevant programmes.",

    expertise: ["education", "technology", "healthcare", "law", "pharmacy"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Seraikela-Kharsawan", "East Singhbhum", "West Singhbhum"],
  },

  "Capital University Koderma": {
    website: "https://www.capitaluniversity.edu.in",

    description:
      "Established 2018 under the Capital University Act, 2018 (Jharkhand Act 13 of 2018, notified 11 October 2018), sponsored by the Ch. Charan Singh Educational Society, New Delhi. Recognized under Section 2(f) of the UGC Act, 1956. Offers UG and PG programmes with approvals including AICTE, PCI and BCI; campus is on about 32 acres in Koderma.",

    expertise: ["education", "technology", "law", "pharmacy", "healthcare"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Koderma"],
  },

  "Netaji Subhas University Jamshedpur": {
    website: "https://nsuniv.ac.in",

    description:
      "Established September 2018 under the Netaji Subhas University Act, 2018 (Jharkhand Act 11 of 2018) at Pokhari, East Singhbhum, promoted by Sitwanto Devi Mahila Kalyan Sansthan. It evolved from the Netaji Subhas Institute of Business Management. Recognized by UGC under Section 2(f); offers management, engineering and other professional programmes.",

    expertise: ["education", "technology", "transportation", "public_safety"],

    capabilities: ["training", "research_development", "consulting", "community_outreach"],

    districtsServed: ["East Singhbhum"],
  },

  "Radha Govind University Ramgarh": {
    website: "https://rguniversity.edu.in",

    description:
      "Established 2018 under the Radha Govind University Act, 2018 (Jharkhand Act 14 of 2018, notified 11 October 2018), promoted by the Radha Govind Shiksha Swasthya Trust, Ramgarh. Approved under Section 2(f) of the UGC Act, 1956. Offers programmes in science, technology, humanities, social sciences, commerce and legal studies, with emphasis on vocational and skill development.",

    expertise: ["education", "law", "technology", "agriculture"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Ramgarh"],
  },

  "YBN University Ranchi": {
    website: "https://ybnu.ac.in",

    email: "ybnuniversity2017@gmail.com",

    description:
      "Established 2017 under the Y.B.N. University Act, 2017 (Jharkhand Act 15 of 2017, notified 4 July 2017), promoted by the Tribal Social Welfare Society, Ranchi. Offers UG, PG and doctoral programmes in engineering, management, law, pharmacy, nursing, science, commerce and humanities. States recognition by UGC and NAAC accreditation, with AICTE, BCI, PCI and INC approvals for relevant programmes.",

    expertise: ["education", "healthcare", "nursing", "pharmacy", "law", "technology"],

    capabilities: [
      "training",
      "healthcare_services",
      "research_development",
      "community_outreach",
    ],

    districtsServed: ["Ranchi"],
  },

  "Sai Nath University Ranchi": {
    website: "https://www.sainathuniversity.com",

    description:
      "Established under the Sai Nath University, Jharkhand Act, 2012 (Jharkhand Act 15 of 2012, notified 31 March 2012), sponsored by the Sai Nath University Trust, Agra. Recognized under Section 2(f) of the UGC Act, 1956. Offers courses in engineering, law, social science, travel and tourism, hospitality, allied health, management and communication from its Ormanjhi campus near Ranchi.",

    expertise: ["education", "healthcare", "law", "transportation", "technology"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Ranchi"],
  },

  "Usha Martin University Ranchi": {
    website: "https://www.umu.ac.in",

    description:
      "Established 2012 under the Usha Martin University, Jharkhand Act 2012, set up by the Usha Martin Group. Recognized by UGC under Section 2(f) as a self-financing state private university. Offers diploma, UG and PG programmes and Ph.D. programmes; the university states it holds NAAC 'A' Grade accreditation.",

    expertise: ["education", "technology", "agriculture", "healthcare", "energy"],

    capabilities: ["training", "research_development", "consulting", "community_outreach"],

    districtsServed: ["Ranchi"],
  },

  "Sarala Birla University Ranchi": {
    website: "https://sbu.ac.in",

    email: "info@sburanchi.ac.in",

    description:
      "Established 2017 under the Sarala Birla University Act, 2017 (Jharkhand Act 13 of 2017), passed by the Jharkhand Legislative Assembly; promoted by Bharat Arogya and Gyan Mandir (supported by the Birla Education Trust/Atul Birla Group). Self-financed private unitary university located in Birla Knowledge City on the Ranchi-Purulia highway. Lists recognition by UGC, AIU, PCI and BCI.",

    expertise: ["education", "healthcare", "technology", "pharmacy", "law"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Ranchi"],
  },

  "Jharkhand Rai University Ranchi": {
    website: "https://www.jru.edu.in",

    description:
      "Established under the Jharkhand Rai University, Jharkhand Act, 2011 (Jharkhand Act 03 of 2012), notified 30 January 2012, sponsored by Rai Business School, New Delhi; amended by the Jharkhand Rai University (Amendment) Act, 2018. The university came into existence in 2012 and offers professional UG and PG programmes in applied fields.",

    expertise: ["education", "technology", "healthcare", "law", "transportation"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Ranchi"],
  },

  "Ramchandra Chandravansi University Palamu": {
    website: "https://www.rcu.edu.in",

    email: "info.rcu2018@gmail.com",

    description:
      "Established 2018 under the Ramchandra Chandravansi University Act, 2018 (Jharkhand Act 10 of 2018, notified 24 September 2018), promoted by the Ramchandra Chandravansi Welfare Trust. Located at Nawadih Kala, Bishrampur, Palamu. Offers diploma, UG, PG and doctoral programmes across arts, humanities, sciences and professional/technical fields; publishes UGC recognition and 2(f) confirmation documents on its website.",

    expertise: ["education", "healthcare", "technology", "agriculture"],

    capabilities: ["training", "research_development", "community_outreach", "consulting"],

    districtsServed: ["Palamu"],
  },

  // ========================================
  // INDUSTRIES
  // ========================================

  "Tata Steel Limited": {
    website: "https://www.tatasteel.com",

    description:
      "One of India's leading steel producers, founded in 1907; its flagship Jamshedpur plant in East Singhbhum has about 12 MnTPA capacity and anchors India's first planned industrial city. Activities include steel R&D, sustainability programmes and large-scale community and CSR operations in Jamshedpur.",

    expertise: [
      "manufacturing",
      "mining",
      "infrastructure",
      "technology",
      "environment",
      "energy",
    ],

    capabilities: [
      "manufacturing",
      "research_development",
      "testing",
      "training",
      "community_outreach",
      "deployment",
    ],

    districtsServed: ["East Singhbhum", "Seraikela-Kharsawan"],
  },

  "Tata Motors Limited": {
    website: "https://www.tatamotors.com",

    description:
      "Tata Motors' first manufacturing unit, established in 1945 over 822 acres in Jamshedpur, produces medium and heavy commercial vehicles (over 200 M&HCV variants) plus in-house engines (Tata 697/497, Tata Cummins 6B) and axle units (HV Axles). It rolled out its two-millionth truck in 2013 and hosts truck testing and engineering centres.",

    expertise: ["manufacturing", "transportation", "infrastructure", "technology"],

    capabilities: [
      "manufacturing",
      "prototyping",
      "testing",
      "research_development",
      "training",
    ],

    districtsServed: ["East Singhbhum"],
  },

  "Steel Authority of India Limited": {
    website: "https://sail.co.in",

    description:
      "Bokaro Steel Plant, a premier SAIL unit in Bokaro Steel City, was incorporated in 1964 (with Soviet collaboration), joined SAIL in 1978 and is recognized as India's first 'Swadeshi' steel plant. It is a fully integrated plant with about 5.8 MT liquid steel capacity, undergoing modernisation targeting higher output.",

    expertise: ["manufacturing", "infrastructure", "energy", "technology"],

    capabilities: [
      "manufacturing",
      "research_development",
      "testing",
      "training",
      "deployment",
    ],

    districtsServed: ["Bokaro"],
  },

  "Usha Martin": {
    website: "https://www.ushamartin.com",

    description:
      "Global manufacturer of wire ropes, LRPC strands, wires and related machinery, with major manufacturing facilities at Tatisilwai, Ranchi, including a machinery division making wire drawing, stranding and rope-closing machines. Its Ranchi unit recently commissioned a 4 MW solar installation; the Usha Martin Foundation and KGVK link its CSR to Jharkhand communities.",

    expertise: ["manufacturing", "infrastructure", "mining", "transportation", "energy"],

    capabilities: ["manufacturing", "testing", "research_development", "training"],

    districtsServed: ["Ranchi"],
  },

  "Electrosteel Castings Limited": {
    website: "https://www.electrosteel.com",

    description:
      "Kolkata-headquartered maker of ductile iron pipes (largest in the Indian subcontinent, ~8,00,000 TPA). Its Bokaro associate, Electrosteel Steels Limited (integrated steel plant at Siyaljori, Bokaro, Jharkhand), was acquired by the Vedanta group in 2020 and now operates as ESL Steel Limited.",

    expertise: ["water", "infrastructure", "manufacturing", "environment"],

    capabilities: ["manufacturing", "testing", "deployment"],

    districtsServed: ["Bokaro"],
  },

  "Hindustan Copper Limited": {
    website: "https://www.hindustancopper.com",

    description:
      "Government of India copper PSU whose Indian Copper Complex at Ghatsila (East Singhbhum) includes a cluster of underground copper mines, concentrator plants and a smelter in the Singhbhum Copper Belt (deposits such as Chapri, Rakha, Surda, Kendadih, Dhobani). ICC originated with Indian Copper Corporation Ltd (1930), nationalized in 1972 and merged with HCL.",

    expertise: ["mining", "manufacturing", "environment"],

    capabilities: ["manufacturing", "field_surveys", "testing", "training"],

    districtsServed: ["East Singhbhum"],
  },

  "Central Coalfields Limited": {
    website: "https://www.centralcoalfields.in",

    description:
      "A Coal India Limited subsidiary headquartered at Darbhanga House, Ranchi, CCL is a Government of India coal producer operating mines across Jharkhand's coal belts. It runs welfare, sports and community programmes in its command areas and offers public grievance channels (Samadhan Cell).",

    expertise: ["mining", "energy", "infrastructure", "environment"],

    capabilities: ["field_surveys", "training", "community_outreach", "deployment"],

    districtsServed: [
      "Ranchi",
      "Hazaribagh",
      "Ramgarh",
      "Dhanbad",
      "Bokaro",
      "Giridih",
      "Latehar",
      "Palamu",
      "Chatra",
    ],
  },

  "Uranium Corporation of India Limited": {
    website: "https://www.ucil.gov.in",

    email: "uranium@uraniumcorp.in",

    description:
      "Government of India public sector company under the Department of Atomic Energy, headquartered at Jaduguda Mines, East Singhbhum. UCIL operates uranium mines and ore processing facilities in the Singhbhum region, including Jaduguda, Narwapahar, Turamdih and Mohuldih.",

    expertise: ["mining", "energy", "public_safety", "environment"],

    capabilities: ["manufacturing", "field_surveys", "testing", "research_development"],

    districtsServed: ["East Singhbhum"],
  },

  "Adhunik Group of Industries": {
    website: "https://www.adhunikgroup.com",

    description:
      "Industrial group with significant Jharkhand assets: Adhunik Power and Natural Resources Limited operates a 2x270 MW coal-based thermal power plant at Padampur, Saraikela-Kharsawan (commissioned 2012), and group company OMML operates an iron ore pellet plant at Kandra, Jharkhand, alongside Ghatkuri iron ore mining. The Adhunik Metaliks steel business was acquired by Liberty Steel (GFG Alliance) in 2020.",

    expertise: ["energy", "mining", "manufacturing", "environment"],

    capabilities: ["manufacturing", "deployment", "testing"],

    districtsServed: ["Saraikela-Kharsawan", "West Singhbhum"],
  },

  "ESL Steel Limited": {
    website: "https://www.eslsteel.com",

    description:
      "Vedanta-group greenfield integrated steel plant in Bokaro district, currently operating at 1.5 MTPA with a design hot metal capacity of 3.5 MTPA. Products include pig iron, billets, TMT bars, wire rods and ductile iron pipes, serving construction, infrastructure, transport and energy sectors.",

    expertise: ["manufacturing", "infrastructure", "energy", "environment"],

    capabilities: ["manufacturing", "testing", "deployment", "research_development"],

    districtsServed: ["Bokaro"],
  },

  "Jindal Steel and Power Limited": {
    website: "https://www.jindalsteel.in",

    location: "Patratu, Ramgarh, Jharkhand",

    description:
      "Jindal Steel operates its Jharkhand unit at Patratu in Ramgarh district — a specialised long-products plant producing TMT rebars, wire rods, welded wire mesh and cut-and-bend bars (Jindal Panther brand). The company's integrated steel operations are in Angul, Odisha; it has no plant in Jamshedpur.",

    expertise: ["manufacturing", "infrastructure", "energy", "transportation"],

    capabilities: ["manufacturing", "testing", "deployment", "research_development"],

    districtsServed: ["Ramgarh"],
  },

  "ACC Limited": {
    website: "https://www.acclimited.com",

    location: "Jhinkpani, West Singhbhum, Jharkhand",

    description:
      "ACC Limited's Chaibasa Cement Works at Jhinkpani, West Singhbhum district, is an roughly 80-year-old integrated cement plant in the Jharkhand cement belt. The company has announced the permanent closure of this plant, a development with significant implications for the ~1,600 workers and the local economy.",

    expertise: ["manufacturing", "infrastructure", "environment", "public_safety"],

    capabilities: ["manufacturing", "testing", "deployment"],

    districtsServed: ["West Singhbhum"],
  },

  "NMDC Limited": {
    website: "https://www.nmdc.co.in",

    location: "Hazaribagh, Jharkhand",

    description:
      "Government of India mineral PSU whose operating iron ore mines are in Chhattisgarh and Karnataka. Its Jharkhand presence is coal: it commenced mining at the Tokisud North Coal Mine in the Barkagaon block of Hazaribagh district (approx. 2.30 MTPA thermal coal), per PIB and company filings.",

    expertise: ["mining", "energy", "environment"],

    capabilities: ["manufacturing", "field_surveys", "testing"],

    districtsServed: ["Hazaribagh"],
  },

  "TRF Limited": {
    website: "https://trf.co.in",

    description:
      "Incorporated on 20 November 1962 at Jamshedpur and promoted by Tata Steel and ACC, TRF is a pioneer in bulk material handling systems and equipment for steel, power, port and mining sectors. Its Jamshedpur facility combines manufacturing with design and engineering teams for electromechanical jobs, industrial structures and lifecycle services.",

    expertise: ["infrastructure", "manufacturing", "mining", "transportation", "energy"],

    capabilities: [
      "manufacturing",
      "research_development",
      "prototyping",
      "deployment",
      "consulting",
    ],

    districtsServed: ["East Singhbhum"],
  },

  "Jharkhand State Forest Development Corporation": {
    website: "http://www.jsfdc.in",

    description:
      "State public sector undertaking incorporated in 2002 under the Department of Forest, Environment & Climate Change. JSFDC is the state agency for collection and trade of kendu leaves and purchase/sale of timber and other minor forest produce, generating livelihoods for marginalized primary collectors under the Jharkhand Rajya Kendu Patta Niti, 2015.",

    expertise: ["forestry", "environment", "agriculture"],

    capabilities: ["community_outreach", "field_surveys", "funding", "policy_design"],

    districtsServed: ["Ranchi", "Hazaribagh", "Gumla", "Dumka", "Palamu"],
  },
};

// ========================================
// NEW PARTNERS
// ========================================
// Organizations the problem statement asks for but the
// directory lacked: CSIR research laboratories, state
// government agencies and grassroots NGOs.

const additions = [
  {
    name: "CSIR - Central Institute of Mining and Fuel Research",

    type: "government",

    website: "https://cimfr.res.in",

    location: "Dhanbad, Jharkhand",

    description:
      "Constituent laboratory of CSIR (Ministry of Science & Technology, Government of India) based in Dhanbad, formed by merging the Central Mining Research Institute and the Central Fuel Research Institute to provide R&D inputs for the entire coal-energy chain from mining to consumption.",

    expertise: ["mining", "energy", "environment", "public_safety", "technology"],

    capabilities: [
      "research_development",
      "testing",
      "consulting",
      "training",
      "field_surveys",
      "policy_design",
    ],

    districtsServed: ["Dhanbad"],
  },

  {
    name: "CSIR - National Metallurgical Laboratory",

    type: "government",

    website: "https://www.nmlindia.org",

    location: "Jamshedpur, Jharkhand",

    description:
      "CSIR national laboratory established in 1950 in Jamshedpur, focused on R&D in minerals, metals and materials. It hosts India's largest creep testing facility, with strengths in magnetic materials, rapidly solidified alloys, surface coatings and material characterization.",

    expertise: ["manufacturing", "technology", "environment", "energy"],

    capabilities: [
      "research_development",
      "testing",
      "consulting",
      "training",
      "innovation_labs",
    ],

    districtsServed: ["East Singhbhum"],
  },

  {
    name: "Birla Institute of Technology Sindri",

    type: "university",

    website: "https://www.bitsindri.ac.in",

    location: "Sindri, Dhanbad, Jharkhand",

    description:
      "Established in 1949 as the College of Mechanical and Electrical Engineering, BIT Sindri is one of India's oldest government engineering institutes, located on a roughly 450-acre campus near the Damodar river. It offers B.Tech, M.Tech and PhD programmes in branches including chemical, mechanical, electrical, civil and metallurgical engineering, and is affiliated to Jharkhand University of Technology.",

    expertise: ["manufacturing", "energy", "mining", "technology", "waste"],

    capabilities: ["research_development", "testing", "training", "prototyping"],

    districtsServed: ["Dhanbad"],
  },

  {
    name: "Jharkhand Space Applications Center",

    type: "government",

    website: "https://jsac.jharkhand.gov.in",

    location: "Ranchi, Jharkhand",

    description:
      "Government of Jharkhand agency under the Department of Information Technology, established in 2003 as the state's premier remote sensing center. It hosts a Remote Sensing & GIS Division supporting space-application activities for state planning and development.",

    expertise: ["technology", "agriculture", "environment", "water", "infrastructure"],

    capabilities: ["data_analysis", "field_surveys", "research_development", "consulting"],

    districtsServed: ["Ranchi"],
  },

  {
    name: "Jharkhand Agency for Promotion of Information Technology",

    type: "government",

    website: "https://japit.jharkhand.gov.in",

    location: "Ranchi, Jharkhand",

    description:
      "Nodal state agency for implementing IT and e-governance projects in Jharkhand, providing IT inputs to government departments. It supports and manages core e-governance infrastructure including the State Wide Area Network (SWAN), State Data Center and Common Service Centres.",

    expertise: ["technology", "education", "public_safety"],

    capabilities: [
      "software_development",
      "policy_design",
      "consulting",
      "deployment",
      "data_analysis",
    ],

    districtsServed: ["Ranchi"],
  },

  {
    name: "Jharkhand Industrial Area Development Authority",

    type: "government",

    website: "https://jiada.jharkhand.gov.in",

    location: "Ranchi, Jharkhand",

    description:
      "State authority that plans, develops and manages industrial areas and parks across Jharkhand through regional offices including Ranchi (Namkum), Adityapur, Bokaro and Santhal Pargana. It oversees plot allocation, industrial infrastructure and investment facilitation in areas such as Namkum, Barhi, Kulhi and Hotwar.",

    expertise: ["infrastructure", "manufacturing", "technology", "energy"],

    capabilities: ["policy_design", "deployment", "consulting", "funding"],

    districtsServed: ["Ranchi", "Seraikela-Kharsawan", "Bokaro", "Hazaribagh"],
  },

  {
    name: "Vikas Bharti Bishunpur",

    type: "ngo",

    website: "https://www.vikasbharti.in",

    location: "Bishunpur, Gumla, Jharkhand",

    description:
      "Registered voluntary organization (Society Registration Act, 1860) founded as a people's movement in 1982 and registered on 14 January 1983 by founder-secretary Padma Shri Ashok Bhagat. It works with underprivileged and tribal communities across all 24 districts of Jharkhand in education, health, livelihood and institutional development, including ashrams for orphaned and disabled children and a Krishi Vigyan Kendra in Gumla.",

    expertise: ["education", "healthcare", "agriculture", "environment"],

    capabilities: [
      "community_outreach",
      "training",
      "healthcare_services",
      "field_surveys",
      "funding",
    ],

    districtsServed: ["Gumla", "Ranchi"],
  },

  {
    name: "PRADAN",

    type: "ngo",

    website: "https://www.pradan.net",

    location: "Ranchi, Jharkhand (multiple field locations)",

    description:
      "National NGO whose mission is enabling marginalized rural people, especially women, to earn a decent living by organizing them into self-help groups, with professionals working alongside village communities. PRADAN is active in Jharkhand (e.g., Godda, Hazaribagh and other districts) and collaborates with the Jharkhand State Livelihood Promotion Society (JSLPS).",

    expertise: ["agriculture", "education", "healthcare"],

    capabilities: [
      "community_outreach",
      "training",
      "field_surveys",
      "policy_design",
      "consulting",
      "funding",
    ],

    districtsServed: ["Godda", "Hazaribagh", "Ranchi"],
  },

  {
    name: "KGVK - Krishi Gram Vikas Kendra",

    type: "ngo",

    website: "https://www.kgvk.org",

    email: "info@kgvk.org",

    location: "Rukka, Ormanjhi, Ranchi, Jharkhand",

    description:
      "Ranchi-based NGO working in rural India for sustainable integrated development through its Total Village Management (TVM) approach, with historic roots in Usha Martin's CSR. It operates from Rukka village near Ranchi and runs development programmes in education, health, livelihood and water across its operational areas in Jharkhand.",

    expertise: ["agriculture", "education", "healthcare", "water", "environment"],

    capabilities: [
      "community_outreach",
      "training",
      "healthcare_services",
      "field_surveys",
      "data_analysis",
    ],

    districtsServed: ["Ranchi"],
  },
];

module.exports = { enrichments, removals, additions };
