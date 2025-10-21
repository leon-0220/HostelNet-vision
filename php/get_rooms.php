<?php
include "db_connect.php";

$sql = "SELECT * FROM rooms ORDER BY hostel, room_no";
$result = $conn->query($sql);

$rooms = [];
if($result->num_rows > 0){
    while($row = $result->fetch_assoc()){
        $rooms[] = $row;
    }
}

echo json_encode($rooms);
?>