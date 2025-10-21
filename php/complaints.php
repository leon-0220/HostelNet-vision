<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);
if($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$sql = "SELECT c.id, s.name, c.category, c.description, c.status, c.date 
        FROM complaints c
        LEFT JOIN students s ON c.student_id = s.id
        ORDER BY c.date DESC";

$result = $conn->query($sql);
$complaints = [];
if($result->num_rows > 0){
    while($row = $result->fetch_assoc()){
        $complaints[] = $row;
    }
}

echo json_encode($complaints);
?>
<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "hostel_db";

$conn = new mysqli($host, $user, $pass, $db);
if($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$sql = "SELECT c.id, s.name, c.category, c.description, c.status, c.date 
        FROM complaints c
        LEFT JOIN students s ON c.student_id = s.id
        ORDER BY c.date DESC";

$result = $conn->query($sql);
$complaints = [];
if($result->num_rows > 0){
    while($row = $result->fetch_assoc()){
        $complaints[] = $row;
    }
}

echo json_encode($complaints);
?>