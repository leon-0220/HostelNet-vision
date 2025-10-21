<?php
header('Content-Type: application/json');
session_start();

// sambung database
$conn = new mysqli("localhost", "root", "", "hostelnet");

// check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// contoh: ambil id student dari session
$student_id = $_SESSION['student_id'] ?? 1; // default 1 utk test

$sql = "SELECT name, email, phone, hostel, room_no FROM students WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(["error" => "Student not found"]);
}

$stmt->close();
$conn->close();
?>