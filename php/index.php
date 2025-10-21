<?php
session_start();

// kalau user belum login
if (!isset($_SESSION['user_id'])) {
    $isLoggedIn = false;
} else {
    $isLoggedIn = true;
    $username = $_SESSION['username']; // boleh letak nama dari DB masa login
    $role = $_SESSION['role']; // contoh: student/warden/admin
}
?>