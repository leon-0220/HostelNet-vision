<?php
include "../../php/db_connect.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $token = $_POST['token'];
    $password = $_POST['password'];

    if (empty($token) || empty($password)) {
        echo "<script>alert('Invalid request!'); window.location.href='../../forgot_password.html';</script>";
        exit;
    }

    $sql = "SELECT * FROM password_resets WHERE token = '$token' LIMIT 1";
    $result = mysqli_query($conn, $sql);

    if (mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        $email = $row['email'];

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $update = "UPDATE users SET password = '$hashed_password' WHERE email = '$email'";
        mysqli_query($conn, $update);

        mysqli_query($conn, "DELETE FROM password_resets WHERE email = '$email'");

        echo "<script>alert('Password has been reset successfully! Please log in again.'); window.location.href='../../login.html';</script>";
    } else {
        echo "<script>alert('Invalid or expired token.'); window.location.href='../../forgot_password.html';</script>";
    }
}
?>