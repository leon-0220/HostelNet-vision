import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: crossover.proxy.rlwy.net,
  user: root,
  password: uWSKTbteHaXWZipnkABQiVSUvuhZVTda,
  database: railway,
  port: 59855,
});

export default db;
