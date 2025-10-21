import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Connection ke Railway MySQL
const conn = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// ✅ Route GET: buka page reset password
app.get("/reset-password", (req, res) => {
  const token = req.query.token;
  if (!token) return res.send("Invalid request.");

  const formHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Reset Password</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card p-4 shadow" style="width: 350px;">
      <h4 class="mb-3 text-center">Reset Password</h4>
      <form method="POST" action="/reset-password">
        <input type="hidden" name="token" value="${token}">
        <div class="mb-3">
          <input type="password" name="password" class="form-control" placeholder="New Password" required>
        </div>
        <button type="submit" class="btn btn-success w-100">Update Password</button>
      </form>
    </div>
  </body>
  </html>`;
  
  res.send(formHTML);
});

// ✅ Route POST: update password dalam database
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) return res.send("Invalid request.");

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check token valid
  const checkTokenSQL = "SELECT id FROM users WHERE reset_token = ? AND reset_expiry > NOW()";
  conn.query(checkTokenSQL, [token], (err, results) => {
    if (err) return res.send("Server error.");
    if (results.length === 0) return res.send("Invalid or expired token.");

    // Update password
    const updateSQL = "UPDATE users SET password=?, reset_token=NULL, reset_expiry=NULL WHERE reset_token=?";
    conn.query(updateSQL, [hashedPassword, token], (err2) => {
      if (err2) return res.send("Error updating password.");
      res.send("✅ Password successfully reset!");
    });
  });
});

// ✅ Start server
<<<<<<< HEAD
app.listen(3000, () => console.log("Server running on port 3000"));
=======
app.listen(3000, () => console.log("Server running on port 3000"));
>>>>>>> 1901beb2f163c484de401e79da921f161dd7742f
