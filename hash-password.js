import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const db = await mysql.createConnection({
      host: crossover.proxy.rlwy.net,
      user: root,
      password: uWSKTbteHaXWZipnkABQiVSUvuhZVTda,
      database: railway,
      port: 59855,
    });

    const [users] = await db.query("SELECT id, password FROM users");

    for (let user of users) {
      // hash password lama
      const hashed = await bcrypt.hash(user.password, 10);
      await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
      console.log(`✅ Password for user ID ${user.id} hashed`);
    }

    console.log("🎉 All passwords hashed successfully!");
    await db.end();
  } catch (err) {
    console.error("❌ Error hashing passwords:", err);
  }
})();
