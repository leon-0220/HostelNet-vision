<?php
include "db_connect.php";

$result = $conn->query("SELECT * FROM students ORDER BY id DESC");
$students = [];

while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}

echo json_encode($students);
$conn->close();
?>