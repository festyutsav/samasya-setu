// ========================================
// SAMASYASETU AI CONTROLLER
// ========================================

const {
  predictCategory,
} = require("../services/aiCategoryService");


// ========================================
// PREDICT CATEGORY
// ========================================

const predictProblemCategory = async (
  req,
  res
) => {

  try {

    const {
      title,
      description,
    } = req.body;


    // ========================================
    // VALIDATION
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
    // ASK AI
    // ========================================

    const result =
      await predictCategory(
        title,
        description
      );


    // ========================================
    // RETURN RESULT
    // ========================================

    return res.status(200).json({

      message:
        "Category predicted successfully.",

      category:
        result.category,

      confidence:
        result.confidence,

    });

  } catch (error) {

    console.error(
      "AI category prediction error:",
      error
    );


    return res.status(500).json({

      message:
        "Server error while predicting category.",

    });

  }

};


// ========================================
// EXPORT
// ========================================

module.exports = {
  predictProblemCategory,
};