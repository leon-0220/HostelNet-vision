<?php
$conn = new mysqli("localhost", "root", "", "hostelNet");

$result = $conn->query("SELECT room_number, status FROM rooms");
$rooms = [];

while($row = $result->fetch_assoc()) {
    $rooms[] = $row;
}

header('Content-Type: application/json');
echo json_encode($rooms);
?>