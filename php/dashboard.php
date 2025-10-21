<?php
session_start();
if(!isset($_SESSION['user_id'])){
    header("Location: login.html");
    exit();
}

$role = $_SESSION['role']; // dapatkan role user
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dashboard</title>
<link rel="stylesheet" href="../css/style.css">
</head>
<body>
<div class="layout">
  <div class="sidebar">
    <h2>Dashboard Panel</h2>
    <ul>
      <?php
        // menu ikut role
        switch($role){
          case 'admin':
            $menus = ['Dashboard','Manage Users','Reports','Settings','Logout'];
            break;
          case 'student':
            $menus = ['Dashboard','My Courses','Assignments','Grades','Logout'];
            break;
          case 'finance':
            $menus = ['Dashboard','Payments','Revenue','Reports','Logout'];
            break;
          case 'maintenance':
            $menus = ['Dashboard','Requests','Tasks','Logout'];
            break;
          case 'warden':
            $menus = ['Dashboard','Room Status','Residents','Logout'];
            break;
        }

        foreach($menus as $menu){
          echo "<li><a href='#'>$menu</a></li>";
        }
      ?>
    </ul>
  </div>

  <div class="main">
    <header>
      <h1>Welcome, <?php echo ucfirst($role); ?></h1>
    </header>

    <?php
      // show dashboard ikut role
      include "dashboards/$role.php";
    ?>
  </div>
</div>
</body>
</html>