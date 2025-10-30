import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "centerbeam.proxy.rlwy.net",
  user: "root",
  password: "qxFWSgDsLImTcNYatgzJuVlcyXFAKezT",
  database: "railway",
  port: 37606,
});

export default db;