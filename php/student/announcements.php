<?php
include("../db_connect.php");

$sql = "SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC";
$result = $conn->query($sql);

$announcements = [];
while ($row = $result->fetch_assoc()) {
    $announcements[] = $row;
}

echo json_encode($announcements);
?>