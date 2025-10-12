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

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve semua static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Session setup
app.use(
  session({
    secret: "your_secret_key", // tukar ikut kehendak
    resave: false,
    saveUninitialized: true,
  })
);

// Database connection (guna ENV variable dari Render/Railway)
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

// Route default — buka login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// LOGIN ROUTE (frontend fetch)
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

// Optional: TEST DB route
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ success: true, time: rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
