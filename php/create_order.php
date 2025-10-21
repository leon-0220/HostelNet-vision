<?php
// server/create_order.php
header('Content-Type: application/json');
$body = json_decode(file_get_contents('php://input'), true);
if (!$body || !isset($body['items'])) {
  http_response_code(400); echo json_encode(['error'=>'invalid body']); exit;
}

$dir = __DIR__ . '/../data';
if (!is_dir($dir)) mkdir($dir, 0755, true);
$ordersFile = $dir . '/orders.json';
$orders = file_exists($ordersFile) ? json_decode(file_get_contents($ordersFile), true) : [];

function guidv4(){
  $data = openssl_random_pseudo_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data),4));
}

$orderId = guidv4();
$total = 0.0;
foreach($body['items'] as $it){
  $qty = (int)($it['quantity'] ?? 1);
  $unit = (float)($it['unit_amount'] ?? 0);
  $total += $qty * $unit;
}

$order = [
  'id'=>$orderId,
  'items'=>$body['items'],
  'amount'=>number_format($total,2,'.',''),
  'currency'=>$body['items'][0]['currency'] ?? 'MYR',
  'status'=>'CREATED',
  'created_at'=>date('c'),
  'metadata'=>$body['metadata'] ?? []
];

$orders[$orderId] = $order;
file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

echo json_encode(['id'=>$orderId,'order'=>$order]);