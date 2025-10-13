<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = $_POST['student_id'];
    $room_number = $_POST['room_number'];

    // check if student exists
    $check = $conn->prepare("SELECT * FROM students WHERE id = ?");
    $check->bind_param("i", $student_id);
    $check->execute();
    $result = $check->get_result();

    if($result->num_rows > 0){
        $stmt = $conn->prepare("UPDATE students SET room_number = ? WHERE id = ?");
        $stmt->bind_param("si", $room_number, $student_id);

        if($stmt->execute()){
            echo "Room assigned successfully!";
        } else {
            echo "Error assigning room: " . $conn->error;
        }

    } else {
        echo "Student ID not found!";
    }
}
?>