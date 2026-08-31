const multer = require("multer");


// ========================================
// STORE FILE IN MEMORY
// ========================================

const storage = multer.memoryStorage();


// ========================================
// FILE FILTER
// ========================================

const fileFilter = (req, file, cb) => {

  if (file.mimetype.startsWith("image/")) {

    cb(null, true);

  } else {

    cb(
      new Error("Only image files are allowed."),
      false
    );

  }

};


// ========================================
// MULTER
// ========================================

const upload = multer({

  storage,

  fileFilter,

  limits: {

    files: 3,

    fileSize: 5 * 1024 * 1024,

  },

});


module.exports = upload;