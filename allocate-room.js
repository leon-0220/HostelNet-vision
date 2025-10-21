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

// ✅ Dapatkan semua bilik yang available
app.get("/rooms", (req, res) => {
  const sql = "SELECT * FROM rooms WHERE status='Available'";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error fetching rooms.");
    }
    res.json(results);
  });
});

// ✅ Dapatkan semua student
app.get("/students", (req, res) => {
  const sql = "SELECT * FROM students";
  conn.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error fetching students.");
    }
    res.json(results);
  });
});

// ✅ Allocate room (POST)
app.post("/allocate-room", (req, res) => {
  const { student_id, room_id } = req.body;

  if (!student_id || !room_id) {
    return res.status(400).send("⚠️ Missing student_id or room_id.");
  }

  // Masukkan ke table allocations
  const insertSQL = "INSERT INTO allocations (student_id, room_id) VALUES (?, ?)";
  conn.query(insertSQL, [student_id, room_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("❌ Error allocating room.");
    }

    // Update status bilik kepada "Occupied"
    const updateSQL = "UPDATE rooms SET status='Occupied' WHERE room_id=?";
    conn.query(updateSQL, [room_id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send("⚠️ Allocation inserted, but room status update failed.");
      }
      res.send("✅ Room allocated successfully!");
    });
  });
});

// ✅ Jalankan server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});