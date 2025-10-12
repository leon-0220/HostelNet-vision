import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config(); // baca ENV variables dari Render

// Setup __dirname (ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===================== MIDDLEWARE ===================== //
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

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

// LOGIN route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

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
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// TEST DB route (optional)
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ success: true, time: rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    // Generate simple reset token (untuk test)
    const resetToken = Math.random().toString(36).substr(2, 8);
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 jam expiry

    // Simpan token & expiry ke DB
    await db.query(
      "UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?",
      [resetToken, expiry, user.id]
    );

    // Hantar email dengan token (boleh guna nodemailer nanti)
    console.log(`🔐 Reset token for ${email}: ${resetToken}`); // Untuk testing

    res.json({ success: true, message: "Reset link sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ===================== SERVER START ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
