<?php
include("../php/db_connect.php");
$jobs = $conn->query("SELECT * FROM complaints WHERE status='completed'");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Completed Jobs</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="container mt-5">
  <h2>✅ Completed Jobs</h2>
  <table class="table table-bordered">
    <thead>
      <tr><th>ID</th><th>Student</th><th>Description</th><th>Date Completed</th></tr>
    </thead>
    <tbody>
      <?php while($j = $jobs->fetch_assoc()): ?>
        <tr>
          <td><?= $j['id'] ?></td>
          <td><?= $j['student_id'] ?></td>
          <td><?= $j['description'] ?></td>
          <td><?= $j['updated_at'] ?></td>
        </tr>
      <?php endwhile; ?>
    </tbody>
  </table>
  <a href="warden_dashboard.php" class="btn btn-secondary">⬅ Back</a>
</body>
</html>