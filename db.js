import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "shinkansen.proxy.rlwy.net",
  user: "root",
  password: "24552",
  database: "railway",
  port: 24552,
});

export default db;