const express = require("express");

const cors = require("cors");

const problemRoutes = require("./routes/problemRoutes");

const authRoutes = require("./routes/authRoutes");

const adminRoutes = require("./routes/adminRoutes");

const partnerRoutes = require("./routes/partnerRoutes");

const aiRoutes =
  require("./routes/aiRoutes");

const app = express();

// Middleware

app.use(cors());

app.use(express.json());

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

module.exports = app;