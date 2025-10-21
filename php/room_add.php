<?php
$conn = mysqli_connect("localhost", "root", "", "hostel_db");

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    $check = mysqli_query($conn, "SELECT * FROM users WHERE reset_token='$token' AND reset_expire > NOW()");
    if (mysqli_num_rows($check) > 0) {
        ?>
        <form action="" method="POST">
          <input type="hidden" name="token" value="<?php echo $token; ?>">
          <input type="password" name="new_password" placeholder="New Password" required>
          <button type="submit">Reset Password</button>
        </form>
        <?php
    } else {
        echo "Invalid or expired token!";
    }
}

// proses reset
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $token = $_POST['token'];
    $new_password = password_hash($_POST['new_password'], PASSWORD_DEFAULT);

    mysqli_query($conn, "UPDATE users SET password='$new_password', reset_token=NULL, reset_expire=NULL WHERE reset_token='$token'");
    echo "Password updated successfully!";
}
?>