<?php
session_start();

// Contoh role dari login
// $_SESSION['role'] = 'student'; // contoh
if(!isset($_SESSION['role'])){
    header("Location: login.php");
    exit;
}

$role = $_SESSION['role'];

// Contoh data bilik (biasanya dari DB)
$rooms = [
    ['block'=>'D401','number'=>'101','status'=>'Available'],
    ['block'=>'D402','number'=>'102','status'=>'Occupied'],
    ['block'=>'SSD/8 21A','number'=>'103','status'=>'Available'],
    ['block'=>'SSD/8 21B','number'=>'104','status'=>'Occupied'],
];