<?php
include("../db_connect.php");

$student_id = 1;
$new_room_id = $_POST['room_id'];

$sql = "UPDATE bookings SET room_id=$new_room_id, status='pending' WHERE student_id=$student_id";
if ($conn->query($sql) === TRUE) {
    echo "Room change request sent";
} else {
    echo "Error: " . $conn->error;
}
?>