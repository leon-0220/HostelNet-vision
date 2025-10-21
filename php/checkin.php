<?php
include("db_connect.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $studentId   = mysqli_real_escape_string($conn, $_POST['studentId']);
    $studentName = mysqli_real_escape_string($conn, $_POST['studentName']);
    $course      = mysqli_real_escape_string($conn, $_POST['course']);
    $block       = mysqli_real_escape_string($conn, $_POST['block']);
    $roomNo      = mysqli_real_escape_string($conn, $_POST['roomNo']);
    $checkinDate = mysqli_real_escape_string($conn, $_POST['checkinDate']);

    $sql = "INSERT INTO checkin (student_id, student_name, course, block, room_no, checkin_date)
            VALUES ('$studentId', '$studentName', '$course', '$block', '$roomNo', '$checkinDate')";

    if (mysqli_query($conn, $sql)) {
        echo "<script>alert('Check-in successful!'); window.location='checkin.html';</script>";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
}
?>

<?php
include("db_connect.php");

if (isset($_GET['room_id'])) {
    $roomId = $_GET['room_id'];

    // Update status bilik
    $sql = "UPDATE rooms SET status='Occupied' WHERE id='$roomId'";

    if (mysqli_query($conn, $sql)) {
        echo "<h3>✅ Successfully checked in!</h3>";
        echo "<a href='student_rooms.html'>Back to Rooms</a>";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
}
?>