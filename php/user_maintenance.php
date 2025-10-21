<?php
include("db_connect.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $location = $_POST['location'];
    $issue = $_POST['issue'];
    $priority = $_POST['priority'];
    $date = date("Y-m-d H:i:s");

    $sql = "INSERT INTO maintenance_reports (location, issue, priority, report_date) 
            VALUES ('$location', '$issue', '$priority', '$date')";

    if (mysqli_query($conn, $sql)) {
        echo "<h3>✅ Report submitted successfully!</h3>";
        echo "<a href='maintenance.html'>Submit Another Report</a>";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
}
?>