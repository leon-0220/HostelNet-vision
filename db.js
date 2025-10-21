import mysql from "mysql2/promise";

const db = mysql.createPool({
<<<<<<< HEAD
  host: crossover.proxy.rlwy.net,
  user: root,
  password: uWSKTbteHaXWZipnkABQiVSUvuhZVTda,
  database: railway,
  port: 59855,
});

export default db;
=======
  host: "gondola.proxy.rlwy.net",
  user: "root",
  password: "JwOzMilejTKDdMkSNJklrBplJbYzXQNo",
  database: "railway",
  port: 30273,
});

export default db;
>>>>>>> 1901beb2f163c484de401e79da921f161dd7742f
