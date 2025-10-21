<?php
include("../db_connect.php");

$student_id = 1;
$message = $_POST['message'];

$sql = "INSERT INTO complaints (student_id, message, status, created_at) VALUES ($student_id, '$message', 'pending', NOW())";
if ($conn->query($sql) === TRUE) {
    echo "Complaint submitted";
} else {
    echo "Error: " . $conn->error;
}
?>