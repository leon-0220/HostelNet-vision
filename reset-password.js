import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

// ===============================
// 1️⃣ REQUEST RESET PASSWORD (via email)
// ===============================
app.post("/request-reset", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send("❌ Email is required.");

  // Check user exists
  const sql = "SELECT * FROM users WHERE email = ?";
  conn.query(sql, [email], (err, results) => {
    if (err) return res.status(500).send("Server error.");
    if (results.length === 0) return res.status(404).send("❌ Email not found.");

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // valid 15 min

    // Save token
    const updateSQL = "UPDATE users SET reset_token=?, reset_expiry=? WHERE email=?";
    conn.query(updateSQL, [token, expiry, email], (err2) => {
      if (err2) return res.status(500).send("Error saving token.");

      // Send email
      const transporter = nodemailer.createTransport({
        service: "gmail", // boleh tukar ke outlook, yahoo dll
        auth: {
          user: process.env.EMAIL_USER, // email kau
          pass: process.env.EMAIL_PASS  // password / app password
        }
      });

      const resetLink = `https://hostelnet-vision-3.onrender.com/reset-password?token=${token}`;
      const mailOptions = {
        from: `"HostelNet" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your HostelNet Password",
        html: `
          <p>Hello,</p>
          <p>We received a request to reset your HostelNet password.</p>
          <p>Click the link below to reset your password (valid for 15 minutes):</p>
          <a href="${resetLink}">${resetLink}</a>
          <br/><br/>
          <p>If you didn’t request this, just ignore this email.</p>
        `
      };

      transporter.sendMail(mailOptions, (err3) => {
        if (err3) {
          console.error("Email error:", err3);
          return res.status(500).send("⚠ Failed to send reset email.");
        }
        res.send("✅ Password reset email sent. Please check your inbox.");
      });
    });
  });
});

// ===============================
// 2️⃣ OPEN RESET PAGE (via link in email)
// ===============================
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

// ===============================
// 3️⃣ UPDATE PASSWORD (from form)
// ===============================
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) return res.send("Invalid request.");

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = "SELECT * FROM users WHERE reset_token=? AND reset_expiry > NOW()";

  conn.query(sql, [token], (err, results) => {
    if (err) return res.send("Server error.");
    if (results.length === 0) return res.send("❌ Invalid or expired token.");

    const updateSQL =
      "UPDATE users SET password=?, reset_token=NULL, reset_expiry=NULL WHERE reset_token=?";
    conn.query(updateSQL, [hashedPassword, token], (err2) => {
      if (err2) return res.send("Error updating password.");
      res.send("✅ Password successfully reset!");
    });
  });
});

// ===============================
// 4️⃣ RUN SERVER
// ===============================
app.listen(3000, () => console.log("✅ Server running on port 3000"));