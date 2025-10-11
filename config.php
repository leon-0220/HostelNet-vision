<?php
$host = "trolley.proxy.rlwy.net";
$port = "28476";
$user = "root";
$pass = "HdmIDiTCnwbfpVfzujxZEfTmhgGkbnlA"; 
$db = "railway db1";

$conn = mysqli_connect($host, $user, $password, $dbname, $port);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
} else {
    echo "Connected successfully!";
}
?>