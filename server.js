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

// ===================== CONFIG ===================== //
const PORT = process.env.PORT || 8080;
const DB_CONFIG = {
  host: process.env.DB_HOST || "gondola.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JwOzMilejTKDdMkSNJklrBplJbYzXQNo",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT || 30273,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ===================== MIDDLEWARE ===================== //
app.use(
  cors({
    origin: [
      "https://leon-0220.github.io",
      "https://gondola.proxy.rlwy.net",
      "https://hostelnet-vision-3.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pastikan semua static frontend dalam /public
app.use(express.static(path.join(__dirname, "public")));

// ===================== DATABASE & TABLE INIT ===================== //
let db;
(async () => {
  try {
    db = await mysql.createPool(DB_CONFIG);
    console.log("✅ Database connected successfully!");
    console.log(`📦 Connected to DB: ${DB_CONFIG.host}:${DB_CONFIG.port}`);

    // ====== CREATE TABLES IF NOT EXISTS ====== //
    await db.query(`CREATE TABLE IF NOT EXISTS students (
      student_id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      room VARCHAR(50),
      status ENUM('pending','checked-in','checked-out') DEFAULT 'pending'
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(20),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student','admin') DEFAULT 'student',
      must_change_password BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS hostel_units (
      unit_code VARCHAR(20) PRIMARY KEY,
      unit_name VARCHAR(100) NOT NULL,
      description TEXT
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS rooms (
      unit_code VARCHAR(20) NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      capacity INT NOT NULL DEFAULT 4,
      available INT NOT NULL DEFAULT 0,
      status ENUM('active','inactive','maintenance') DEFAULT 'active',
      PRIMARY KEY (unit_code, room_number),
      FOREIGN KEY (unit_code) REFERENCES hostel_units(unit_code) ON DELETE CASCADE
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS checkin_checkout (
      record_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(20) NOT NULL,
      unit_code VARCHAR(20) NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      checkin_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checkout_date TIMESTAMP NULL
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_name VARCHAR(150) NOT NULL,
      room_no VARCHAR(20) NOT NULL,
      complaint_text TEXT NOT NULL,
      date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending'
    );`);

    console.log("✅ Database tables verified/created successfully.");

    // ====== DEFAULT ADMIN ====== //
    const [adminCheck] = await db.query("SELECT * FROM users WHERE username = 'admin01'");
    if (adminCheck.length === 0) {
      const hashed = await bcrypt.hash("AdminPass01", 10);
      await db.query(
        "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
        [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
      );
      console.log("🛡 Default admin created: admin01 / AdminPass01");
    }

  } catch (err) {
    console.error("❌ Database init failed:", err);
    process.exit(1);
  }
})();

// ===================== API ROUTES ===================== //
// Test DB
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS time");
    res.json({ success: true, message: "✅ Database connected!", time: rows[0].time });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// === LOGIN === //
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
      student_id: user.student_id,
      role: user.role,
      must_change_password: !!user.must_change_password,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== STATIC FRONTEND ===================== //
app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit frontend at https://leon-0220.github.io/HostelNet-vision/");
});

// ===================== START SERVER ===================== //
app.listen(PORT, () =>
  console.log(`🚀 Server running at https://hostelnet-vision-3.onrender.com (PORT: ${PORT})`)
);