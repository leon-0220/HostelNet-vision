<?php
// forgot_password.php

session_start();
require 'db_connect.php'; // Fail sambungan pangkalan data anda

// Sertakan autoloader Composer untuk PHPMailer
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];

    // 1. Semak jika e-mel wujud dalam pangkalan data
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // E-mel wujud, teruskan proses
        $user = $result->fetch_assoc();
        $user_id = $user['id'];

        // 2. Jana token yang selamat dan unik
        $token = bin2hex(random_bytes(32));

        // 3. Tetapkan masa tamat tempoh token (contoh: 1 jam dari sekarang)
        $expiry_time = date("Y-m-d H:i:s", time() + 3600);

        // 4. Simpan token dan masa tamat tempoh ke dalam pangkalan data
        $stmt = $conn->prepare("UPDATE users SET reset_token = ?, token_expiry = ? WHERE id = ?");
        $stmt->bind_param("ssi", $token, $expiry_time, $user_id);
        $stmt->execute();

        // 5. Hantar e-mel menggunakan PHPMailer
        $mail = new PHPMailer(true);

        try {
            // Konfigurasi Server SMTP (Gunakan butiran SMTP anda sendiri)
            $mail->isSMTP();
            $mail->Host       = 'smtp.example.com'; // Cth: smtp.gmail.com
            $mail->SMTPAuth   = true;
            $mail->Username   = 'your_email@example.com'; // E-mel SMTP anda
            $mail->Password   = 'your_smtp_password';   // Kata laluan SMTP anda
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Penerima
            $mail->setFrom('no-reply@yourdomain.com', 'HostelNet Support');
            $mail->addAddress($email);

            // Kandungan E-mel
            $reset_link = "http://yourwebsite.com/reset_password.php?token=" . $token;

            $mail->isHTML(true);
            $mail->Subject = 'Password Reset Request for HostelNet';
            $mail->Body    = "Hello,<br><br>We received a request to reset your password. Click the link below to reset it:<br><br>"
                           . "<a href='{$reset_link}'>Reset Your Password</a><br><br>"
                           . "If you did not request a password reset, please ignore this email.<br><br>"
                           . "This link is valid for 1 hour.<br><br>Thanks,<br>The HostelNet Team";

            $mail->send();
            $_SESSION['message'] = "If an account with that email exists, a password reset link has been sent.";
        } catch (Exception $e) {
            $_SESSION['error'] = "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    } else {
        // E-mel tidak wujud, tunjukkan mesej yang sama untuk keselamatan
        $_SESSION['message'] = "If an account with that email exists, a password reset link has been sent.";
    }

    // Redirect kembali ke halaman utama atau login
    header("Location: ../login.php");
    exit();
}
?>