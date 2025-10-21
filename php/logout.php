<?php
session_start();
include "db_connect.php";

if (isset($_SESSION['username'])) {
    $username = $_SESSION['username'];
    $logout_time = date("Y-m-d H:i:s");
    
    $sql = "INSERT INTO user_activity (username, action, time) VALUES ('$username', 'Logout', '$logout_time')";
    mysqli_query($conn, $sql);
}

session_unset();
session_destroy();

header("Location: ../../index.html");
exit();
?>