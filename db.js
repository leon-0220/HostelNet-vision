import mysql from "mysql2/promise";

// Gunakan environment variables
const connection = mysql.createPool({
  host: process.env.DB_HOST,    // dari Railway
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,                   // default MySQL port
});

export default connection;
