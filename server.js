import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

// Setup dirname (sebab pakai ES module)
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
    secret: "your_secret_key", // boleh tukar
    resave: false,
    saveUninitialized: true,
  })
);

// Database connection (guna ENV variable dari Render/Railway)
const db = await mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
});

// Default route → buka login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// LOGIN ROUTE
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

        // Redirect ikut role user
        if (user.role === "student") return res.redirect("pages/student/dashboard.html");
        if (user.role === "warden") return res.redirect("pages/warden/dashboard.html");
        if (user.role === "admin") return res.redirect("pages/admin/dashboard2.html");
        if (user.role === "finance") return res.redirect("pages/finance/dashboard.html");
        if (user.role === "maintenance") return res.redirect("pages/maintenance/dashboard.html");

        // fallback kalau role tak dikenali
        return res.send("<script>alert('Role tidak dikenali!'); window.location.href = 'index.html';</script>");
      } else {
        return res.send("<script>alert('Wrong password!'); window.location.href = 'index.html';</script>");
      }
    } else {
      return res.send("<script>alert('User not found. Please register first.'); window.location.href = 'register.html';</script>");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
