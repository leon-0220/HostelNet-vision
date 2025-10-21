import express from "express";
import mysql from "mysql2";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Connect ke database (Railway / Render)
const conn = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// ✅ POST — Checkout pelajar
app.post("/checkout", (req, res) => {
  const { student_id, room_no, checkout_date } = req.body;

  if (!student_id || !room_no || !checkout_date) {
    return res.status(400).send("⚠️ Semua field wajib diisi.");
  }

  const sql = `
    INSERT INTO checkout (student_id, room_no, checkout_date)
    VALUES (?, ?, ?)
  `;

  conn.query(sql, [student_id, room_no, checkout_date], (err, result) => {
    if (err) {
      console.error("❌ Error semasa checkout:", err);
      return res.status(500).send("Error semasa checkout.");
    }

    // ✅ Update semula bilik jadi "Available"
    const updateRoom = "UPDATE rooms SET status='Available' WHERE id=?";
    conn.query(updateRoom, [room_no], (updateErr) => {
      if (updateErr) {
        console.error("⚠️ Error update status bilik:", updateErr);
        return res.status(500).send("Checkout berjaya tapi status bilik tak dikemas kini.");
      }

      res.send("✅ Checkout berjaya dan bilik telah dikemas kini!");
    });
  });
});

// ✅ Jalankan server (kalau fail ni standalone)
app.listen(3001, () => {
  console.log("Checkout service running on port 3001");
});