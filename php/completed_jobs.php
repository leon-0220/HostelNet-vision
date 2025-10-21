<?php
$servername = "localhost";
$username   = "root"; // default XAMPP
$password   = "";     // default kosong
$dbname     = "hostelNet";

// Connect
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
  die("❌ Connection failed: " . $conn->connect_error);
}

// Query completed jobs
$sql = "SELECT id, job_title, description, completed_at FROM completed_jobs ORDER BY completed_at DESC";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Completed Jobs | HostelNet</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="container mt-5">
  <h2 class="mb-4 text-success">✅ Completed Jobs</h2>

  <?php if ($result->num_rows > 0): ?>
    <table class="table table-bordered table-striped">
      <thead class="table-success">
        <tr>
          <th>ID</th>
          <th>Job Title</th>
          <th>Description</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody>
        <?php while($row = $result->fetch_assoc()): ?>
          <tr>
            <td><?= $row["id"] ?></td>
            <td><?= $row["job_title"] ?></td>
            <td><?= $row["description"] ?></td>
            <td><?= $row["completed_at"] ?></td>
          </tr>
        <?php endwhile; ?>
      </tbody>
    </table>
  <?php else: ?>
    <div class="alert alert-warning">⚠️ No completed jobs found.</div>
  <?php endif; ?>

</body>
</html>

<?php $conn->close(); ?>