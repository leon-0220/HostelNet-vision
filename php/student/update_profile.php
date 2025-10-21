<?php
include("../db_connect.php");

$student_id = 1;
$name  = $_POST['name'];
$email = $_POST['email'];
$phone = $_POST['phone'];

$sql = "UPDATE students SET name='$name', email='$email', phone='$phone' WHERE id=$student_id";

if ($conn->query($sql) === TRUE) {
    echo "Profile updated successfully";
} else {
    echo "Error: " . $conn->error;
}
?>