<?php
include("db_connect.php");

$result = mysqli_query($conn, "SELECT * FROM rooms");
$rooms = [];

while ($row = mysqli_fetch_assoc($result)) {
    $rooms[] = $row;
}

header('Content-Type: application/json');
echo json_encode($rooms);
?>