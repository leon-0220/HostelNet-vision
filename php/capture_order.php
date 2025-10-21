<?php
// server/capture_order.php
header('Content-Type: application/json');
$body = json_decode(file_get_contents('php://input'), true);
$orderID = $body['orderID'] ?? null;
if (!$orderID) { http_response_code(400); echo json_encode(['error'=>'missing orderID']); exit; }

$ordersFile = __DIR__ . '/../data/orders.json';
if (!file_exists($ordersFile)) { http_response_code(404); echo json_encode(['error'=>'no orders']); exit; }
$orders = json_decode(file_get_contents($ordersFile), true) ?? [];

if (!isset($orders[$orderID])) { http_response_code(404); echo json_encode(['error'=>'order not found']); exit; }

$orders[$orderID]['status'] = 'COMPLETED';
$orders[$orderID]['captured_at'] = date('c');
$orders[$orderID]['capture_data'] = [
  'processor'=>'MockHostelPay',
  'capture_id'=>'CAP-' . strtoupper(substr($orderID,0,8))
];

file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

echo json_encode(['status'=>'COMPLETED','id'=>$orderID,'capture'=>$orders[$orderID]['capture_data']]);