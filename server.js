import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== MySQL Connection ===== //
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hostelnet",
});

// ===== Create Table (auto create if not exist) ===== //
await db.query(`
  CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    room VARCHAR(50),
    status ENUM('pending','checked-in','checked-out') DEFAULT 'pending'
  )
`);

// ===== API Routes ===== //
app.get("/api/students", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM students ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/students", async (req, res) => {
  const { name, room, status } = req.body;
  try {
    await db.query(
      "INSERT INTO students (name, room, status) VALUES (?, ?, ?)",
      [name, room, status || "pending"]
    );
    res.json({ message: "Student added successfully" });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ error: "Failed to add student" });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM students WHERE id = ?", [id]);
  res.json({ message: "Deleted" });
});

// ===== Frontend ===== //
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
