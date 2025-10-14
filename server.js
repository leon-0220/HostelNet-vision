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

// ✅ CORS config supaya browser boleh hantar cookie session
app.use(cors({
  origin: "http://localhost:3000", // ganti ikut frontend URL awak
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false, // set true kalau HTTPS
      maxAge: 1000 * 60 * 60 * 24 // 1 hari
    }
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
  const { id, uname, email, password, gender, role, phone } = req.body;

  if (!id || !uname || !email || !password || !gender || !role)
    return res.status(400).json({ message: "Please fill in all fields." });

  try {
    if (!db) return res.status(500).json({ message: "Database not connected." });

    const validID = /^[A-Za-z]{2,5}\d{2,4}-?\d{3}$/;
    if (!validID.test(id)) return res.status(400).json({ message: "❌ Invalid ID format." });

    const [check] = await db.query(
      "SELECT * FROM users WHERE user_ref_id = ? OR email = ? OR username = ?",
      [id, email, uname]
    );

    if (check.length > 0) return res.status(400).json({ message: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (user_ref_id, username, email, password, gender, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, uname, email, hashedPassword, gender, role, phone || ""]
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

      // 🔹 SET SESSION
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.email = user.email;
      req.session.user_ref_id = user.user_ref_id;
      req.session.phone = user.phone || "";

      return res.status(200).json({ success: true, role: user.role, message: "✅ Login successful" });
    } else {
      return res.status(404).json({ success: false, message: "⚠️ User not found." });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ===================== LOGOUT ===================== //
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Server error during logout" });
    res.clearCookie("connect.sid");
    res.redirect("/index.html");
  });
});

// ===================== USER PROFILE ===================== //
app.get("/user/profile", (req, res) => {
  if (!req.session.username) return res.status(401).json({ message: "Not logged in" });
  res.json({
    username: req.session.username,
    role: req.session.role,
    email: req.session.email,
    user_ref_id: req.session.user_ref_id,
    phone: req.session.phone || ""
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
