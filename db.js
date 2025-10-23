import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "hostelnet-0220-hostelnet-db.g.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_exgb7fcLJ3IbAbkYyjk",
  database: "defaultdb",
  port: 13379,
});

export default db;