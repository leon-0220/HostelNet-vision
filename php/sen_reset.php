<?php
$conn = mysqli_connect("localhost", "root", "", "hostel_db");

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$email = $_POST['email'];

// semak email dalam DB
$result = mysqli_query($conn, "SELECT * FROM users WHERE email='$email'");

if (mysqli_num_rows($result) > 0) {
    // buat token unik
    $token = bin2hex(random_bytes(16));
    $expire = date("Y-m-d H:i:s", strtotime("+1 hour"));

    // simpan token
    mysqli_query($conn, "UPDATE users SET reset_token='$token', reset_expire='$expire' WHERE email='$email'");

    // link reset
    $resetLink = "http://localhost/project/php/reset_password.php?token=$token";

    // HANTAR EMAIL → (contoh basic, Ayra kena setup PHPMailer untuk real)
    echo "Reset link: <a href='$resetLink'>$resetLink</a>";
} else {
    echo "Email not found!";
}
?>
