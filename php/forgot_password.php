<?php
$conn = new mysqli("sql113.infinityfree.com", "if0_4008626", "", "if0_40086262_hostelnetsystemt"); 

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];

    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $role = ucfirst($row['role']);
        echo "<script>alert('✅ Reset link has been sent to $email ($role)'); window.location.href='../index.html';</script>";
    } else {
        echo "<script>alert('⚠️ Email not found!'); window.history.back();</script>";
    }

    $stmt->close();
}
$conn->close();
?>