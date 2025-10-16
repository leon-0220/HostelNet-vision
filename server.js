import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ===================== SETUP ===================== //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "hostelnet-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// ===================== DATABASE (MYSQL) ===================== //
const db = await mysql.createConnection({
  host: "crossover.proxy.rlwy.net",  
  user: "root", 
  password: "uWSKTbteHaXWZipnkABQiVSUvuhZVTda",   
  database: "railway", 
});

console.log("✅ Connected to MySQL database");

// ===================== API ROUTES ===================== //

// Dashboard data (Admin)
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const [students] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [rooms] = await db.query("SELECT COUNT(*) AS allocated FROM rooms WHERE allocated=1");
    const [checkedIn] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status='checked-in'");
    const [checkedOut] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status='checked-out'");
    const [recent] = await db.query("SELECT id, name, room, status FROM students ORDER BY id DESC LIMIT 5");

    res.json({
      totalStudents: students[0].total,
      roomsAllocated: rooms[0].allocated,
      checkedIn: checkedIn[0].total,
      checkedOut: checkedOut[0].total,
      recent,
    });
  } catch (err) {
    console.error("❌ Dashboard Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== FRONTEND PAGE (optional) ===================== //
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===================== START SERVER ===================== //
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
