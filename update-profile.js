import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Sambung ke database Railway
const conn = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// ✅ Route untuk update profile (universal)
app.post("/update-profile", (req, res) => {
  const { id, role, name, email, phone } = req.body;

  // 🔹 Tentukan jadual ikut role user
  let tableName = "";
  switch (role) {
    case "student":
      tableName = "students";
      break;
    case "warden":
      tableName = "wardens";
      break;
    case "finance":
      tableName = "finance";
      break;
    case "maintenance":
      tableName = "maintenance";
      break;
    case "admin":
      tableName = "admins";
      break;
    default:
      return res.status(400).send("❌ Invalid user role.");
  }

  // 🔹 SQL untuk update data user berdasarkan role & ID
  const sql = `UPDATE ${tableName} SET name=?, email=?, phone=? WHERE id=?`;

  conn.query(sql, [name, email, phone, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error updating profile.");
    }
    res.send("✅ Profile updated successfully!");
  });
});

// ✅ Jalankan server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
