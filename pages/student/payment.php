<?php
session_start();

// Contoh data user selepas login
$_SESSION['student_name'] = "Ayra";
$_SESSION['student_id'] = "2025001";
$_SESSION['amount_due'] = 200;

// Ambil data session
$name = $_SESSION['student_name'] ?? '';
$id = $_SESSION['student_id'] ?? '';
$amount = $_SESSION['amount_due'] ?? '';

// Include HTML form
include 'payment_form.php';