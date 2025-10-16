// server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ---------- Database pool (Railway: use env vars) ----------
const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hostelnet",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------- Ensure essential tables exist (minimal) ----------
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

// create admin user if not exists
const [adminRows] = await db.query("SELECT id FROM users WHERE username = ?", ["admin01"]);
if (adminRows.length === 0) {
  const adminPass = "AdminPass01";
  const hashed = await bcrypt.hash(adminPass, 10);
  await db.query(
    "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
    [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
  );
  console.log("🛡️ Admin user created (username: admin01, password: AdminPass01)");
}

// ---------------- AUTH ROUTES ----------------

/**
 * POST /api/login
 * body: { username, password }
 * returns: { success, user_id, role, must_change_password } OR { error }
 */
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing username or password" });

    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid username or password" });

    const user = rows[0];
    const stored = user.password || "";

    let passwordMatches = false;
    // if stored looks like bcrypt hash (starts with $2), use bcrypt compare
    if (stored.startsWith("$2")) {
      passwordMatches = await bcrypt.compare(password, stored);
    } else {
      // fallback: plain-text stored password (e.g. initial student_id) — compare directly
      passwordMatches = password === stored;
      // optional: if matches plaintext but not hashed, upgrade to hashed password silently
      if (passwordMatches) {
        const hashed = await bcrypt.hash(password, 10);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
      }
    }

    if (!passwordMatches) return res.status(401).json({ error: "Invalid username or password" });

    // login successful
    return res.json({
      success: true,
      user_id: user.id,
      role: user.role,
      must_change_password: !!user.must_change_password,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/change-password
 * body: { user_id, new_password }
 * This endpoint updates the user's password (hashed) and sets must_change_password=false
 */
app.post("/api/change-password", async (req, res) => {
  try {
    const { user_id, new_password } = req.body;
    if (!user_id || !new_password) return res.status(400).json({ error: "Missing fields" });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?", [hashed, user_id]);
    return res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------------- existing APIs (dashboard / students / rooms / checkins) ----------------
// If you already have these routes in your server.js (earlier), keep them. Example minimal endpoints:

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const [students] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [rooms] = await db.query("SELECT COUNT(*) AS total FROM rooms");
    const [checkedIn] = await db.query("SELECT COUNT(*) AS total FROM checkin_checkout WHERE checkout_date IS NULL");
    const [recent] = await db.query("SELECT student_id, name FROM students ORDER BY student_id DESC LIMIT 5");

    res.json({
      totalStudents: students[0].total || 0,
      totalRooms: rooms[0].total || 0,
      checkedIn: checkedIn[0].total || 0,
      recent,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY student_id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load students" });
  }
});

// keep other endpoints (rooms, assignments, checkins) as you had previously...

// ---------------- default route ----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
