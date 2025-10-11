<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    $role = "student"; // default role, boleh ubah ikut form

    // Hash password sebelum simpan
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $username, $hashedPassword, $role);

    if ($stmt->execute()) {
        echo "<script>alert('✅ Pendaftaran berjaya!'); window.location.href='login.html';</script>";
    } else {
        echo "<script>alert('❌ Username sudah wujud'); window.location.href='register.html';</script>";
    }
}
?>