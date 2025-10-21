<?php
$host = 'localhost';
$user = 'root';
$pass = ''; // kosongkan kalau tak set password
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Buat user baru 'ayrauser' dengan password '12345'
$sql = "CREATE USER IF NOT EXISTS 'ayrauser'@'localhost' IDENTIFIED BY '12345';
        GRANT ALL PRIVILEGES ON *.* TO 'ayrauser'@'localhost' WITH GRANT OPTION;
        FLUSH PRIVILEGES;";

if ($conn->multi_query($sql) === TRUE) {
    echo "✅ User 'ayrauser' berjaya dibuat dan diberi akses penuh.";
} else {
    echo "❌ Error: " . $conn->error;
}

$conn->close();
?>