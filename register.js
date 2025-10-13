import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); 

const conn = mysql.createConnection({
  host: "crossover.proxy.rlwy.net",
  user: "root",
  password: "uWSKTbteHaXWZipnkABQiVSUvuhZVTda",
  database: "railway",
  port: 59855,
});

// ✅ Semak connection
conn.connect((err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err);
  } else {
    console.log("✅ Database connected (Railway)");
  }
});

function isValidUserId(id) {
  // Example: DIT0423-001 / FIN0423-002 / ADM0423-003
  const regex = /^[A-Z]{3}\d{4}-\d{3}$/i;
  return regex.test(id);
}

app.post("/register", async (req, res) => {
  const { id, username, password, role } = req.body;

  if (!id || !username || !password || !role) {
    return res.send("<script>alert('⚠️ Please fill in all the information!'); window.location.href='register.html';</script>");
  }

  if (!isValidUserId(id)) {
    return res.send("<script>alert('❌ Format ID tidak sah! Contoh: DIT0423-001 / FIN0423-002'); window.location.href='register.html';</script>");
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkSQL = "SELECT * FROM users WHERE id = ? OR username = ?";
    conn.query(checkSQL, [id, username], (err, result) => {
      if (err) {
        console.error(err);
        return res.send("<script>alert('⚠️ Error while checking user!'); window.location.href='register.html';</script>");
      }

      if (result.length > 0) {
        return res.send("<script>alert('❌ The ID or username has been registered!'); window.location.href='register.html';</script>");
      }

      const sql = "INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)";
      conn.query(sql, [id, username, hashedPassword, role], (err2) => {
        if (err2) {
          console.error(err2);
          return res.send("<script>alert('⚠️ Error while registering user!'); window.location.href='register.html';</script>");
        }
        return res.send("<script>alert('✅ Registration successful!'); window.location.href='login.html';</script>");
      });
    });
  } catch (error) {
    console.error("❌ Hash error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ Jalankan server
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
