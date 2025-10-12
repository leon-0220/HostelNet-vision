import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Connect ke database Railway
const conn = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// ✅ Route untuk register user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const role = "student"; // boleh ubah ikut form

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    conn.query(sql, [username, hashedPassword, role], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.send("<script>alert('❌ Username sudah wujud'); window.location.href='register.html';</script>");
        } else {
          console.error(err);
          return res.send("<script>alert('⚠️ Ralat server!'); window.location.href='register.html';</script>");
        }
      }
      return res.send("<script>alert('✅ Pendaftaran berjaya!'); window.location.href='login.html';</script>");
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
