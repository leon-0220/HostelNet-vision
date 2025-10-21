<?php
// add_transaction.php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);

if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $student_id = $_POST['student_id'];
    $amount = $_POST['amount'];
    $type = $_POST['type'];
    $description = $_POST['description'];

    $stmt = $conn->prepare("INSERT INTO finance (student_id, amount, type, description) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("idss", $student_id, $amount, $type, $description);
    $stmt->execute();
    $stmt->close();

    header("Location: html/finance_list.html"); // Redirect ke frontend
}
?>