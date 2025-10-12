import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,    // contoh: db-mysql-12345.railway.app
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

export default db;
