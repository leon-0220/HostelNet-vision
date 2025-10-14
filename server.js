import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ===================== SETUP ===================== //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// ===================== DATABASE CONNECTION ===================== //
let db;
const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: "crossover.proxy.rlwy.net",
      user: "root",
      password: "uWSKTbteHaXWZipnkABQiVSUvuhZVTda",
      database: "railway",
      port: 59855,
    });
    console.log("✅ Connected to Railway MySQL database!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
};
await connectDB();

// ===================== TEST DB ===================== //
app.get("/api/test-db", async (req, res) => {
  try {
    if (!db) throw new Error("Database not connected");
    const [rows] = await db.query("SELECT CURRENT_TIME() AS time");
    res.json({ message: "✅ Database connected", time: rows[0].time });
  } catch (err) {
    console.error("❌ Test DB Error:", err);
    res.status(500).json({ message: "❌ Database not connected", error: err.message });
  }
});

// ===================== REGISTER ===================== //
app.post("/register", async (req, res) => {
  const { id, uname, email, password, gender, role } = req.body;

  if (!id || !uname || !email || !password || !gender || !role)
    return res.status(400).json({ message: "Please fill in all fields." });

  try {
    if (!db) return res.status(500).json({ message: "Database not connected." });

    const validID = /^[A-Za-z]{2,5}\d{2,4}-?\d{3}$/;
    if (!validID.test(id))
      return res.status(400).json({ message: "❌ Invalid ID format." });

    const [check] = await db.query(
      "SELECT * FROM users WHERE user_ref_id = ? OR email = ? OR username = ?",
      [id, email, uname]
    );

    if (check.length > 0) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (user_ref_id, username, email, password, gender, role) VALUES (?, ?, ?, ?, ?, ?)",
      [id, uname, email, hashedPassword, gender, role]
    );

    res.status(200).json({ message: "✅ Registration successful." });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ===================== LOGIN ===================== //
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!db) return res.status(500).json({ success: false, message: "Database not connected." });

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? OR user_ref_id = ? OR email = ?",
      [username, username, username]
    );

    if (rows.length === 1) {
      const user = rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ success: false, message: "❌ Wrong password!" });

      req.session.username = user.username;
      req.session.role = user.role;
      req.session.email = user.email;
      req.session.user_ref_id = user.user_ref_id;

      return res.status(200).json({ success: true, role: user.role, message: "✅ Login successful" });
    } else {
      return res.status(404).json({ success: false, message: "⚠️ User not found." });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ===================== AUTO INSERT USERS ===================== //
const autoInsertUsers = async () => {
  try {
    const users = [
      { user_ref_id: 'DLM0423-001', username: 'JovenMaestro.09', email: 'tadrean@gmail.com', password: 'TengkuAdreanRuiz02', gender: 'M', role: 'student' },
      { user_ref_id: 'DIT0423-001', username: 'Leon.0920', email: 'rahmahsukor5@gmail.com', password: 'TengkuAdreanRuiz02', gender: 'M', role: 'student' },
      { user_ref_id: 'FIN001', username: 'Finance.01', email: 'finance01@gmail.com', password: 'FinancePass01', gender: 'F', role: 'finance' },
      { user_ref_id: 'WARD001', username: 'Warden.01', email: 'warden01@gmail.com', password: 'WardenPass01', gender: 'F', role: 'warden' },
      { user_ref_id: 'ADMIN001', username: 'Admin.01', email: 'admin01@gmail.com', password: 'AdminPass01', gender: 'M', role: 'admin' },
      { user_ref_id: 'MAIN001', username: 'Maintenance.01', email: 'maint01@gmail.com', password: 'MaintPass01', gender: 'M', role: 'maintenance' }
    ];

    for (const u of users) {
      const [check] = await db.query("SELECT * FROM users WHERE username = ?", [u.username]);
      if (check.length === 0) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await db.query(
          "INSERT INTO users (user_ref_id, username, email, password, gender, role) VALUES (?, ?, ?, ?, ?, ?)",
          [u.user_ref_id, u.username, u.email, hashedPassword, u.gender, u.role]
        );
        console.log(`✅ User ${u.username} added.`);
      } else console.log(`ℹ️ ${u.username} already exists.`);
    }
  } catch (err) {
    console.error("❌ Error inserting users:", err);
  }
};
setTimeout(autoInsertUsers, 2000);

// ===================== LOGOUT ===================== //
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Server error during logout" });
    res.clearCookie("connect.sid");
    res.redirect("/index.html");
  });
});

// ===================== REPORT ROUTES ===================== //
app.post("/report", async (req, res) => {
  const { fname, lname, hostel_unit, message } = req.body;
  if (!fname || !lname || !hostel_unit || !message)
    return res.status(400).json({ message: "All fields required" });

  try {
    await db.query("INSERT INTO reports (fname, lname, hostel_unit, message) VALUES (?, ?, ?, ?)", [fname, lname, hostel_unit, message]);
    res.json({ success: true, message: "Report submitted successfully" });
  } catch (err) {
    console.error("❌ Report Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/reports", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM reports ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/reports/:id/resolve", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE reports SET status = 'resolved' WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

// ===================== USER PROFILE ===================== //
app.get("/user/profile", (req, res) => {
  if (!req.session.username) return res.status(401).json({ message: "Not logged in" });
  res.json({
    username: req.session.username,
    role: req.session.role,
    email: req.session.email,
    user_ref_id: req.session.user_ref_id
  });
});

// ===================== ANNOUNCEMENTS ===================== //
app.get("/announcements", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM announcements ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Announcements GET Error:", err);
    res.status(500).json({ message: "Server error fetching announcements" });
  }
});

app.post("/announcements", async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message are required" });

  try {
    await db.query("INSERT INTO announcements (title, message) VALUES (?, ?)", [title, message]);
    res.status(201).json({ message: "Announcement added successfully!" });
  } catch (err) {
    console.error("❌ Announcements POST Error:", err);
    res.status(500).json({ message: "Server error adding announcement" });
  }
});

app.put("/announcements/:id", async (req, res) => {
  const { id } = req.params;
  const { title, message } = req.body;

  try {
    await db.query("UPDATE announcements SET title = ?, message = ? WHERE id = ?", [title, message, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Announcements PUT Error:", err);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

app.delete("/announcements/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM announcements WHERE id = ?", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Announcements DELETE Error:", err);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

// ===================== SERVER START ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
