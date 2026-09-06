const dotenv = require("dotenv");

// ========================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ========================================

dotenv.config();


// ========================================
// IMPORT OTHER FILES AFTER DOTENV
// ========================================

const connectDB = require("./config/db");
const app = require("./app");
const { initModel } = require("./services/aiCategoryService");
const { getExtractor } = require("./services/embeddingModel");


// ========================================
// CONNECT DATABASE
// ========================================

connectDB();


// ========================================
// PRE-WARM AI MODELS
// ========================================
// Category classification and duplicate detection share one
// embedding model. Loading it here means the first citizen
// submission doesn't pay the model download cost.

getExtractor()
  .then(() => initModel())
  .catch((err) => {
    console.error("Failed to pre-warm AI model:", err.message);
  });


// ========================================
// SERVER PORT
// ========================================

const PORT =
  process.env.PORT || 5001;






// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
















