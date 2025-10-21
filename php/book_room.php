<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = $_POST['student_id'];
    $room_id    = $_POST['room_id'];

    // Update room status
    $stmt = $conn->prepare("UPDATE rooms SET status='Occupied', student_id=? WHERE id=? AND status='Available'");
    $stmt->bind_param("ii", $student_id, $room_id);

    if($stmt->execute()){
        echo "Room booked successfully!";
    } else {
        echo "Error: ".$stmt->error;
    }
    $stmt->close();
    $conn->close();
}
?>