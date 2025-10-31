// ===================== IMPORTS ===================== //
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ===================== SETUP ===================== //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ===================== CONFIG ===================== //
const PORT = process.env.PORT || 8080;
const DB_CONFIG = {
  host: process.env.DB_HOST || "centerbeam.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "qxFWSgDsLImTcNYatgzJuVlcyXFAKezT",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT): 37606,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ===================== MIDDLEWARE ===================== //
app.use(
  cors({
    origin: [
      "https://leon-0220.github.io",
      "https://leon-0220.github.io/HostelNet-vision",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://hostelnet-2.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// === SESSION SETUP === //
app.use(session({
  secret: "hostelnet-secret-key", 
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", 
    httpOnly: true,
    maxAge: 1000 * 60 * 60 
  }
}));

// ===================== DATABASE INIT ===================== //
let db;
(async () => {
  try {
    db = await mysql.createPool(DB_CONFIG);
    console.log("✅ Database connected successfully!");

    // ====== CREATE TABLES ====== //
    await db.query(`CREATE TABLE IF NOT EXISTS students (
      student_id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      gender ENUM('Male','Female') NOT NULL,
      course VARCHAR(100),
      room VARCHAR(50),
      status ENUM('pending','checked-in','checked-out') DEFAULT 'pending',
      phone VARCHAR(20)
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
      gender ENUM('Male','Female') NOT NULL,
      unit_name VARCHAR(100) NOT NULL,
      description TEXT
    );`);

    await db.query(`CREATE TABLE IF NOT EXISTS rooms (
      unit_code VARCHAR(20) NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      capacity INT NOT NULL DEFAULT 4,
      available INT NOT NULL DEFAULT 4,
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

    // ====== INSERT HOSTEL UNITS IF NOT EXIST ====== //
    const hostelUnits = [
      ["KELANA-M", "Male", "Kelana Parkview"],
      ["SS4D-M", "Male", "SS4D/8"],
      ["SS4C-M", "Male", "SS4C/15"],
      ["SS5D-M", "Male", "SS5D/6A"],
      ["SS4B-M", "Male", "SS4B/13"],
      ["SS5C-M", "Male", "SS5C/11"],
      ["SPACEPOD-M", "Male", "Spacepod"],
      ["KELANA-F", "Female", "Kelana Parkview"],
      ["SS5D-F", "Female", "SS5D/8"],
      ["AYAMAS-F", "Female", "Ayamas"],
      ["FOCUS-F", "Female", "Focus Point"],
      ["711-F", "Female", "7-11"],
      ["SS6-F", "Female", "SS6/8"],
      ["SPACEPOD-F", "Female", "Spacepod 20"],
    ];

    for (const [code, gender, name] of hostelUnits) {
      await db.query(
        `INSERT IGNORE INTO hostel_units (unit_code, gender, unit_name) VALUES (?, ?, ?)`,
        [code, gender, name]
      );
    }

    console.log("🏠 Hostel units inserted (if missing)");

    // ====== DEFAULT ADMIN ====== //
const [adminCheck] = await db.query(
  "SELECT * FROM users WHERE username = 'admin01'"
);
if (adminCheck.length === 0) {
  const hashed = await bcrypt.hash("AdminPass01", 10);
  await db.query(
    "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
    [null, "admin01", "admin01@gmail.com", hashed, "admin", false]  // student_id = NULL untuk admin
  );
  console.log("🛡 Default admin created: admin01 / AdminPass01");
}
  }});

// ===================== UPDATE PROFILE INFO ===================== //
app.post("/api/update-profile", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.student_id)
      return res.status(401).json({ success: false, error: "Not logged in" });

    const student_id = req.session.user.student_id;
    const { full_name, course, phone } = req.body;

    if (!full_name || !course)
      return res.status(400).json({ success: false, error: "Full name and course required" });

    await db.query(
      `UPDATE students SET name=?, course=?, phone=? WHERE student_id=?`,
      [full_name, course, phone || null, student_id]
    );

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ success: false, error: "Server error updating profile" });
  }
});

// ===================== UPDATE PASSWORD ===================== //
app.post("/api/update-password", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.student_id)
      return res.status(401).json({ success: false, error: "Not logged in" });

    const student_id = req.session.user.student_id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password)
      return res.status(400).json({ success: false, error: "Both old and new password required" });

    const [users] = await db.query("SELECT * FROM users WHERE student_id=?", [student_id]);
    if (!users.length) return res.status(404).json({ error: "User not found" });

    const user = users[0];
    const match = await bcrypt.compare(old_password, user.password);
    if (!match) return res.status(400).json({ error: "Old password incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password=?, must_change_password=0 WHERE student_id=?", [hashed, student_id]);

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("❌ Update password error:", err);
    res.status(500).json({ success: false, error: "Server error updating password" });
  }
});

// ===================== REGISTER ROUTE ===================== //
app.post("/api/register", async (req, res) => {
  try {
    const {
      full_name,
      student_id,
      username,
      password,
      phone_number,
      gender,
      role,
      course,
      staff_id
    } = req.body;

    console.log("REQ BODY:", req.body);

    // ======== VALIDATION ======== //
    if (!full_name || !password || !gender || !role) {
      return res.status(400).json({ success: false, error: "Please fill in all required fields." });
    }

    const cleanedRole = role.trim().toLowerCase();

    if (cleanedRole === "student" && !student_id) {
      return res.status(400).json({ success: false, error: "Student ID is required for students." });
    }
    if (cleanedRole === "admin" && !staff_id) {
      return res.status(400).json({ success: false, error: "Staff ID is required for admins." });
    }

    // ======== PREPARE USER DATA ======== //
    const userUsername = cleanedRole === "admin" ? staff_id.trim() : username.trim();
    const userEmail = cleanedRole === "admin" ? staff_id.trim() + "@hostelnet.com" : username.trim() + "@hostelnet.com";

    // ======== CHECK DUPLICATES ======== //
    const [existing] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [userUsername, userEmail]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: "Username or email already exists." });
    }

    if (cleanedRole === "student") {
      const [studentExists] = await db.query("SELECT * FROM students WHERE student_id = ?", [student_id]);
      if (studentExists.length > 0) {
        return res.status(400).json({ success: false, error: "Student ID already registered." });
      }
    }

    // ======== INSERT INTO STUDENTS (IF STUDENT) ======== //
    if (cleanedRole === "student") {
      try {
        await db.query(
          `INSERT INTO students 
            (student_id, name, gender, course, room, phone, status) 
           VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [student_id.trim(), full_name.trim(), gender, course || null, null, phone_number || null]
        );
      } catch (err) {
        console.error("❌ Insert student failed:", err);
        return res.status(500).json({ success: false, error: "Failed to register student info." });
      }
    }

    // ======== HASH PASSWORD ======== //
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      console.error("❌ Password hash failed:", err);
      if (cleanedRole === "student") {
        await db.query("DELETE FROM students WHERE student_id = ?", [student_id.trim()]);
      }
      return res.status(500).json({ success: false, error: "Failed to process password." });
    }

    // ======== INSERT INTO USERS ======== //
    try {
      await db.query(
        `INSERT INTO users
          (student_id, username, email, password, role, must_change_password)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [
          cleanedRole === "student" ? student_id.trim() : null,
          userUsername,
          userEmail,
          hashedPassword,
          cleanedRole
        ]
      );
    } catch (err) {
      console.error("❌ Insert user failed:", err);
      // rollback student insert jika student
      if (cleanedRole === "student") {
        await db.query("DELETE FROM students WHERE student_id = ?", [student_id.trim()]);
      }
      return res.status(500).json({ success: false, error: "Failed to register user." });
    }

    // ======== SUCCESS ======== //
    res.json({ success: true, message: "Registration successful! Student linked to user." });

  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ success: false, error: "Server error during registration." });
  }
});

// ===================== LOGIN ===================== //
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
    if (!match) 
      return res.status(401).json({ error: "Invalid username or password" });

    req.session.user = {
      username: user.username,
      student_id: user.student_id,
      role: user.role
    }

    res.json({ 
      success: true, 
      message: "Login successful!",
      user: req.session.user
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===================== GET MY DETAILS ===================== //
app.get("/api/my-details", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.username) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { username, student_id, role } = req.session.user;

    if (role === "student") {
      const [rows] = await db.query(
        `SELECT s.student_id, s.name AS full_name, s.gender, s.course, s.phone,
                c.unit_code AS hostel_unit, c.room_number,
                c.checkin_date
         FROM students s
         LEFT JOIN checkin_checkout c 
           ON s.student_id = c.student_id AND c.checkout_date IS NULL
         WHERE s.student_id = ?`,
        [student_id]
      );

      if (rows.length === 0) return res.status(404).json({ error: "Student not found" });

      const student = rows[0];

      return res.json({
        role: "student",
        full_name: student.full_name || "N/A",
        student_id: student.student_id || "N/A",
        email: username + "@hostelnet.com",
        phone: student.phone || "N/A",
        course: student.course || "N/A",
        hostel_unit: student.hostel_unit || "N/A",
        room_number: student.room_number || "N/A",
        check_in_date: student.checkin_date ? new Date(student.checkin_date).toISOString().split("T")[0] : "N/A"
      });
    }

    if (role === "admin") {
      const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
      if (users.length === 0) return res.status(404).json({ error: "Admin not found" });

      const admin = users[0];

      return res.json({
        role: "admin",
        full_name: admin.username,
        student_id: "—",
        email: admin.email,
        phone: "—",
        course: "—",
        hostel_unit: "—",
        room_number: "—",
        check_in_date: "—"
      });
    }

    res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    console.error("❌ Error fetching my details:", err);
    res.status(500).json({ error: "Failed to fetch my details" });
  }
});

// ===================== STATIC FRONTEND ===================== //
app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit frontend at https://leon-0220.github.io/HostelNet-vision/");
});

// ===================== START SERVER ===================== //
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://hostelnet-2.onrender.com (PORT: ${PORT})`);
});
