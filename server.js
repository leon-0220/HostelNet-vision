const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const DB_FILE = path.join(__dirname, "hostel.db");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- initialize sqlite DB (create tables + seed minimal data) ----
const dbExists = fs.existsSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) return console.error("DB open error:", err);
  console.log("Connected to sqlite DB:", DB_FILE);
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    student_no TEXT UNIQUE,
    email TEXT,
    registration_status TEXT DEFAULT 'pending'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_no TEXT UNIQUE,
    type TEXT,
    capacity INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    room_id INTEGER,
    semester TEXT,
    allocated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER,
    checkin_at TEXT,
    checkout_at TEXT,
    FOREIGN KEY(allocation_id) REFERENCES allocations(id)
  )`);

  if (!dbExists) {
    const seedRooms = [
      ["A101","single",1],
      ["A102","double",2],
      ["B201","single",1],
      ["B202","double",2]
    ];
    const stmtR = db.prepare("INSERT OR IGNORE INTO rooms (room_no,type,capacity) VALUES (?,?,?)");
    seedRooms.forEach(r => stmtR.run(r));
    stmtR.finalize();

    const seedStud = [
      ["Aisyah","S2021001","aisyah@example.com"],
      ["Badrul","S2021002","badrul@example.com"],
      ["Citra","S2021003","citra@example.com"]
    ];
    const stmtS = db.prepare("INSERT OR IGNORE INTO students (name,student_no,email,registration_status) VALUES (?,?,?,?)");
    seedStud.forEach(s => stmtS.run(s[0], s[1], s[2], "approved"));
    stmtS.finalize();
  }
});

// ---- API endpoints ----
app.get("/api/summary", (req, res) => {
  const summary = {};
  db.serialize(() => {
    db.get(`SELECT COUNT(*) AS cnt FROM students`, (err,row) => {
      summary.totalStudents = row ? row.cnt : 0;
      db.get(`SELECT COUNT(*) AS cnt FROM allocations`, (err2,row2) => {
        summary.roomsAllocated = row2 ? row2.cnt : 0;
        db.get(`SELECT COUNT(*) AS cnt FROM rooms`, (err3,row3) => {
          summary.totalRooms = row3 ? row3.cnt : 0;
          db.get(`SELECT COUNT(*) AS cnt FROM allocations AS a
                   LEFT JOIN checkins AS c ON a.id = c.allocation_id
                   WHERE c.checkin_at IS NOT NULL AND (c.checkout_at IS NULL)`, (err4,row4) => {
            summary.checkedInNow = row4 ? row4.cnt : 0;
            db.get(`SELECT COUNT(*) AS cnt FROM checkins WHERE checkout_at IS NOT NULL`, (err5,row5) => {
              summary.checkedOut = row5 ? row5.cnt : 0;
              res.json(summary);
            });
          });
        });
      });
    });
  });
});

app.get("/api/students", (req, res) => {
  const sql = `
    SELECT s.*,
           a.id AS allocation_id, r.room_no, r.type AS room_type, a.semester
    FROM students s
    LEFT JOIN allocations a ON a.student_id = s.id
    LEFT JOIN rooms r ON r.id = a.room_id
    ORDER BY s.id DESC
  `;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/rooms/available", (req,res) => {
  const sql = `
    SELECT r.* FROM rooms r
    WHERE r.id NOT IN (SELECT room_id FROM allocations)
  `;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/allocate", (req,res) => {
  const { student_id, room_id, semester } = req.body;
  if (!student_id || !room_id || !semester) return res.status(400).json({ error: "Missing fields" });

  db.get(`SELECT * FROM allocations WHERE room_id = ?`, [room_id], (err,row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: "Room already allocated" });

    const stmt = db.prepare("INSERT INTO allocations (student_id, room_id, semester) VALUES (?,?,?)");
    stmt.run(student_id, room_id, semester, function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      db.run("UPDATE students SET registration_status = 'approved' WHERE id = ?", [student_id]);
      res.json({ success: true, allocation_id: this.lastID });
    });
  });
});

app.post("/api/checkin", (req,res) => {
  const { allocation_id } = req.body;
  if (!allocation_id) return res.status(400).json({ error: "Missing allocation_id" });

  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO checkins (allocation_id, checkin_at) VALUES (?,?)");
  stmt.run(allocation_id, now, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, checkin_id: this.lastID, checkin_at: now });
  });
});

app.post("/api/checkout", (req,res) => {
  const { checkin_id } = req.body;
  if (!checkin_id) return res.status(400).json({ error: "Missing checkin_id" });
  const now = new Date().toISOString();
  db.run("UPDATE checkins SET checkout_at = ? WHERE id = ?", [now, checkin_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Checkin record not found" });
    res.json({ success: true, checkout_at: now });
  });
});

app.post("/api/students/approve", (req,res) => {
  const { student_id } = req.body;
  if (!student_id) return res.status(400).json({ error: "Missing student_id" });
  db.run("UPDATE students SET registration_status = 'approved' WHERE id = ?", [student_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/api/students/register", (req,res) => {
  const { name, student_no, email } = req.body;
  if (!name || !student_no) return res.status(400).json({ error: "Missing name or student_no" });
  const stmt = db.prepare("INSERT INTO students (name,student_no,email,registration_status) VALUES (?,?,?,?)");
  stmt.run(name, student_no, email || "", "pending", function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, student_id: this.lastID });
  });
});

app.get("*", (req,res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Example route for dashboard data
app.get("/api/admin/dashboard", async (req, res) => {
  try {
    const [students] = await db.query("SELECT COUNT(*) AS total FROM students");
    const [rooms] = await db.query("SELECT COUNT(*) AS allocated FROM rooms WHERE allocated=1");
    const [checkedIn] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status='checked-in'");
    const [checkedOut] = await db.query("SELECT COUNT(*) AS total FROM students WHERE status='checked-out'");
    const [recent] = await db.query("SELECT id, name, room, status FROM students ORDER BY id DESC LIMIT 5");

    res.json({
      totalStudents: students[0].total,
      roomsAllocated: rooms[0].allocated,
      checkedIn: checkedIn[0].total,
      checkedOut: checkedOut[0].total,
      recent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
