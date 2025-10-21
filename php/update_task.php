<?php
include "db_connect.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $status = $_POST['status'];

    $sql = "UPDATE maintenance_tasks SET status='$status' WHERE id=$id";

    if (mysqli_query($conn, $sql)) {
        echo "✅ Task status updated successfully!";
    } else {
        echo "❌ Error updating task: " . mysqli_error($conn);
    }
}
?>