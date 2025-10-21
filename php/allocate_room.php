<?php
session_start();
include "db_connect.php";

// Fetch available rooms
$roomsQuery = "SELECT * FROM rooms WHERE status='Available'";
$roomsResult = mysqli_query($conn, $roomsQuery);

// Fetch students
$studentsQuery = "SELECT * FROM students";
$studentsResult = mysqli_query($conn, $studentsQuery);

// Allocate room
if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $student_id = $_POST['student_id'];
    $room_id = $_POST['room_id'];

    // Insert allocation
    $insertQuery = "INSERT INTO allocations(student_id, room_id) VALUES('$student_id', '$room_id')";
    if(mysqli_query($conn, $insertQuery)) {
        // Update room status
        mysqli_query($conn, "UPDATE rooms SET status='Occupied' WHERE room_id='$room_id'");
        $message = "Room allocated successfully!";
    } else {
        $message = "Error: ".mysqli_error($conn);
    }
}
?>