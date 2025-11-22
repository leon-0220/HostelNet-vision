import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || "shinkansen.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "24552",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 24552,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const db = mysql.createPool(DB_CONFIG);
  
export async function initDB() {
  await db.query(`CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    gender ENUM('Male','Female') NOT NULL,
    course VARCHAR(100),
    room VARCHAR(50),
    phone VARCHAR(20),
    status ENUM('pending','checked-in','checked-out') DEFAULT 'pending'
  );`);

  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin') DEFAULT 'student',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL    
  );`);

  await db.query(`CREATE TABLE IF NOT EXISTS hostel_units (
    unit_code VARCHAR(20) PRIMARY KEY,
    gender ENUM('Male','Female') NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    description TEXT
  );`);

  await db.query(`CREATE TABLE IF NOT EXISTS rooms (
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    available INT NOT NULL DEFAULT 4,
    status ENUM('active','inactive','maintenance') DEFAULT 'active',
    PRIMARY KEY (unit_code, room_number),
    FOREIGN KEY (unit_code) REFERENCES hostel_units(unit_code) ON DELETE CASCADE
  );`);

  await db.query(`CREATE TABLE IF NOT EXISTS checkin_checkout (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    unit_code VARCHAR(20) NOT NULL,      
    room_number VARCHAR(20) NOT NULL,
    checkin_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkout_date TIMESTAMP NULL
  );`);

  await db.query(`CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    complaint_text TEXT NOT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending'
  );`);

  console.log("✅ Database tables verified/created successfully.");

  // ====== INSERT HOSTEL UNITS IF NOT EXIST ====== //
  const hostelUnits = [
    ["KELANA-M", "Male", "Kelana Parkview"],
    ["SS4D-M", "Male", "SS4D/8"],
    ["SS4C-M", "Male", "SS4C/15"],
    ["SS5D-M", "Male", "SS5D/6A"],
    ["SS4B-M", "Male", "SS4B/13"],
    ["SS5C-M", "Male", "SS5C/11"],
    ["SPACEPOD-M", "Male", "Spacepod"],
    ["KELANA-F", "Female", "Kelana Parkview"],
    ["SS5D-F", "Female", "SS5D/8"],      
    ["AYAMAS-F", "Female", "Ayamas"],
    ["FOCUS-F", "Female", "Focus Point"],
    ["711-F", "Female", "7-11"],
    ["SS6-F", "Female", "SS6/8"],
    ["SPACEPOD-F", "Female", "Spacepod 20"],
  ];

  for (const [code, gender, name] of hostelUnits) {
    await db.query(
      'INSERT IGNORE INTO hostel_units (unit_code, gender, unit_name) VALUES (?, ?, ?)',
      [code, gender, name]
    );
  }

  console.log("🏠 Hostel units inserted (if missing)");

  // ====== DEFAULT ADMIN ====== //
  const [adminCheck] = await db.query("SELECT * FROM users WHERE username = 'admin01'");
  if (adminCheck.length === 0) {
    const hashed = await bcrypt.hash("AdminPass01", 10);
      await db.query(
        "INSERT INTO users (username, email, password, role, must_change_password) VALUES (?, ?, ?, ?, ?)",
        ["admin01", "admin01@gmail.com", hashed, "admin", false]
      );
      console.log("🛡 Default admin created: admin01 / AdminPass01");
    }
  }

export default db;