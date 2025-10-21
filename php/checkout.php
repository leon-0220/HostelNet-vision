<?php
// sambung ke database
$host = "localhost";
$user = "root";   // tukar ikut setting XAMPP/WAMP
$pass = "";
$db   = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// bila form submit
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $student_id   = $_POST['student_id'];
  $room_no      = $_POST['room_no'];
  $checkout_date = $_POST['checkout_date'];

  // insert ke table checkout
  $sql = "INSERT INTO checkout (student_id, room_no, checkout_date) 
          VALUES ('$student_id', '$room_no', '$checkout_date')";

  if ($conn->query($sql) === TRUE) {
    echo "<script>alert('Checkout berjaya!'); window.location.href='checkout.html';</script>";
  } else {
    echo "Error: " . $sql . "<br>" . $conn->error;
  }
}

$conn->close();
?>