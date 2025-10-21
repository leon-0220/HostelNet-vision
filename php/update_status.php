<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);

if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $id = $_POST['id'];
    $status = $_POST['status'];

    $stmt = $conn->prepare("UPDATE complaints SET status=? WHERE id=?");
    $stmt->bind_param("si", $status, $id);
    $stmt->execute();
    $stmt->close();

    header("Location: html/complaints_list.html");
}
?>