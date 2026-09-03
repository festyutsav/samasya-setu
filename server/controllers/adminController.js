const Problem = require("../models/Problem");
const Partner = require("../models/Partner");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");


// ========================================
// GET DASHBOARD STATISTICS
// ========================================

const getDashboardStats = async (req, res) => {

  try {

    const totalProblems =
      await Problem.countDocuments();


    const submittedProblems =
      await Problem.countDocuments({
        status: "submitted",
      });


    const underReviewProblems =
      await Problem.countDocuments({
        status: "under_review",
      });


    const assignedProblems =
      await Problem.countDocuments({
        status: "assigned",
      });


    const inProgressProblems =
      await Problem.countDocuments({
        status: "in_progress",
      });


    const solvedProblems =
      await Problem.countDocuments({
        status: "solved",
      });


    return res.status(200).json({

      totalProblems,

      submittedProblems,

      underReviewProblems,

      assignedProblems,

      inProgressProblems,

      solvedProblems,

    });

  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error.message
    );


    return res.status(500).json({

      message:
        "Server error while fetching dashboard statistics",

    });

  }

};


// ========================================
// UPDATE PROBLEM STATUS
// ========================================

const updateProblemStatus = async (
  req,
  res
) => {

  try {

    const { problemId } =
      req.params;


    const { status } =
      req.body;


    // ========================================
    // ALLOWED STATUSES
    // ========================================

    const allowedStatuses = [

      "submitted",

      "under_review",

      "assigned",

      "in_progress",

      "solved",

    ];


    // ========================================
    // VALIDATE STATUS
    // ========================================

    if (!status) {

      return res.status(400).json({

        message:
          "Problem status is required",

      });

    }


    if (
      !allowedStatuses.includes(status)
    ) {

      return res.status(400).json({

        message:
          "Invalid problem status",

      });

    }


    // ========================================
    // PREPARE UPDATE DATA
    // ========================================

    const updateData = {

      status,

    };


    // ========================================
    // REMOVE ASSIGNED PARTNER
    // ========================================

    /*
      When the admin moves a problem back to:

      - submitted
      - under_review

      the problem should no longer have an
      assigned university/partner.

      We explicitly set assignedPartner to null
      because the schema supports null as the
      default value.
    */

    if (
      status === "submitted" ||
      status === "under_review"
    ) {

      updateData.assignedPartner =
        null;

    }


    // ========================================
    // UPDATE PROBLEM
    // ========================================

    const problem =
      await Problem.findByIdAndUpdate(

        problemId,

        {

          $set: updateData,

        },

        {

          new: true,

          runValidators: true,

        }

      );


    // ========================================
    // CHECK PROBLEM
    // ========================================

    if (!problem) {

      return res.status(404).json({

        message:
          "Problem not found",

      });

    }


    // ========================================
    // POPULATE UPDATED DATA
    // ========================================

    await problem.populate([

      {

        path: "submittedBy",

        select: "name email",

      },

      {

        path: "assignedPartner",

        select: "name type location",

      },

    ]);


    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return res.status(200).json({

      message:
        "Problem status updated successfully",

      problem,

    });


  } catch (error) {

    console.error(
      "Update problem status error:",
      error.message
    );


    return res.status(500).json({

      message:
        "Server error while updating problem status",

    });

  }

};


// ========================================
// DOWNLOAD PARTNER CREDENTIALS
// ========================================
// Streams the admin credentials vault (plaintext passwords)
// and enriches each entry with the partner's full routing
// profile from the DB, so the export doubles as a complete
// partner registry: profile, expertise, districts, login.

const downloadPartnerCredentials = async (
  req,
  res
) => {
  try {
    const credentialsPath = path.join(
      __dirname,
      "..",
      "scripts",
      "partner_credentials.json"
    );

    if (!fs.existsSync(credentialsPath)) {
      return res.status(404).json({
        message:
          "Credentials file not found. Run the seed script first.",
      });
    }

    let credentials;

    try {
      credentials = JSON.parse(
        fs.readFileSync(credentialsPath, "utf8")
      );
    } catch (parseError) {
      console.error(
        "Credentials parse error:",
        parseError.message
      );

      return res.status(500).json({
        message: "Credentials file is corrupted.",
      });
    }

    // ========================================
    // ENRICH FROM DATABASE
    // ========================================
    // Seed-era entries only carry name/type/login. Fill in
    // the partner's live profile so the file is a complete
    // registry, not just a password list.

    const Partner = require("../models/Partner");

    const partners = await Partner.find({}).populate(
      "user",
      "email"
    );

    const partnerByName = new Map(
      partners.map((partner) => [
        String(partner.name || "").toLowerCase(),
        partner,
      ])
    );

    const enriched = credentials.map((entry) => {
      const partner = partnerByName.get(
        String(entry.name || "").toLowerCase()
      );

      if (!partner) {
        return entry;
      }

      return {
        ...entry,

        loginEmail: entry.loginEmail || partner.user?.email || "",

        location: entry.location || partner.location || "",

        description: entry.description || partner.description || "",

        expertise: partner.expertise?.length
          ? partner.expertise
          : entry.expertise || [],

        capabilities: partner.capabilities?.length
          ? partner.capabilities
          : entry.capabilities || [],

        districtsServed: partner.districtsServed?.length
          ? partner.districtsServed
          : entry.districtsServed || [],
      };
    });

    res.setHeader(
      "Content-Type",
      "application/json"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=partner_credentials.json"
    );

    return res.send(
      JSON.stringify(enriched, null, 2)
    );
  } catch (error) {
    console.error(
      "Download credentials error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Server error while downloading credentials",
    });
  }
};


// ========================================
// EXPORTS
// ========================================

module.exports = {

  getDashboardStats,

  updateProblemStatus,

  downloadPartnerCredentials,

};