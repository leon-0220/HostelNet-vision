<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);

if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $id = $_POST['id'];
    $name = $_POST['name'];
    $room_no = $_POST['room_no'];
    $course = $_POST['course'];

    $stmt = $conn->prepare("UPDATE students SET name=?, room_no=?, course=? WHERE id=?");
    $stmt->bind_param("sssi", $name, $room_no, $course, $id);
    $stmt->execute();
    $stmt->close();

    header("Location: html/students_list.html");
}
?>