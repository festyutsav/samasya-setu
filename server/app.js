const express = require("express");

const cors = require("cors");

const problemRoutes = require("./routes/problemRoutes");

const authRoutes = require("./routes/authRoutes");

const adminRoutes = require("./routes/adminRoutes");

const partnerRoutes = require("./routes/partnerRoutes");

const aiRoutes =
  require("./routes/aiRoutes");

const projectRoutes = require("./routes/projectRoutes");

const proposalRoutes = require("./routes/proposalRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const app = express();

// Middleware

app.use(cors());

app.use(express.json());

// Health check & warmup route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SamasyaSetu API",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("SamasyaSetu API is running successfully!");
});

// Authentication routes

app.use("/api/auth", authRoutes);

// Problem routes

app.use("/api/problems", problemRoutes);

// Admin routes

app.use("/api/admin", adminRoutes);

// Partner routes

app.use("/api/partners", partnerRoutes);

app.use(
  "/api/ai",
  aiRoutes
);

// University project routes

app.use("/api/projects", projectRoutes);

// Proposal routes

app.use("/api/proposals", proposalRoutes);

// Notification routes

app.use("/api/notifications", notificationRoutes);

// Global Error Handler (Handles Multer and other server errors)
app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    let message = "Image upload failed.";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image size is too large. Maximum size is 5MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "You can upload a maximum of 3 images.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected field for image uploads.";
    }
    return res.status(400).json({
      message,
      error: err.message,
    });
  }

  // Handle custom image type filter error from Multer
  if (err.message === "Only image files are allowed.") {
    return res.status(400).json({
      message: err.message,
    });
  }

  console.error("Unhandled Server Error:", err);
  return res.status(500).json({
    message: "An internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
