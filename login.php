<?php
session_start();
include "../db_connect.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = $_POST['password'];

    $sql = "SELECT * FROM users WHERE username='$username'";
    $result = mysqli_query($conn, $sql);

    if (mysqli_num_rows($result) == 1) {
        $row = mysqli_fetch_assoc($result);
        if ($password_verify($password, $row['password'])) {  
            $_SESSION['username'] = $row['username'];
            $_SESSION['role'] = $row['role'];

            if ($row['role'] == 'student') {
                header("Location: ../../pages/student/dashboard.html");
            } elseif ($row['role'] == 'warden') {
                header("Location: ../../pages/warden/dashboard.html");
            } elseif ($row['role'] == 'admin') {
                header("Location: ../../pages/admin/dashboard.html");
            } elseif ($row['role'] == 'finance') {
                header("Location: ../../pages/finance/dashboard.html");
            } elseif ($row['role'] == 'maintenance') {
                header("Location: ../../pages/maintenance/dashboard.html");
            }
            exit();
        } else {
            echo "<script>alert('Wrong password!'); window.location.href = '../../login.html';</script>";
        }
    } else {
        echo "<script>alert('User not found. Please register first.'); window.location.href = '../../register.html';</script>";
    }
}
?>