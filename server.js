import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ===================== SETUP ===================== //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===================== DATABASE CONNECTION ===================== //
const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hostelnet",
  connectionLimit: 10,
});

// ===================== ROUTES ===================== //

// Dashboard summary
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const [students] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [rooms] = await db.query("SELECT COUNT(*) AS allocated FROM rooms WHERE allocated = 1");
    const [checkedIn] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status = 'checked-in'");
    const [checkedOut] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status = 'checked-out'");
    const [recent] = await db.query("SELECT id, name, room, status FROM students ORDER BY id DESC LIMIT 5");

    res.json({
      totalStudents: students[0].total,
      roomsAllocated: rooms[0].allocated,
      checkedIn: checkedIn[0].total,
      checkedOut: checkedOut[0].total,
      recent,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Students list
app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Students Error:", err);
    res.status(500).json({ error: "Failed to load students" });
  }
});

// Rooms list
app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rooms ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Rooms Error:", err);
    res.status(500).json({ error: "Failed to load rooms" });
  }
});

// Check-in / Check-out records
app.get("/api/checkins", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM checkins ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Checkins Error:", err);
    res.status(500).json({ error: "Failed to load checkin data" });
  }
});

// ===================== HOST FRONTEND ===================== //
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===================== START SERVER ===================== //
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
