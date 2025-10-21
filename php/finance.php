<?php
// finance.php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);
if($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$sql = "SELECT f.id, s.name, f.amount, f.type, f.description, f.date 
        FROM finance f 
        LEFT JOIN students s ON f.student_id = s.id
        ORDER BY f.date DESC";

$result = $conn->query($sql);

$transactions = [];
if($result->num_rows > 0){
    while($row = $result->fetch_assoc()){
        $transactions[] = $row;
    }
}

// Encode data sebagai JSON untuk frontend
echo json_encode($transactions);
?>