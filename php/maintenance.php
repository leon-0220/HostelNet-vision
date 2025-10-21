<?php
session_start();
if (!isset($_SESSION['username'])) {
    header('Location: login.html');
    exit;
}
$username = htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8');

$html = file_get_contents('maintenance.html');
if ($html === false) {
    // fallback message
    echo "<p>Maintenance page not available.</p>";
    exit;
}

// Replace token (if present) with escaped username
$html = str_replace('{{USERNAME}}', $username, $html);

// send
header('Content-Type: text/html; charset=utf-8');
echo $html;