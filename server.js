import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

// ===================== SETUP ===================== //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ===================== CONFIG (TANPA .env) ===================== //
const PORT = 8080;
const DB_CONFIG = {
  host: "gondola.proxy.rlwy.net",
  user: "root",
  password: "JwOzMilejTKDdMkSNJklrBplJbYzXQNo",
  database: "railway",
  port: 30273,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ===================== MIDDLEWARE ===================== //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===================== DATABASE CONNECTION ===================== //
let db;
try {
  db = await mysql.createPool(DB_CONFIG);
  console.log("✅ Database connected successfully!");
} catch (err) {
  console.error("❌ Database connection failed:", err);
  process.exit(1);
}

// ===================== TABLE CREATION ===================== //
await db.query(`
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  room VARCHAR(50),
  status ENUM('pending','checked-in','checked-out') DEFAULT 'pending'
);
`);

await db.query(`
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','admin') DEFAULT 'student',
  must_change_password BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await db.query(`
CREATE TABLE IF NOT EXISTS hostel_units (
  unit_code VARCHAR(20) PRIMARY KEY,
  unit_name VARCHAR(100) NOT NULL,
  description TEXT
);
`);

await db.query(`
CREATE TABLE IF NOT EXISTS rooms (
  unit_code VARCHAR(20) NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  available INT NOT NULL DEFAULT 0,
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  PRIMARY KEY (unit_code, room_number),
  FOREIGN KEY (unit_code) REFERENCES hostel_units(unit_code) ON DELETE CASCADE
);
`);

await db.query(`
CREATE TABLE IF NOT EXISTS checkin_checkout (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  unit_code VARCHAR(20) NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  checkin_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checkout_date TIMESTAMP NULL
);
`);

console.log("✅ Database tables verified/created successfully.");

// ===================== DEFAULT ADMIN ===================== //
const [adminCheck] = await db.query("SELECT * FROM users WHERE username = 'admin01'");
if (adminCheck.length === 0) {
  const hashed = await bcrypt.hash("AdminPass01", 10);
  await db.query(
    "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
    [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
  );
  console.log("🛡️ Default admin created: admin01 / AdminPass01");
}

// ===================== API ROUTES ===================== //

// --- TEST DB CONNECTION --- //
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS time");
    res.json({ success: true, message: "✅ Database connected!", time: rows[0].time });
  } catch (err) {
    console.error("❌ DB Test Error:", err);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// --- GET STUDENTS --- //
app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Students fetch error:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// --- ADD STUDENT --- //
app.post("/api/students", async (req, res) => {
  try {
    const { name, room, status } = req.body;
    if (!name || !room || !status)
      return res.status(400).json({ error: "Missing required fields" });

    const [result] = await db.query(
      "INSERT INTO students (name, room, status) VALUES (?, ?, ?)",
      [name, room, status]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Add student error:", err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

// --- DELETE STUDENT --- //
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM students WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Student not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// --- GET ROOMS --- //
app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM rooms");
    res.json(rows);
  } catch (err) {
    console.error("Rooms fetch error:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// --- GET CHECK-IN/CHECK-OUT --- //
app.get("/api/checkins", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.record_id AS id, c.student_id, c.unit_code, c.room_number,
             c.checkin_date, c.checkout_date
      FROM checkin_checkout c
      ORDER BY c.checkin_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Checkin fetch error:", err);
    res.status(500).json({ error: "Failed to fetch check-in/out records" });
  }
});

// --- LOGIN --- //
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing username or password" });

    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0)
      return res.status(401).json({ error: "Invalid username or password" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    res.json({
      success: true,
      user_id: user.id,
      role: user.role,
      must_change_password: !!user.must_change_password,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- CHANGE PASSWORD --- //
app.post("/api/change-password", async (req, res) => {
  try {
    const { user_id, new_password } = req.body;
    if (!user_id || !new_password)
      return res.status(400).json({ error: "Missing fields" });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query(
      "UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?",
      [hashed, user_id]
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== STATIC FRONTEND ===================== //
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/change-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "change-password.html"));
});

// ===================== START SERVER ===================== //
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
