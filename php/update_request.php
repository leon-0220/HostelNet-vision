<?php
include "config.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = intval($_POST['id']);
    $action = $_POST['action'];

    if (in_array($action, ['in_progress', 'completed'])) {
        $sql = "UPDATE maintenance_requests SET status=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $action, $id);
        if ($stmt->execute()) {
            header("Location: ../pages/maintenance/pending_requests.php");
            exit();
        } else {
            echo "Error updating record: " . $conn->error;
        }
    }
}
$conn->close();
?>