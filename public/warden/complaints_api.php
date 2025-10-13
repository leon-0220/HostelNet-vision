<?php
session_start();
include "../../php/db_connect.php";
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if($action === 'get_pending') {
    $result = $conn->query("SELECT * FROM complaints WHERE status='Pending'");
    $complaints = [];
    while($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }
    echo json_encode($complaints);
    exit();
}

if($action === 'mark_completed' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id']);
    $stmt = $conn->prepare("UPDATE complaints SET status='Completed' WHERE id=?");
    $stmt->bind_param("i", $id);
    if($stmt->execute()) {
        echo json_encode(['status'=>'success']);
    } else {
        echo json_encode(['status'=>'error','message'=>$stmt->error]);
    }
    exit();
}