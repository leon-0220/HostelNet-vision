import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // baca ENV variables dari Render

// Setup dirname (sebab pakai ES module)
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
    secret: "your_secret_key", // tukar ikut kehendak
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

  if (!id || !uname || !email || !password || !gender || !role)
    return res.status(400).json({ message: "Please fill in all fields." });

  try {
    const [check] = await db.query(
      "SELECT * FROM users WHERE id = ? OR email = ?",
      [id, email]
    );

    if (check.length > 0)
      return res.status(400).json({ message: "User already exists." });

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
