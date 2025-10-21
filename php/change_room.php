<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = $_POST['student_id'];
    $new_room_id = $_POST['new_room_id'];

    // 1. Vacate old room
    $conn->query("UPDATE rooms SET status='Available', student_id=NULL WHERE student_id=$student_id");

    // 2. Book new room
    $stmt = $conn->prepare("UPDATE rooms SET status='Occupied', student_id=? WHERE id=? AND status='Available'");
    $stmt->bind_param("ii", $student_id, $new_room_id);

    if($stmt->execute()){
        echo "Room changed successfully!";
    } else {
        echo "Error: ".$stmt->error;
    }
    $stmt->close();
    $conn->close();
}
?>