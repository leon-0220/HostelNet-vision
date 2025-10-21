<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name  = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $student_id = $_POST['student_id']; 

    $stmt = $conn->prepare("UPDATE students SET name=?, email=?, phone=? WHERE id=?");
    $stmt->bind_param("sssi", $name, $email, $phone, $student_id);

    if($stmt->execute()){
        echo "Profile updated successfully!";
    } else {
        echo "Error: ".$stmt->error;
    }
    $stmt->close();
    $conn->close();
}
?>