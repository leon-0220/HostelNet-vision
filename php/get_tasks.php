<?php
include "db_connect.php";

$sql = "SELECT * FROM maintenance_tasks ORDER BY date_reported DESC";
$result = mysqli_query($conn, $sql);

$tasks = [];

while ($row = mysqli_fetch_assoc($result)) {
    $tasks[] = $row;
}

echo json_encode($tasks);
?>