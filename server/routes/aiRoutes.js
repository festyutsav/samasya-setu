const express = require("express");

const router = express.Router();

const { predictCategory } = require("../services/aiCategoryService");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const Problem = require("../models/Problem");

const {
  analyzeAndSavePriority,
} = require("../services/aiPriorityService");

const {
  summarizeProblem,
  saveSummary,
} = require("../services/aiSummaryService");

// ========================================
// PREDICT CATEGORY
// ========================================

router.post("/predict-category", async (req, res) => {
  try {
    const { title, description } = req.body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required.",
      });
    }

    // ========================================
    // RUN AI
    // ========================================

    const result = await predictCategory(title, description);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      message: "Category predicted successfully.",
      category: result.category,
      confidence: result.confidence,
      margin: result.margin,
      suggestionLevel: result.suggestionLevel,
      // the example complaint the guess matched on, and the runners-up —
      // handy for explaining or debugging a suggestion in the browser
      closestExample: result.closestExample,
      scores: result.scores,
    });
  } catch (error) {
    console.error("AI category prediction error:", error);

    return res.status(500).json({
      message: "Failed to predict category.",
    });
  }
});

// ========================================
// REFRESH AI ANALYSIS (ADMIN)
// ========================================
// Re-runs summary + priority for one problem. Used after
// admin actions that change the inputs: status moves
// (wait-age stops accruing), duplicates get confirmed
// (cluster size changes), or the problem was submitted
// before these features shipped (null score → backfill).

router.patch(
  "/refresh-analysis/:problemId",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const problem = await Problem.findById(req.params.problemId);

      if (!problem) {
        return res.status(404).json({
          message: "Problem not found.",
        });
      }

      const summary = summarizeProblem(problem);

      await saveSummary(problem._id, summary);

      const priority = await analyzeAndSavePriority(problem);

      return res.status(200).json({
        message: "AI analysis refreshed successfully.",

        aiSummary: summary,

        aiPriority: priority,
      });
    } catch (error) {
      console.error("AI refresh-analysis error:", error.message);

      return res.status(500).json({
        message: "Failed to refresh AI analysis.",
      });
    }
  },
);

module.exports = router;
