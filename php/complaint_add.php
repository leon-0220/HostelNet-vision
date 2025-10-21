<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostelnet_db";

$conn = new mysqli($host, $user, $pass, $db);

if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $student_id = $_POST['student_id'];
    $category = $_POST['category'];
    $description = $_POST['description'];

    $stmt = $conn->prepare("INSERT INTO complaints (student_id, category, description) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $student_id, $category, $description);
    $stmt->execute();
    $stmt->close();

    header("Location: html/complaints_list.html");
}
?>