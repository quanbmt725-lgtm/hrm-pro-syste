require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const seedData = require("./seed/seedData");
const initAdmin = require("./seed/initAdmin");
const { protect } = require("./middleware/auth");

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static files (frontend) ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── Public routes (khong can token) ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", require("./routes/auth"));

// ── Protected API routes (can JWT token) ─────────────────────────────────────
app.use("/api/departments", protect, require("./routes/departments"));
app.use("/api/users",       protect, require("./routes/users"));
app.use("/api/projects",    protect, require("./routes/projects"));
app.use("/api/tasks",       protect, require("./routes/tasks"));
app.use("/api/timelogs",    protect, require("./routes/timelogs"));
app.use("/api/dashboard",   protect, require("./routes/dashboard"));
app.use("/api/performance", protect, require("./routes/performance"));

// ── Admin-only routes ─────────────────────────────────────────────────────────
app.use("/api/accounts",    protect, require("./routes/accounts"));

// ── SPA Fallback: tra ve login.html hoac index.html ──────────────────────────
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ── Start server (chi chay local, khong phai tren Vercel) ────────────────────
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL !== "1") {
  app.listen(PORT, async () => {
    console.log(`\n[Server] HRM Pro dang chay tai http://localhost:${PORT}`);
    if (process.env.AUTO_SEED !== "false") {
      await seedData();
    }
    await initAdmin();
  });
}

module.exports = app;
