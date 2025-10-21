<?php
$conn = new mysqli("localhost", "root", "", "hostelnet_db");

$studentName = $_POST['studentName'];
$studentID   = $_POST['studentID'];
$block       = $_POST['block'];
$roomNo      = $_POST['roomNo'];
$amount      = $_POST['amount'];
$method      = $_POST['paymentMethod'];

$sql = "INSERT INTO payments (student_name, student_id, block, room_no, amount, method, status)
        VALUES ('$studentName', '$studentID', '$block', '$roomNo', '$amount', '$method', 'Paid')";

if ($conn->query($sql) === TRUE) {
    echo "✅ Payment recorded successfully. <a href='payment.html'>Back</a>";
} else {
    echo "❌ Error: " . $conn->error;
}
$conn->close();
?>