import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Connect ke Railway Database
const conn = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// ✅ POST — Check-in pelajar
app.post("/checkin", (req, res) => {
  const { studentId, studentName, course, block, roomNo, checkinDate } = req.body;

  if (!studentId || !studentName || !course || !block || !roomNo || !checkinDate) {
    return res.status(400).send("⚠️ All fields are required.");
  }

  const sql = `
    INSERT INTO checkin (student_id, student_name, course, block, room_no, checkin_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  conn.query(sql, [studentId, studentName, course, block, roomNo, checkinDate], (err, result) => {
    if (err) {
      console.error("❌ Error inserting checkin:", err);
      return res.status(500).send("Error during check-in.");
    }

    // ✅ Update status bilik kepada Occupied
    const updateSQL = "UPDATE rooms SET status='Occupied' WHERE id=?";
    conn.query(updateSQL, [roomNo], (updateErr) => {
      if (updateErr) {
        console.error("⚠️ Error updating room status:", updateErr);
        return res.status(500).send("Check-in saved, but room status not updated.");
      }

      res.send("✅ Check-in successful!");
    });
  });
});

// ✅ Jalankan server (kalau fail ni standalone)
app.listen(3000, () => {
  console.log("Check-in service running on port 3000");
});