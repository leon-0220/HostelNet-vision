<?php include 'db_connect.php'; ?>
<!DOCTYPE html>
<html>
<head>
  <title>Student List</title>
</head>
<body>
  <h2>Senarai Student</h2>
  <table border="1">
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Course</th>
    </tr>
    <?php
    $sql = "SELECT student_id, name, course FROM students";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
      while($row = $result->fetch_assoc()) {
        echo "<tr>
                <td>".$row['student_id']."</td>
                <td>".$row['name']."</td>
                <td>".$row['course']."</td>
              </tr>";
      }
    } else {
      echo "<tr><td colspan='3'>Tiada data</td></tr>";
    }
    ?>
  </table>
</body>
</html>