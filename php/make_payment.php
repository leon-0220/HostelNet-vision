<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = $_POST['student_id'];
    $amount     = $_POST['amount'];

    $stmt = $conn->prepare("INSERT INTO payments (student_id, amount, payment_date) VALUES (?, ?, NOW())");
    $stmt->bind_param("id", $student_id, $amount);

    if($stmt->execute()){
        echo "Payment successful!";
    } else {
        echo "Error: ".$stmt->error;
    }
    $stmt->close();
    $conn->close();
}
?>