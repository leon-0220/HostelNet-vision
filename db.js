import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "gondola.proxy.rlwy.net",
  user: "root",
  password: "JwOzMilejTKDdMkSNJklrBplJbYzXQNo",
  database: "railway",
  port: 30273,
});

export default db;
