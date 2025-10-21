<?php
session_start();
include '../php/db_connect.php';

// Pastikan hanya role 'finance' yang boleh masuk
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'finance') {
  http_response_code(403);
  echo "<tr><td colspan='6' class='text-center text-danger'>Access Denied</td></tr>";
  exit();
}

$sql = "SELECT payment_id, student_name, room_no, amount, payment_date, status FROM payments ORDER BY payment_date DESC";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
  while ($row = mysqli_fetch_assoc($result)) {
    $statusClass = ($row['status'] === 'Paid') ? 'status-paid' : 'status-pending';
    echo "<tr>
            <td>{$row['payment_id']}</td>
            <td>{$row['student_name']}</td>
            <td>{$row['room_no']}</td>
            <td>{$row['amount']}</td>
            <td>{$row['payment_date']}</td>
            <td class='{$statusClass}'>{$row['status']}</td>
          </tr>";
  }
} else {
  echo "<tr><td colspan='6' class='text-center'>No payment records found</td></tr>";
}
?>