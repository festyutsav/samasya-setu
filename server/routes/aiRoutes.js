const express = require("express");

const router = express.Router();

const {
  predictCategory,
} = require("../services/aiCategoryService");


// ========================================
// PREDICT CATEGORY
// ========================================

router.post(
  "/predict-category",
  async (req, res) => {

    try {

      const {
        title,
        description,
      } = req.body;


      // ========================================
      // BASIC VALIDATION
      // ========================================

      if (
        !title ||
        !description
      ) {

        return res.status(400).json({

          message:
            "Title and description are required.",

        });

      }


      // ========================================
      // RUN AI
      // ========================================

      const result =
        await predictCategory(
          title,
          description
        );


      // ========================================
      // RESPONSE
      // ========================================

      return res.status(200).json({

        message:
          "Category predicted successfully.",

        category:
          result.category,

        score:
          result.score,

        margin:
          result.margin,

        suggestionLevel:
          result.suggestionLevel,

      });

    } catch (error) {

      console.error(
        "AI category prediction error:",
        error
      );


      return res.status(500).json({

        message:
          "Failed to predict category.",

      });

    }

  }
);


module.exports = router;