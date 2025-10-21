<?php
$servername = "localhost";
$username = "root";
$password = "ad~dh~tar~hu~170152";
$dbname = "hostel_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$student_id = $_POST['student_id'];
$room_no = $_POST['room_no'];
$issue = $_POST['issue'];
$date_reported = $_POST['date_reported'];

$sql = "INSERT INTO maintenance (student_id, room_no, issue, date_reported VALUES ('$student_id', '$room_no', '$issue', '$date_reported')";

if ($conn->query($sql) === TRUE) {
    echo "Maintenance report submitted successfully.";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>