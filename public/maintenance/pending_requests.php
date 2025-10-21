<?php
session_start();
include "../../php/config.php";

// Ambil semua request yang status = pending
$sql = "SELECT * FROM maintenance_requests WHERE status = 'pending' ORDER BY created_at DESC";
$result = $conn->query($sql);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pending Maintenance Requests</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
  <div class="container mt-5">
    <h2 class="mb-4">Pending Maintenance Requests</h2>
    
    <?php if ($result->num_rows > 0): ?>
      <table class="table table-bordered table-striped">
        <thead class="table-dark">
          <tr>
            <th>ID</th>
            <th>Student ID</th>
            <th>Room Number</th>
            <th>Request</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php while ($row = $result->fetch_assoc()): ?>
            <tr>
              <td><?php echo $row['id']; ?></td>
              <td><?php echo htmlspecialchars($row['student_id']); ?></td>
              <td><?php echo htmlspecialchars($row['room_number']); ?></td>
              <td><?php echo htmlspecialchars($row['request_text']); ?></td>
              <td><?php echo $row['created_at']; ?></td>
              <td><span class="badge bg-warning"><?php echo ucfirst($row['status']); ?></span></td>
              <td>
                <form action="../../php/update_request.php" method="POST" style="display:inline;">
                  <input type="hidden" name="id" value="<?php echo $row['id']; ?>">
                  <button type="submit" name="action" value="in_progress" class="btn btn-sm btn-primary">Mark In Progress</button>
                  <button type="submit" name="action" value="completed" class="btn btn-sm btn-success">Mark Completed</button>
                </form>
              </td>
            </tr>
          <?php endwhile; ?>
        </tbody>
      </table>
    <?php else: ?>
      <div class="alert alert-info">No pending requests.</div>
    <?php endif; ?>
  </div>
</body>
</html>
<?php $conn->close(); ?>