const multer = require("multer");


// ========================================
// STORE FILE IN MEMORY
// ========================================

const storage = multer.memoryStorage();


// ========================================
// IMAGE-ONLY FILTER (LEGACY)
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
// MULTER (LEGACY - IMAGES ONLY)
// ========================================

const upload = multer({

  storage,

  fileFilter,

  limits: {

    files: 3,

    fileSize: 5 * 1024 * 1024,

  },

});


// ========================================
// PROBLEM MEDIA FILTER
// ========================================
// Accepts photos, one video and supporting documents
// (PDF / Word / text). Each file type is validated by
// mimetype; documents are matched against an explicit
// allowlist instead of a generic prefix.

const DOCUMENT_MIMETYPES = [

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "text/plain",

];

const mediaFileFilter = (req, file, cb) => {

  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    DOCUMENT_MIMETYPES.includes(file.mimetype)
  ) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only image, video or document (PDF, Word, text) files are allowed."
      ),
      false
    );

  }

};


// ========================================
// MULTER (PROBLEM MEDIA)
// ========================================
// 3 photos + 1 video + 3 documents per submission.
// The 50 MB per-file limit accommodates short phone
// recordings; photos and documents are additionally
// validated on the client.

const uploadProblemMedia = multer({

  storage,

  fileFilter: mediaFileFilter,

  limits: {

    files: 7,

    fileSize: 50 * 1024 * 1024,

  },

}).fields([

  { name: "images", maxCount: 3 },

  { name: "videos", maxCount: 1 },

  { name: "documents", maxCount: 3 },

]);


module.exports = { upload, uploadProblemMedia };
