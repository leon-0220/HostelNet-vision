import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    const db = await mysql.createConnection({
      host: "crossover.proxy.rlwy.net",
      user: "root",
      password: "uWSKTbteHaXWZipnkABQiVSUvuhZVTda",
      database: "railway db2",
      port: 59855,
    });

    console.log("✅ Connected to database!");

    // Dapatkan semua user
    const [users] = await db.query("SELECT id, password FROM users");

    for (let user of users) {
      const currentPass = user.password || "";

      // Kalau password dah hashed (bermula dengan $2b$ atau $2a$), skip
      if (currentPass.startsWith("$2b$") || currentPass.startsWith("$2a$")) {
        console.log(`⏭️ Skipping user ID ${user.id} (already hashed)`);
        continue;
      }

      // Hash password lama
      const hashed = await bcrypt.hash(currentPass, 10);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [
        hashed,
        user.id,
      ]);
      console.log(`✅ Password for user ID ${user.id} hashed`);
    }

    console.log("🎉 All plain text passwords hashed successfully!");
    await db.end();
  } catch (err) {
    console.error("❌ Error hashing passwords:", err);
  }
})();
