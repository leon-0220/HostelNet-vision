<?php
include "php/db_connect.php";

if (isset($_GET['token'])) {
    $token = $_GET['token'];
} else {
    die("Invalid request.");
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $token = $_POST['token'];
    $newPassword = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Check token valid
    $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token=? AND reset_expiry > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        // Update password
        $stmt = $conn->prepare("UPDATE users SET password=?, reset_token=NULL, reset_expiry=NULL WHERE reset_token=?");
        $stmt->bind_param("ss", $newPassword, $token);
        $stmt->execute();

        echo "Password successfully reset!";
    } else {
        echo "Invalid or expired token.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Password</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="d-flex justify-content-center align-items-center vh-100 bg-light">
  <div class="card p-4 shadow" style="width: 350px;">
    <h4 class="mb-3 text-center">Reset Password</h4>
    <form method="POST">
      <input type="hidden" name="token" value="<?php echo $token; ?>">
      <div class="mb-3">
        <input type="password" name="password" class="form-control" placeholder="New Password" required>
      </div>
      <button type="submit" class="btn btn-success w-100">Update Password</button>
    </form>
  </div>
</body>
</html>