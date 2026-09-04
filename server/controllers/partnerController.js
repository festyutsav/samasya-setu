const Partner = require("../models/Partner");
const User = require("../models/User");
const Project = require("../models/Project");
const Problem = require("../models/Problem");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ========================================
// PARTNER CREDENTIALS VAULT
// ========================================
// Partner passwords are bcrypt-hashed in the database, so the
// only place the plaintext survives is this admin-owned JSON
// file (the same file the seed script writes). Every partner
// created from the admin panel is appended here so the
// "Download Credentials" export stays complete.

const credentialsFilePath = () =>
  path.join(__dirname, "..", "scripts", "partner_credentials.json");

const readCredentialsFile = () => {
  try {
    return JSON.parse(
      fs.readFileSync(credentialsFilePath(), "utf8"),
    );
  } catch {
    return [];
  }
};

const appendCredentialsEntry = (entry) => {
  const credentials = readCredentialsFile();

  const others = credentials.filter(
    (item) =>
      String(item.name || "").toLowerCase() !==
      String(entry.name || "").toLowerCase(),
  );

  others.push(entry);

  fs.writeFileSync(
    credentialsFilePath(),
    JSON.stringify(others, null, 2),
    "utf8",
  );
};


// ========================================
// CREATE PARTNER
// ========================================

const createPartner = async (req, res) => {
  try {
    const {
      // Organization details
      name,
      type,
      description,
      location,
      email,
      website,

      // AI routing profile (arrays or comma-separated strings)
      expertise,
      capabilities,
      districtsServed,

      // Partner login details
      userName,
      userEmail,
      password,
    } = req.body;


    // ========================================
    // NORMALIZE ROUTING PROFILE
    // ========================================
    // Accepts ["a", "b"] or "a, b" from the admin form.

    const toList = (value) =>
      Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);


    // ========================================
    // VALIDATE ORGANIZATION
    // ========================================

    if (!name || !type || !["university", "industry"].includes(type)) {
      return res.status(400).json({
        message: "Partner name and a valid type ('university' or 'industry') are required.",
      });
    }


    // ========================================
    // VALIDATE LOGIN ACCOUNT
    // ========================================

    if (!userName || !userEmail || !password) {
      return res.status(400).json({
        message: "Partner login details are required.",
      });
    }


    // ========================================
    // CHECK USER EMAIL
    // ========================================

    const existingUser = await User.findOne({
      email: userEmail.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }


    // ========================================
    // CREATE PARTNER ORGANIZATION
    // ========================================

    const partner = await Partner.create({
      name,
      type,
      description,
      location,
      email,
      website,
      expertise: toList(expertise),
      capabilities: toList(capabilities),
      districtsServed: toList(districtsServed),
    });


    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );


    // ========================================
    // CREATE PARTNER USER
    // ========================================

    const user = await User.create({
      name: userName,
      email: userEmail.toLowerCase(),
      password: hashedPassword,
      role: "partner",
      partner: partner._id,
    });


    // ========================================
    // LINK USER TO PARTNER
    // ========================================

    partner.user = user._id;

    await partner.save();


    // ========================================
    // RECORD CREDENTIALS
    // ========================================
    // The DB only keeps the hash. Store the plaintext in the
    // admin credentials vault so the login can actually be
    // handed over and re-exported later.

    const credentialsEntry = {
      name: partner.name,
      type: partner.type,
      loginEmail: user.email,
      password,
      email: partner.email || "",
      website: partner.website || "",
      location: partner.location || "",
      description: partner.description || "",
      expertise: partner.expertise || [],
      capabilities: partner.capabilities || [],
      districtsServed: partner.districtsServed || [],
      createdAt: new Date().toISOString(),
    };

    try {
      appendCredentialsEntry(credentialsEntry);
    } catch (vaultError) {
      console.error(
        "Failed to update credentials vault:",
        vaultError.message,
      );
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(201).json({
      message:
        "Partner and partner login created successfully.",

      // One-time view of the plaintext credentials — the UI
      // shows these immediately and offers a copyable record.

      credentials: {
        loginEmail: user.email,

        password,
      },

      partner: {
        ...partner.toObject(),

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });

  } catch (error) {

    console.error(
      "Create partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while creating partner.",
    });

  }
};


// ========================================
// GET ALL PARTNERS
// ========================================

