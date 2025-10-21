<?php
include("../db_connect.php");

$sql = "SELECT id, room_number, capacity, status FROM rooms";
$result = $conn->query($sql);

$rooms = [];
while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
}

echo json_encode($rooms);
?>