<?php
header('Content-Type: application/json');

// sambung DB
$conn = new mysqli("localhost", "root", "", "hostelnet");
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// ambil complaints
$complaints = [];
$res = $conn->query("SELECT * FROM complaints ORDER BY date DESC");
while($row = $res->fetch_assoc()){
    $complaints[] = $row;
}

// ambil students
$students = [];
$res2 = $conn->query("SELECT * FROM students WHERE status='checked_in'");
while($row = $res2->fetch_assoc()){
    $students[] = $row;
}

echo json_encode([
    "complaints" => $complaints,
    "students"   => $students
]);