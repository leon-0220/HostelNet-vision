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

// ✅ Test connection
conn.connect((err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err);
  } else {
    console.log("✅ Database connected (Railway)");
  }
});

function isValidStudentId(id) {
  // Contoh format DIT0423-001
  const regex = /^[A-Z]{3}\d{4}-\d{3}$/i;
  return regex.test(id);
}

app.post("/register", async (req, res) => {
  try {
    const {
      full_name,
      course,
      student_id,
      room_number,
      hostel_unit,
      gender,
      role,
      phone_number,
      staff_id,
      username,
      password,
    } = req.body;

    // Pastikan role ada & lowercase
    const userRole = role?.toLowerCase();

    // 🔍 Validation ikut role
    if (userRole === "student") {
      if (!full_name || !course || !student_id || !room_number || !hostel_unit || !gender || !username || !password || !phone_number) {
        return res.send("<script>alert('⚠ Please fill in all student fields!'); window.location.href='register.html';</script>");
      }

      if (!isValidStudentId(student_id)) {
        return res.send("<script>alert('❌ Invalid Student ID format! Example: DIT0423-001'); window.location.href='register.html';</script>");
      }
    } else if (userRole === "admin") {
      if (!full_name || !staff_id || !gender || !username || !password || !phone_number) {
        return res.send("<script>alert('⚠ Please fill in all admin fields!'); window.location.href='register.html';</script>");
      }
    } else {
      return res.send("<script>alert('❌ Invalid role selected!'); window.location.href='register.html';</script>");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Semak duplicate user
    const checkSQL = "SELECT * FROM users WHERE username = ?";
    conn.query(checkSQL, [username], (err, result) => {
      if (err) {
        console.error(err);
        return res.send("<script>alert('⚠ Error while checking user!'); window.location.href='register.html';</script>");
      }

      if (result.length > 0) {
        return res.send("<script>alert('❌ Username already registered!'); window.location.href='register.html';</script>");
      }

      let sql, values;

      if (userRole === "student") {
        sql = `
          INSERT INTO users 
          (full_name, course, student_id, room_number, hostel_unit, gender, role, phone_number, username, password) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        values = [full_name, course, student_id, room_number, hostel_unit, gender, userRole, phone_number, username, hashedPassword];
      } else {
        sql = `
          INSERT INTO users 
          (full_name, staff_id, gender, role, phone_number, username, password) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        values = [full_name, staff_id, gender, userRole, phone_number, username, hashedPassword];
      }

      conn.query(sql, values, (err2) => {
        if (err2) {
          console.error(err2);
          return res.send("<script>alert('⚠ Error while registering user!'); window.location.href='register.html';</script>");
        }
        return res.send("<script>alert('✅ Registration successful!'); window.location.href='login.html';</script>");
      });
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});