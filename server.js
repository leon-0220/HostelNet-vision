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
      host: crossover.proxy.rlwy.net,
      user: root,
      password: uWSKTbteHaXWZipnkABQiVSUvuhZVTda,
      database: railway,
      port: 59855,
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
    const [check] = await db.query(
      "SELECT * FROM users WHERE id = ? OR email = ?",
      [id, email]
    );

    if (check.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

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
    const [student] = await db.query("SELECT * FROM checkin WHERE student_id = ?", [student_id]);

    if (student.length === 0) {
      return res.status(404).json({ message: "Student not found or not checked in." });
    }

    await db.query(
      "INSERT INTO checkout (student_id, block, room_no, checkout_date) VALUES (?, ?, ?, ?)",
      [student_id, block, room_no, checkout_date]
    );

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

// ===================== PAYMENT ROUTE ===================== //
app.post("/api/payment", async (req, res) => {
  const { name, student_id, amount, method, details } = req.body;

  if (!name || !student_id || !amount || !method || !details) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await db.query(
      "INSERT INTO payments (name, student_id, amount, method, details, date) VALUES (?, ?, ?, ?, ?, NOW())",
      [name, student_id, amount, method, details]
    );

    res.status(200).json({ message: "💰 Payment recorded successfully!" });
  } catch (err) {
    console.error("❌ Payment Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== ROOM MANAGEMENT ROUTES ===================== //
// GET semua bilik
app.get("/api/rooms", async (req, res) => {
  try {
    const [rooms] = await db.query("SELECT * FROM rooms");
    res.json(rooms);
  } catch (err) {
    console.error("❌ Fetch rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Tambah bilik baru
app.post("/api/rooms", async (req, res) => {
  const { gender, hostel, room_id, status } = req.body;
  if (!gender || !hostel || !room_id || !status)
    return res.status(400).json({ message: "Please fill in all fields." });

  try {
    await db.query(
      "INSERT INTO rooms (gender, hostel, room_id, status) VALUES (?, ?, ?, ?)",
      [gender, hostel, room_id, status]
    );
    res.status(200).json({ message: "Room added successfully!" });
  } catch (err) {
    console.error("❌ Add room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Tukar status bilik (Available ↔ Occupied)
app.patch("/api/rooms/:room_id", async (req, res) => {
  const { room_id } = req.params;
  const { status } = req.body;

  try {
    await db.query("UPDATE rooms SET status = ? WHERE room_id = ?", [
      status,
      room_id,
    ]);
    res.json({ message: "Room status updated successfully!" });
  } catch (err) {
    console.error("❌ Update room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== SERVER START ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ===================== STUDENT PROFILE ROUTES ===================== //

// Dapatkan profile pelajar ikut ID
app.get("/api/student-profile/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT id, username, email, gender, role FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Fetch student profile error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Update profile pelajar
app.put("/api/student-profile/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, gender, password } = req.body;

  try {
    // Check dulu kalau user wujud
    const [userCheck] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    let updateQuery = "UPDATE users SET username = ?, email = ?, gender = ?";
    const params = [username, email, gender];

    // Kalau user nak ubah password, hash dulu
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      params.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    params.push(id);

    await db.query(updateQuery, params);

    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ===================== ASSIGN ROOM ROUTE ===================== //
app.post("/api/assign-room", async (req, res) => {
  const { student_id, room_number } = req.body;

  if (!student_id || !room_number) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  try {
    // Semak kalau student wujud
    const [check] = await db.query("SELECT * FROM students WHERE id = ?", [student_id]);

    if (check.length === 0) {
      return res.status(404).json({ message: "Student ID not found!" });
    }

    // Update bilik
    await db.query("UPDATE students SET room_number = ? WHERE id = ?", [
      room_number,
      student_id,
    ]);

    res.json({ success: true, message: "Room assigned successfully!" });
  } catch (err) {
    console.error("❌ Assign room error:", err);
    res.status(500).json({ message: "Server error, please try again." });
  }
});

// ========================== CHANGE ROOM API (Student) ========================== //
app.post("/api/change-room", async (req, res) => {
  const { student_id, new_room_number } = req.body;

  try {
    // Semak pelajar wujud atau tidak
    const [rows] = await db.query("SELECT * FROM students WHERE id = ?", [student_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Student ID not found!" });
    }

    // Update nombor bilik
    await db.query("UPDATE students SET room_number = ? WHERE id = ?", [new_room_number, student_id]);
    res.json({ message: "Room changed successfully!" });

  } catch (err) {
    console.error("❌ Error updating room:", err);
    res.status(500).json({ message: "Error updating room" });
  }
});

// ===================== AUTO-INSERT USERS (HASH PASSWORD) ===================== //
(async () => {
  try {
    const users = [
      { user_ref_id: 'DLM0423-001', username: 'JovenMaestro.09', email: 'tadrean@gmail.com', password: 'TengkuAdreanRuiz02', role: 'student' },
      { user_ref_id: 'DLM0423-002', username: 'Eagle.08', email: 'thariq@gmail.com', password: 'ThariqRidzuwan', role: 'student' },
      { user_ref_id: 'DIT0423-001', username: 'Leon.0920', email: 'rahmahsukor5@gmail.com', password: 'TengkuAdreanRuiz02', role: 'student' },
      { user_ref_id: 'FIN001', username: 'Finance.01', email: 'finance01@gmail.com', password: 'FinancePass01', role: 'finance' },
      { user_ref_id: 'WARD001', username: 'Warden.01', email: 'warden01@gmail.com', password: 'WardenPass01', role: 'warden' },
      { user_ref_id: 'ADMIN001', username: 'Admin.01', email: 'admin01@gmail.com', password: 'AdminPass01', role: 'admin' },
      { user_ref_id: 'MAIN001', username: 'Maintenance.01', email: 'maint01@gmail.com', password: 'MaintPass01', role: 'maintenance' }
    ];

    for (const u of users) {
      const [check] = await db.query("SELECT * FROM users WHERE username = ?", [u.username]);
      if (check.length === 0) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await db.query(
          "INSERT INTO users (user_ref_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
          [u.user_ref_id, u.username, u.email, hashedPassword, u.role]
        );
        console.log(`✅ User ${u.username} added.`);
      } else {
        console.log(`ℹ️ User ${u.username} already exists.`);
      }
    }
  } catch (err) {
    console.error("❌ Error inserting users:", err);
  }
})();
