<?php
include("../db_connect.php");

$student_id = 1;
$room_id = $_POST['room_id'];

$sql = "INSERT INTO bookings (student_id, room_id, status) VALUES ($student_id, $room_id, 'pending')";
if ($conn->query($sql) === TRUE) {
    echo "Room booking request sent";
} else {
    echo "Error: " . $conn->error;
}
?>