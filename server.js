import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(
  session({
    secret: "your_secret_key", // tukar ikut suka, jgn share public
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

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Cari user dalam database
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 1) {
      const user = rows[0];

      // Verify password hashed
      const validPassword = await bcrypt.compare(password, user.password);

      if (validPassword) {
        // Simpan dalam session
        req.session.username = user.username;
        req.session.role = user.role;

        // Redirect ikut role
        if (user.role === "student") return res.redirect("/pages/student/dashboard.html");
        if (user.role === "warden") return res.redirect("/pages/warden/dashboard.html");
        if (user.role === "admin") return res.redirect("/pages/admin/dashboard.html");
        if (user.role === "finance") return res.redirect("/pages/finance/dashboard.html");
        if (user.role === "maintenance") return res.redirect("/pages/maintenance/dashboard.html");
      } else {
        return res.send("<script>alert('Wrong password!'); window.location.href = '/login.html';</script>");
      }
    } else {
      return res.send("<script>alert('User not found. Please register first.'); window.location.href = '/register.html';</script>");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
