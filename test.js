import express from "express";
import db from "db.js"; // import connection dari db.js

const router = express.Router();

router.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    res.json({ success: true, time: rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;