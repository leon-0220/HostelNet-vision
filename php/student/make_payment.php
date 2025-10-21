<?php
include("../db_connect.php");

$student_id = 1;
$amount = $_POST['amount'];

$sql = "INSERT INTO payments (student_id, amount, status, created_at) VALUES ($student_id, $amount, 'pending', NOW())";
if ($conn->query($sql) === TRUE) {
    echo "Payment submitted";
} else {
    echo "Error: " . $conn->error;
}
?>