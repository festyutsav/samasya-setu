const Problem = require("../models/Problem");


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
// EXPORTS
// ========================================

module.exports = {

  getDashboardStats,

  updateProblemStatus,

};