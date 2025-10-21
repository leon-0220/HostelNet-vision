<?php
// connect db
$conn = new mysqli("localhost", "root", "", "hostelnet_db");

$studentName = $_GET['studentName'];
$studentID   = $_GET['studentID'];
$amount      = $_GET['amount'];

// insert into payments table
$sql = "INSERT INTO payments (student_name, student_id, amount, method, status) 
        VALUES ('$studentName', '$studentID', '$amount', 'PayPal/Online Banking', 'Paid')";
$conn->query($sql);
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Successful</title>
  <link rel="stylesheet" href="css/paymentstyle.css">
</head>
<body>
  <div class="main-content">
    <h2>✅ Payment Successful</h2>
    <p>Thank you, <?php echo htmlspecialchars($studentName); ?>.</p>
    <p>Amount Paid: RM <?php echo htmlspecialchars($amount); ?></p>
    <a href="payments.html">Back to Payments</a>
  </div>
</body>
</html>