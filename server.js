// ===================== IMPORTS ===================== //
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
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
  host: process.env.DB_HOST || "hostelnet-0220-hostelnet-db.g.aivencloud.com",
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD || "AVNS_exgb7fcLJ3IbAbkYyjk",
  database: process.env.DB_NAME || "defaultdb",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT): 13379,
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
      "https://hostelnet-vision-3.onrender.com",
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

// ===================== API ROUTES ===================== //

// === TEST DB === //
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS time");
    res.json({ success: true, message: "✅ Database connected!", time: rows[0].time });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed" });
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

    // ✅ Hash password
    const hashed = await bcrypt.hash(password, 10);

    if (role.toLowerCase() === "student") {
      // Insert into students
      await db.query(
        `INSERT INTO students 
          (student_id, name, gender, course, room, phone, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [student_id, full_name, gender, course || null, room_number || null, phone_number || null]
      );

      // Insert into users
      await db.query(
        `INSERT INTO users
          (student_id, username, email, password, role, must_change_password)
         VALUES (?, ?, ?, ?, 'student', TRUE)`,
        [student_id, username, userEmail, hashed]
      );
    } else if (role.toLowerCase() === "admin") {
      // Insert admin into users table only
      await db.query(
        `INSERT INTO users
          (username, email, password, role, must_change_password)
         VALUES (?, ?, ?, 'admin', TRUE)`,
        [username, userEmail, hashed]
      );
    } else {
      return res.status(400).json({ error: "Invalid role selected." });
    }

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

// === GET MY DETAILS === //
app.get("/api/my-details", async (req, res) => {
  try {
    // Pastikan user login
    if (!req.session.user || !req.session.user.student_id) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const studentID = req.session.user.student_id;

    // Ambil data dari students + checkin_checkout
    const [rows] = await db.query(
      `SELECT s.student_id, s.name AS full_name, s.gender, s.course, s.phone,
              c.unit_code AS hostel_unit, c.room_number
       FROM students s
       LEFT JOIN checkin_checkout c 
       ON s.student_id = c.student_id AND c.checkout_date IS NULL
       WHERE s.student_id = ?`,
      [studentID]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Student not found" });

    const student = rows[0];

    res.json({
      full_name: student.full_name || "N/A",
      course: student.course || "N/A",
      student_id: student.student_id || "N/A",
      phone: student.phone || "N/A",
      hostel_unit: student.hostel_unit || "N/A",
      room_number: student.room_number || "N/A"
    });
  } catch (err) {
    console.error("❌ Error fetching my details:", err);
    res.status(500).json({ error: "Failed to fetch my details" });
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

// ===================== STATIC FRONTEND ===================== //
app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit frontend at https://leon-0220.github.io/HostelNet-vision/");
});

// ===================== START SERVER ===================== //
app.listen(PORT, () => {
  console.log(`🚀 Server running at https://hostelnet-vision-3.onrender.com (PORT: ${PORT})`);
});