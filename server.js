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
    res.json({ message: "✅ Database connected", time: rows[0].current_time });
  } catch (err) {
    console.error("❌ Test DB Error:", err);
    res.status(500).json({ message: "❌ Database not connected", error: err.message });
  }
});

// ===================== REGISTER ===================== //
app.post("/register", async (req, res) => {
  const { id, uname, email, password, gender, role } = req.body;

  console.log("📥 Incoming register data:", req.body);

  if (!id || !uname || !email || !password || !gender || !role) {
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  try {
    if (!db) {
      return res.status(500).json({ message: "Database not connected." });
    }

    // ✅ Semak ID format (contoh: DIT0423-001, ADMIN001, WARD001)
    const validID = /^[A-Za-z]{2,5}\d{2,4}-?\d{3}$/;
    if (!validID.test(id)) {
      return res.status(400).json({
        message:
          "❌ Invalid ID format. Contoh format yang sah: DIT0423-001 atau ADMIN001",
      });
    }

    // ✅ Semak kalau user dah wujud
    const [check] = await db.query(
      "SELECT * FROM users WHERE user_ref_id = ? OR email = ? OR username = ?",
      [id, email, uname]
    );

    if (check.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Masukkan user baru
    const [result] = await db.query(
      "INSERT INTO users (user_ref_id, username, email, password, gender, role) VALUES (?, ?, ?, ?, ?, ?)",
      [id, uname, email, hashedPassword, gender, role]
    );

    console.log("✅ User registered:", result);
    res.status(200).json({ 
      message: "✅ Registration successful.",
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ 
      message: "Server error.", 
      error: err.message,
    });
  }
});

// ===================== LOGIN ===================== //
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: "Database not connected."
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? OR user_ref_id = ? OR email = ?",
      [username, username, username]
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
          message: "✅ Login successful",
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "❌ Wrong password!",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "⚠️ User not found. Please register first.",
      });
    }
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

// ===================== AUTO INSERT USERS ===================== //
const autoInsertUsers = async () => {
  try {
    const users = [
      { user_ref_id: 'DLM0423-001', username: 'JovenMaestro.09', email: 'tadrean@gmail.com', password: 'TengkuAdreanRuiz02', role: 'student' },
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
        console.log(`ℹ️ ${u.username} already exists.`);
      }
    }
  } catch (err) {
    console.error("❌ Error inserting users:", err);
  }
};

// delay sikit lepas connect db
setTimeout(autoInsertUsers, 2000);

// ===================== SERVER START ===================== //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ===================== LOGOUT ===================== //
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.status(500).json({ message: "Server error during logout" });
    }
    res.clearCookie("connect.sid"); // padam cookie session
    res.redirect("/index.html"); // redirect ke login page
  });
});
