import mysql from "mysql2/promise";
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

export default db;