import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ==================== DATABASE CONNECTION ==================== //
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ==================== TABLES ==================== //
await db.query(`
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  course VARCHAR(100),
  gender ENUM('male','female'),
  email VARCHAR(150)
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
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
  checkout_date TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (unit_code, room_number) REFERENCES rooms(unit_code, room_number)
);
`);

console.log("✅ Database ready.");

// ==================== DEFAULT ADMIN CREATION ==================== //
const [adminCheck] = await db.query("SELECT * FROM users WHERE username = 'admin01'");
if (adminCheck.length === 0) {
  const hashed = await bcrypt.hash("AdminPass01", 10);
  await db.query(
    "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
    [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
  );
  console.log("🛡️ Default admin created: admin01 / AdminPass01");
}

// ==================== AUTH ROUTES ==================== //

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing username or password" });

    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) return res.status(401).json({ error: "Invalid username or password" });

    const user = users[0];
    let match = false;

    if (user.password.startsWith("$2")) {
      match = await bcrypt.compare(password, user.password);
    } else if (password === user.password) {
      match = true;
      const hash = await bcrypt.hash(password, 10);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [hash, user.id]);
    }

    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    return res.json({
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

// CHANGE PASSWORD
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

// ADMIN DASHBOARD
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const [students] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [rooms] = await db.query("SELECT COUNT(*) AS total FROM rooms");
    const [checkedIn] = await db.query(
      "SELECT COUNT(*) AS total FROM checkin_checkout WHERE checkout_date IS NULL"
    );

    res.json({
      totalStudents: students[0].total,
      totalRooms: rooms[0].total,
      checkedIn: checkedIn[0].total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// STATIC FRONTEND
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// SERVER
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
