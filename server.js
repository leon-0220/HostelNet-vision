import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // Baca ENV variables dari Render

// Setup __dirname sebab ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== MIDDLEWARE ===================== //
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors()); // benarkan frontend GitHub access backend

// Session setup
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// ===================== DATABASE CONNECTION ===================== //
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
    });
    console.log("✅ Database connected!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// ===================== ROUTES ===================== //

// Default route — buka login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===================== REGISTER ROUTE ===================== //
app.post("/register", async (req, res) => {
  const { id, uname, email, password, gender, role } = req.body;

  if (!id || !uname || !email || !password || !gender || !role) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  try {
    // semak kalau user dah ada
    const [check] = await db.query(
      "SELECT * FROM users WHERE id = ? OR email = ?",
      [id, email]
    );

    if (check.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user baru
    await db.query(
      "INSERT INTO users (id, username, email, password, gender, role) VALUES (?, ?, ?, ?, ?, ?)",
      [id, uname, email, hashedPassword, gender, role]
    );

    res.status(200).json({ message: "Registration successful." });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ===================== LOGIN ROUTE ===================== //
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 1) {
      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        req.session.username = user.username;
        req.session.role = user.role;

        return res.status(200).json({
          success: true,
          role: user.role,
          message: "Login successful",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Wrong password!",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ===================== FORGOT PASSWORD ROUTE ===================== //
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    const user = rows[0];
    const resetToken = Math.random().toString(36).substr(2, 8);
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?",
      [resetToken, expiry, user.id]
    );

    console.log(`🔐 Reset token for ${email}: ${resetToken}`);
    res.json({ success: true, message: "Reset link sent!" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ===================== TEST DATABASE ROUTE ===================== //
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ success: true, time: rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===================== SERVER START ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ===================== CHECK-IN ROUTE ===================== //
app.post("/checkin", async (req, res) => {
  const { studentId, studentName, course, block, roomNo, checkinDate } = req.body;

  if (!studentId || !studentName || !course || !block || !roomNo || !checkinDate) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  try {
    await db.query(
      "INSERT INTO checkins (student_id, student_name, course, block, room_no, checkin_date) VALUES (?, ?, ?, ?, ?, ?)",
      [studentId, studentName, course, block, roomNo, checkinDate]
    );

    res.status(200).json({ message: "Check-in recorded successfully." });
  } catch (err) {
    console.error("❌ Check-in Error:", err);
    res.status(500).json({ message: "Database error." });
  }
});

// ===================== STUDENT CHECKOUT ROUTE ===================== //
app.post("/api/checkout", async (req, res) => {
  const { student_id, block, room_no, checkout_date } = req.body;

  if (!student_id || !block || !room_no || !checkout_date) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  try {
    // semak student wujud
    const [student] = await db.query("SELECT * FROM checkin WHERE student_id = ?", [student_id]);

    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found or not checked in." });
    }

    // simpan checkout data dalam table checkout
    await db.query(
      "INSERT INTO checkout (student_id, block, room_no, checkout_date) VALUES (?, ?, ?, ?)",
      [student_id, block, room_no, checkout_date]
    );

    // optional: delete record dari table checkin
    await db.query("DELETE FROM checkin WHERE student_id = ?", [student_id]);

    res.json({ success: true, message: "Checkout recorded successfully!" });
  } catch (err) {
    console.error("❌ Checkout Error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ===================== FINANCE ROUTE ===================== //
app.get("/api/finance", async (req, res) => {
  try {
    // contoh: ambil user id dari session/login
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not logged in" });

    const [rows] = await db.query(
      "SELECT name, student_id, course, semester, total_due FROM finance WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "No finance data found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Finance fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================= PAYMENT ROUTE ======================== //
app.post("/api/payment", async (req, res) => {
  try {
    const { name, student_id, amount, method, details } = req.body;

    if (!name || !student_id || !amount || !method || !details) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await db.query(
      "INSERT INTO payments (name, student_id, amount, method, details, date) VALUES (?, ?, ?, ?, ?, NOW())",
      [name, student_id, amount, method, details]
    );

    res.json({ message: "Payment recorded successfully" });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
