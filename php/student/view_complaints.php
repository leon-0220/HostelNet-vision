<?php
include("../db_connect.php");

$student_id = 1;

$sql = "SELECT id, message, status, created_at FROM complaints WHERE student_id=$student_id";
$result = $conn->query($sql);

$complaints = [];
while ($row = $result->fetch_assoc()) {
    $complaints[] = $row;
}

echo json_encode($complaints);
?>