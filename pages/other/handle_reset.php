<?php
// handle_reset.php
session_start();
require 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $token = $_POST['token'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // 1. Validasi input
    if (empty($password) || empty($confirm_password)) {
        $_SESSION['error'] = "Passwords cannot be empty.";
        header("Location: reset_password.php?token=" . $token);
        exit();
    }

    if ($password !== $confirm_password) {
        $_SESSION['error'] = "Passwords do not match.";
        header("Location: reset_password.php?token=" . $token);
        exit();
    }
    
    // Boleh tambah validasi kekuatan kata laluan di sini (cth: sekurangnya 8 aksara)
    if (strlen($password) < 8) {
        $_SESSION['error'] = "Password must be at least 8 characters long.";
        header("Location: reset_password.php?token=" . $token);
        exit();
    }

    // 2. Semak semula token sebelum mengemas kini
    $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND token_expiry > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        $user_id = $user['id'];

        // 3. Hash kata laluan baharu
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // 4. Kemas kini kata laluan dan padamkan token
        $stmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, token_expiry = NULL WHERE id = ?");
        $stmt->bind_param("si", $hashed_password, $user_id);
        
        if ($stmt->execute()) {
            $_SESSION['message'] = "Your password has been reset successfully. Please log in.";
            header("Location: ../login.php");
            exit();
        } else {
            $_SESSION['error'] = "Failed to update password. Please try again.";
            header("Location: reset_password.php?token=" . $token);
            exit();
        }
    } else {
        $_SESSION['error'] = "Invalid or expired token.";
        header("Location: ../login.php");
        exit();
    }
}
?>