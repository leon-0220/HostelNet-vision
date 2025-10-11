<?php
    $host = getenv('crossover.proxy.rlwy.net');
    $username = getenv('root');
    $pass = getenv('uWSKTbteHaXWZipnkABQiVSUvuhZVTda');
    $db = getenv('railway db2');
    $port = getenv(598855);

    $conn = new mysqli($host, $username, $pass, $db, $port);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    } else {
    die("DATABASE_URL not set");
}
?>