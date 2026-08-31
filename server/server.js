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


// ========================================
// CONNECT DATABASE
// ========================================

connectDB();


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