const getAllPartners = async (req, res) => {
  try {

    const partners = await Partner.find({
      type: { $in: ["university", "industry"] },
    })
      .populate({
        path: "user",
        select: "name email role",
      })
      .sort({
        createdAt: -1,
      });

    // Deduplicate by name, prioritizing the partner document with an active user account
    const partnerMap = new Map();
    for (const partner of partners) {
      const key = String(partner.name || "").trim().toLowerCase();
      const existing = partnerMap.get(key);
      if (!existing) {
        partnerMap.set(key, partner);
      } else if (!existing.user && partner.user) {
        partnerMap.set(key, partner);
      }
    }
    const uniquePartners = Array.from(partnerMap.values());

    // ========================================
    // ATTACH LOGIN CREDENTIALS (ADMIN ONLY)
    // ========================================
    // The DB stores only bcrypt hashes, so the plaintext
    // password is looked up from the credentials vault by
    // organization name. Admin-only route, same exposure as
    // the credentials download.

    const vault = readCredentialsFile();

    const passwordByName = new Map(
      vault.map((entry) => [
        String(entry.name || "").toLowerCase(),
        entry,
      ]),
    );

    const partnersWithCredentials = uniquePartners.map((partner) => {
      const entry = passwordByName.get(
        String(partner.name || "").toLowerCase(),
      );

      return {
        ...partner.toObject(),

        credentials: entry
          ? {
              password: entry.password || null,
            }
          : null,
      };
    });

    return res.status(200).json({
      partners: partnersWithCredentials,
    });

  } catch (error) {

    console.error(
      "Get partners error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching partners.",
    });

  }
};


// ========================================
// GET SINGLE PARTNER
// ========================================

const getPartnerById = async (req, res) => {
  try {

    const partner =
      await Partner.findById(req.params.id)
        .populate({
          path: "user",
          select: "name email role",
        });


    if (!partner) {
      return res.status(404).json({
        message: "Partner not found.",
      });
    }


    return res.status(200).json({
      partner,
    });

  } catch (error) {

    console.error(
      "Get partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching partner.",
    });

  }
};


// ========================================
// DELETE PARTNER
// ========================================

const deletePartner = async (req, res) => {
  try {

    const partner =
      await Partner.findByIdAndDelete(
        req.params.id
      );


    if (!partner) {
      return res.status(404).json({
        message: "Partner not found.",
      });
    }


    // Delete the associated partner user
    if (partner.user) {
      await User.findByIdAndDelete(
        partner.user
      );
    }


    return res.status(200).json({
      message:
        "Partner and associated user deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete partner error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while deleting partner.",
    });

  }
};


// ========================================
// PARTNER DIRECTORY (PARTNER ONLY)
// ========================================
// Lightweight listing used by universities when inviting
// industry partners into a project collaboration. Returns
// only the fields needed for the invite dropdown — no login
// links or admin-only details.

const getPartnerDirectory = async (req, res) => {
  try {
    const { type, expertise, q, excludeSelf } = req.query;

    const filter = {
      type: { $in: ["university", "industry"] },
    };

    if (type && ["university", "industry"].includes(type)) {
      filter.type = type;
    }

    if (expertise) {
      filter.expertise = String(expertise).trim();
    }

    if (q && String(q).trim()) {
      const pattern = new RegExp(
        String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [{ name: pattern }, { description: pattern }];
    }

    if (excludeSelf === "true" && req.user.partner) {
      filter._id = { $ne: req.user.partner };
    }

    const partners = await Partner.find(filter)
      .select("name type description location expertise capabilities")
      .sort({ name: 1 });

    // ========================================
    // PUBLIC ACTIVITY COUNTS + UNIVERSITY PROJECTS
    // ========================================
    // Every partner sees how much live work each organization
    // has; universities additionally expose their open projects
    // so other partners can request to collaborate.

    const partnerIds = partners.map((partner) => partner._id);

    const projects = partnerIds.length
      ? await Project.find({
          partner: { $in: partnerIds },
          status: { $in: ["planning", "active"] },
        })
          .select("partner title status problem")
          .populate("problem", "title")
      : [];

    const problemCounts = partnerIds.length
      ? await Problem.aggregate([
          {
            $match: {
              assignedPartner: { $in: partnerIds },
              status: { $ne: "solved" },
            },
          },
          { $group: { _id: "$assignedPartner", count: { $sum: 1 } } },
        ])
      : [];

    const countMap = new Map(
      problemCounts.map((entry) => [String(entry._id), entry.count]),
    );

    const partnersWithActivity = partners.map((partner) => {
      const partnerProjects = projects
        .filter(
          (project) => String(project.partner?._id || project.partner) === String(partner._id),
        )
        .map((project) => ({
          _id: project._id,
          title: project.title,
          status: project.status,
          problemTitle: project.problem?.title || "",
        }));

      return {
        ...partner.toObject(),
        activeProjects: partnerProjects.length,
        assignedProblems: countMap.get(String(partner._id)) || 0,
        projects: partnerProjects,
      };
    });

    return res.status(200).json({
      partners: partnersWithActivity,
    });

  } catch (error) {

    console.error(
      "Get partner directory error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while fetching partner directory.",
    });

  }
};


// ========================================
// EXPORTS
// ========================================

module.exports = {
  createPartner,
  getAllPartners,
  getPartnerById,
  deletePartner,
  getPartnerDirectory,
};