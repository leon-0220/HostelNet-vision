<?php
include("../db_connect.php");

$student_id = 1;

$sql = "SELECT id, amount, status, created_at FROM payments WHERE student_id=$student_id";
$result = $conn->query($sql);

$payments = [];
while ($row = $result->fetch_assoc()) {
    $payments[] = $row;
}

echo json_encode($payments);
?>