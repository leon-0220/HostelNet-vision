<?php
$host = "localhost";
$user = "root";   // tukar ikut setting
$pass = "ad~dh~tar~hu~170152";       // password MySQL
$db   = "hostelNet";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

$action = $_GET['action'] ?? '';

if ($action == 'payments') {
    $sql = "SELECT p.payment_id, s.name, p.student_id, p.amount, p.payment_date 
            FROM payments p 
            JOIN students s ON p.student_id = s.student_id";
    $result = $conn->query($sql);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'outstanding') {
    $sql = "SELECT s.student_id, s.name, SUM(p.amount) AS outstanding 
            FROM payments p 
            JOIN students s ON p.student_id = s.student_id
            WHERE p.status IN ('pending','overdue')
            GROUP BY s.student_id, s.name";
    $result = $conn->query($sql);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

if ($action == 'reports') {
    $report = [];

    $sql1 = "SELECT SUM(amount) AS total FROM payments WHERE status='paid'";
    $report['totalPayments'] = $conn->query($sql1)->fetch_assoc()['total'] ?? 0;

    $sql2 = "SELECT SUM(amount) AS outstanding FROM payments WHERE status!='paid'";
    $report['totalOutstanding'] = $conn->query($sql2)->fetch_assoc()['outstanding'] ?? 0;

    $sql3 = "SELECT COUNT(DISTINCT student_id) AS count FROM payments";
    $report['studentCount'] = $conn->query($sql3)->fetch_assoc()['count'] ?? 0;

    echo json_encode($report);
}

$conn->close();
?>