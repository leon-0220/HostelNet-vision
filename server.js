// ===================== IMPORTS ===================== //
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
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
import session from "express-session";

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
        [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
      );
      console.log("🛡 Default admin created: admin01 / AdminPass01");
    }
  } catch (err) {
    console.error("❌ Database init failed:", err);
    process.exit(1);
  }
})();

// ===================== PROFILE PICTURE UPLOAD ===================== //
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${req.session.user.student_id}_${Date.now()}.${ext}`);
  }
});
const upload = multer({ storage });

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

// ===================== UPLOAD PROFILE PICTURE ===================== //
app.post("/api/upload-profile-pic", upload.single("profile_pic"), async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.student_id)
      return res.status(401).json({ success: false, error: "Not logged in" });

    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    const student_id = req.session.user.student_id;
    const filename = req.file.filename;

    // Pastikan column profile_pic ada
    await db.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_pic VARCHAR(255) DEFAULT NULL");
    await db.query("UPDATE students SET profile_pic=? WHERE student_id=?", [filename, student_id]);

    res.json({ success: true, message: "Profile picture uploaded!", filename });
  } catch (err) {
    console.error("❌ Upload profile pic error:", err);
    res.status(500).json({ success: false, error: "Server error uploading profile picture" });
  }
});

// ===================== API ROUTES ===================== //

// === TEST DB === //
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS current_time");
    res.json({ 
      success: true, 
      message: "✅ Database connected!", 
      current_time: rows[0].current_time, 
      db_host: process.env.DB_HOST,
      db_name: process.env.DB_NAME
    });
  } catch (err) {
    console.error("❌ Database connection test failed:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "❌ Database connection failed",
      error: err.message
    });
  }
});

// === ADMIN RESET === //
app.get("/api/reset-admin", async (req, res) => {
  try {
    const hashed = await bcrypt.hash("AdminPass01", 10);
    await db.query("DELETE FROM users WHERE username = 'admin01'");
    await db.query(
      "INSERT INTO users (student_id, username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)",
      [null, "admin01", "admin01@gmail.com", hashed, "admin", false]
    );
    res.json({ success: true, message: "🛡 Admin reset: admin01 / AdminPass01" });
  } catch (err) {
    console.error("❌ Admin reset error:", err);
    res.status(500).json({ error: "Failed to reset admin" });
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
      hostel_unit,
      room_number,
      staff_id
    } = req.body;

    // ❌ Validation
    if (!full_name || !username || !password || !gender || !role) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    // ❌ Check username/email exist
    const userEmail = username + "@hostelnet.com"; // autofill email
    const [exists] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, userEmail]
    );
    if (exists.length > 0) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const userRole = role.toLowerCase() === "admin" ? "admin" : "student";

    if (userRole === "student") {
      await db.query(
        `INSERT INTO students 
          (student_id, name, gender, course, room, phone, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [student_id, full_name, gender, course || null, room_number || null, phone_number || null]
      );
    }

    await db.query(
      `INSERT INTO users
        (student_id, username, email, password, role, must_change_password)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [userRole === "student" ? student_id : null, username, userEmail, hashed, userRole]
    );

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ error: "Server error during registration" });
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
                s.profile_pic,
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
        check_in_date: student.checkin_date ? new Date(student.checkin_date).toISOString().split("T")[0] : "N/A",
        profile_pic: student.profile_pic || null
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
        check_in_date: "—",
        profile_pic: null
      });
    }

    res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    console.error("❌ Error fetching my details:", err);
    res.status(500).json({ error: "Failed to fetch my details" });
  }
});

// === GET CURRENT USER (check session) === //
app.get("/api/current-user", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No active session" });
  }
  res.json({ loggedIn: true, user: req.session.user });
});

// === LOGOUT === //
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// === GET STUDENT PROFILE BY ID === //
app.get("/api/students/:studentID", async (req, res) => {
  try {
    const { studentID } = req.params;
    const [studentRows] = await db.query(
      `SELECT s.student_id, s.name, s.gender, s.course, s.status AS student_status,
              c.unit_code, c.room_number, c.checkin_date, c.checkout_date
       FROM students s
       LEFT JOIN checkin_checkout c ON s.student_id = c.student_id AND c.checkout_date IS NULL
       WHERE s.student_id = ?`,
      [studentID]
    );

    if (studentRows.length === 0) return res.status(404).json({ error: "Student not found" });

    const student = studentRows[0];
    res.json({
      student_id: student.student_id,
      name: student.name,
      gender: student.gender,
      course: student.course || "N/A",
      hostel_unit: student.unit_code || "N/A",
      room_number: student.room_number || "N/A",
      check_in_date: student.checkin_date ? new Date(student.checkin_date).toISOString().split("T")[0] : "N/A",
      check_out_date: student.checkout_date ? new Date(student.checkout_date).toISOString().split("T")[0] : "N/A",
      status: student.student_status || (student.checkout_date ? "Checked-out" : "Active"),
    });
  } catch (err) {
    console.error("❌ Error fetching student profile:", err);
    res.status(500).json({ error: "Failed to fetch student profile" });
  }
});

// === GET HOSTELS BY GENDER === //
app.get("/api/hostels/:gender", async (req, res) => {
  try {
    const { gender } = req.params;
    const [rows] = await db.query(
      `SELECT hu.unit_code, hu.unit_name, hu.gender,
              COUNT(r.room_number) AS total_rooms, SUM(r.available) AS available_beds
       FROM hostel_units hu
       JOIN rooms r ON hu.unit_code = r.unit_code
       WHERE hu.gender = ? AND r.available > 0 AND r.status = 'active'
       GROUP BY hu.unit_code, hu.unit_name, hu.gender
       ORDER BY hu.unit_name ASC`,
      [gender]
    );
    res.json({ success: true, count: rows.length, hostels: rows });
  } catch (err) {
    console.error("❌ Error fetching hostel units:", err);
    res.status(500).json({ error: "Failed to load hostel units" });
  }
});

// === STUDENT CHECK-IN === //
app.post("/api/checkin", async (req, res) => {
  try {
    const { student_id, unit_code, room_number, checkin_date } = req.body;

    if (!student_id || !unit_code || !room_number || !checkin_date) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check student exist
    const [studentCheck] = await db.query("SELECT * FROM students WHERE student_id = ?", [student_id]);
    if (studentCheck.length === 0) return res.status(404).json({ error: "Student not found" });

    // Prevent double check-in (if not checked out)
    const [existing] = await db.query(
      "SELECT * FROM checkin_checkout WHERE student_id = ? AND checkout_date IS NULL",
      [student_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Student already checked in." });
    }

    // Insert new check-in
    await db.query(
      `INSERT INTO checkin_checkout (student_id, unit_code, room_number, checkin_date)
       VALUES (?, ?, ?, ?)`,
      [student_id, unit_code, room_number, checkin_date]
    );

    // Update student status
    await db.query("UPDATE students SET status = 'checked-in', room = ? WHERE student_id = ?", [
      room_number,
      student_id,
    ]);

    res.json({ success: true, message: "✅ Check-in successful!" });
  } catch (err) {
    console.error("❌ Check-in error:", err);
    res.status(500).json({ error: "Server error during check-in" });
  }
});

// ===================== STUDENT CHECKOUT =====================
app.post("/api/checkout", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.student_id) {
      return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const { checkout_date } = req.body;
    const student_id = req.session.user.student_id;

    if (!checkout_date) {
      return res.status(400).json({ success: false, error: "Checkout date is required" });
    }

    // Pastikan student ada record check-in aktif
    const [checkinRows] = await db.query(
      "SELECT * FROM checkin_checkout WHERE student_id = ? AND checkout_date IS NULL",
      [student_id]
    );

    if (checkinRows.length === 0) {
      return res.status(400).json({ success: false, error: "No active check-in found" });
    }

    const record = checkinRows[0];

    // Update checkout date
    await db.query(
      "UPDATE checkin_checkout SET checkout_date = ? WHERE record_id = ?",
      [checkout_date, record.record_id]
    );

    // Update student status to checked-out
    await db.query(
      "UPDATE students SET status = 'checked-out', room = NULL WHERE student_id = ?",
      [student_id]
    );

    res.json({ success: true, message: "✅ Checkout saved successfully!" });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ success: false, error: "Server error during checkout" });
  }
});

// ===================== STUDENT CHECK-IN =====================
app.post("/api/checkin", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.student_id) {
      return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const student_id = req.session.user.student_id;
    const { unit_code, room_number, checkin_date } = req.body;

    if (!unit_code || !room_number || !checkin_date) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    // Pastikan student wujud
    const [studentRows] = await db.query("SELECT * FROM students WHERE student_id = ?", [student_id]);
    if (studentRows.length === 0) return res.status(404).json({ success: false, error: "Student not found" });

    // Cek kalau student dah check-in aktif (belum checkout)
    const [existing] = await db.query(
      "SELECT * FROM checkin_checkout WHERE student_id = ? AND checkout_date IS NULL",
      [student_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: "Student already checked in." });
    }

    // Masukkan record check-in
    await db.query(
      `INSERT INTO checkin_checkout (student_id, unit_code, room_number, checkin_date)
       VALUES (?, ?, ?, ?)`,
      [student_id, unit_code, room_number, checkin_date]
    );

    // Update student status
    await db.query(
      "UPDATE students SET status = 'checked-in', room = ? WHERE student_id = ?",
      [room_number, student_id]
    );

    res.json({ success: true, message: "✅ Check-in successful!" });
  } catch (err) {
    console.error("❌ Check-in error:", err);
    res.status(500).json({ success: false, error: "Server error during check-in" });
  }
});

// ===================== CHANGE PASSWORD ===================== //
app.post("/api/change-password", async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.username) {
      return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const { new_password, confirm_password } = req.body;

    if (!new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: "Both fields are required" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    // Hash baru
    const hashed = await bcrypt.hash(new_password, 10);

    // Update user
    await db.query(
      "UPDATE users SET password = ?, must_change_password = FALSE WHERE username = ?",
      [hashed, req.session.user.username]
    );

    // Update session flag
    req.session.user.must_change_password = false;

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/registered-students", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, name, email, program, room_number
      FROM students
      WHERE hostel_registered = 1
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    res.status(500).json({ message: "Database error" });
  }
});
app.post("/api/add-student", async (req, res) => {
  try {
    const { name, room, contact, status } = req.body;
    if (!name || !room || !contact || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Insert into students table
    const [result] = await db.query(
      "INSERT INTO students (name, room, phone, status) VALUES (?, ?, ?, ?)",
      [name, room, contact, status]
    );

    res.json({ message: "Student added successfully!", id: result.insertId });
  } catch (err) {
    console.error("❌ Add student error:", err);
    res.status(500).json({ message: "Server error adding student" });
  }
});

app.post("/api/add-room", async (req, res) => {
  try {
    const { unit_code, room_number, capacity } = req.body;
    if (!unit_code || !room_number || !capacity) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Tambah bilik baru dalam unit asrama
    await db.query(
      "INSERT INTO rooms (unit_code, room_number, capacity, available, status) VALUES (?, ?, ?, ?, 'active')",
      [unit_code, room_number, capacity, capacity] // 'available' mula = capacity penuh
    );

    res.json({ success: true, message: "Room added successfully!" });
  } catch (err) {
    console.error("❌ Add room error:", err);
    res.status(500).json({ message: "Server error adding room" });
  }
});


app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const [[{ total_students }]] = await db.query("SELECT COUNT(*) AS total_students FROM students");
    const [[{ occupied_rooms }]] = await db.query("SELECT COUNT(*) AS occupied_rooms FROM rooms WHERE status='Occupied'");
    res.json({ total_students, occupied_rooms });
  } catch (err) {
    console.error("❌ Dashboard stats error:", err);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
});

app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.unit_code, hu.unit_name, hu.gender, r.room_number, r.capacity, r.available, r.status
      FROM rooms r
      JOIN hostel_units hu ON r.unit_code = hu.unit_code
      ORDER BY hu.unit_name, r.room_number;
    `);
    res.json({ success: true, rooms: rows });
  } catch (err) {
    console.error("❌ Fetch rooms error:", err);
    res.status(500).json({ error: "Server error fetching rooms" });
  }
});

// === GET ALL ROOMS === //
app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        hu.gender,
        hu.unit_name AS building,
        r.room_number AS room_no
      FROM rooms r
      JOIN hostel_units hu ON r.unit_code = hu.unit_code
      ORDER BY hu.gender, hu.unit_name, r.room_number
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
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
