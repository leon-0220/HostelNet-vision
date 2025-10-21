<?php
require_once 'db_connect.php';

// get unit from query param
if (!isset($_GET['unit']) || empty($_GET['unit'])) {
    echo "No unit selected.";
    exit;
}

$unit = $_GET['unit'];

// load HTML template
$templatePath = __DIR__ . '/room_details.html';
if (!file_exists($templatePath)) {
    echo "Template not found.";
    exit;
}
$template = file_get_contents($templatePath);

// Prepare statement to fetch rooms in the unit
$stmtRooms = $conn->prepare("SELECT room_number, capacity FROM rooms WHERE unit_code = ? ORDER BY room_number");
$stmtRooms->bind_param("s", $unit);
$stmtRooms->execute();
$resultRooms = $stmtRooms->get_result();

$rowsHtml = "";
$totalRooms = 0;
$roomIndex = 0;

while ($room = $resultRooms->fetch_assoc()) {
    $roomIndex++;
    $roomNo = $room['room_number'];
    $capacity = $room['capacity'] ?? 'N/A';

    // fetch students for this room
    $stmtStudents = $conn->prepare("SELECT student_id, name FROM students WHERE unit_code = ? AND room_number = ? ORDER BY name");
    $stmtStudents->bind_param("ss", $unit, $roomNo);
    $stmtStudents->execute();
    $resultStudents = $stmtStudents->get_result();

    $occupancy = $resultStudents->num_rows;
    $status = ($occupancy > 0) ? "❌ Occupied" : "✅ Available";

    // build students list (hidden row that can be toggled)
    $studentsListHtml = "";
    if ($occupancy > 0) {
        $studentsListHtml .= "<ul style='margin:0;padding-left:16px;text-align:left;'>";
        while ($s = $resultStudents->fetch_assoc()) {
            $sid = htmlspecialchars($s['student_id'], ENT_QUOTES, 'UTF-8');
            $sname = htmlspecialchars($s['name'], ENT_QUOTES, 'UTF-8');
            $studentsListHtml .= "<li>{$sid} - {$sname}</li>";
        }
        $studentsListHtml .= "</ul>";
    } else {
        $studentsListHtml = "No students";
    }

    // unique id for toggle row
    $toggleId = "students_row_{$roomIndex}";

    // main row (room info) and a hidden full-width row for students (mobile friendly)
    $rowsHtml .= "<tr>
        <td>Room " . htmlspecialchars($roomNo, ENT_QUOTES, 'UTF-8') . "</td>
        <td>" . htmlspecialchars($capacity, ENT_QUOTES, 'UTF-8') . "</td>
        <td>{$occupancy}</td>
        <td>{$status}</td>
        <td><button class='toggle-students' data-target='{$toggleId}'>View Students</button></td>
      </tr>";

    // extra row (hidden by default) that shows students list spanning columns
    $rowsHtml .= "<tr id='{$toggleId}' style='display:none;'>
        <td colspan='5'>{$studentsListHtml}</td>
      </tr>";

    $stmtStudents->close();
    $totalRooms++;
}

$stmtRooms->close();

// replace placeholders in template
$template = str_replace("{{UNIT_NAME}}", htmlspecialchars($unit, ENT_QUOTES, 'UTF-8'), $template);
$template = str_replace("{{TOTAL_ROOMS}}", intval($totalRooms), $template);
$template = str_replace("{{ROOMS_ROWS}}", $rowsHtml, $template);

// output
echo $template;