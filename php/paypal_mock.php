<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['paypalEmail'])) {
    $conn = new mysqli("localhost", "root", "", "hostel_db");

    $studentName = $_POST['studentName'];
    $studentID   = $_POST['studentID'];
    $block       = $_POST['block'];
    $roomNo      = $_POST['roomNo'];
    $amount      = $_POST['amount'];

    $sql = "INSERT INTO payments (student_name, student_id, block, room_no, amount, method, status)
            VALUES ('$studentName', '$studentID', '$block', '$roomNo', '$amount', 'Online Banking', 'Paid')";
    $conn->query($sql);
    $conn->close();

    echo "✅ Online Banking Payment Successful. <a href='payment.html'>Back</a>";
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Online Banking Gateway</title>
</head>
<body>
  <h2>Mock Online Banking (PayPal)</h2>
  <form method="POST">
    <input type="hidden" name="studentName" value="<?php echo $_POST['studentName']; ?>">
    <input type="hidden" name="studentID" value="<?php echo $_POST['studentID']; ?>">
    <input type="hidden" name="block" value="<?php echo $_POST['block']; ?>">
    <input type="hidden" name="roomNo" value="<?php echo $_POST['roomNo']; ?>">
    <input type="hidden" name="amount" value="<?php echo $_POST['amount']; ?>">

    <label>Email</label>
    <input type="email" name="paypalEmail" required><br><br>

    <label>Password</label>
    <input type="password" name="paypalPassword" required><br><br>

    <button type="submit">Confirm Payment</button>
  </form>
</body>
</html>