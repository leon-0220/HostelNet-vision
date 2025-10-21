<?php
include "db_connect.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name    = $_POST["name"];
    $email   = $_POST["email"];
    $phone   = $_POST["phone"];
    $room    = $_POST["room"];
    $dob     = $_POST["dob"];
    $address = $_POST["address"];
    $gender  = $_POST["gender"];

    $sql = "INSERT INTO students (name, email, phone, room, dob, address, gender)
            VALUES ('$name', '$email', '$phone', '$room', '$dob', '$address', '$gender')";
    
    if ($conn->query($sql) === TRUE) {
        echo "success";
    } else {
        echo "error: " . $conn->error;
    }
}
$conn->close();
?>