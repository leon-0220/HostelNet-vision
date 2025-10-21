<div class="layout">
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <h3>Menu</h3>
        <ul>
            <li><a href="dashboard.php">🏠 Home</a></li>
            <li><a href="rooms.php" class="active">🏘 Rooms</a></li>
            <?php if($role == 'warden' || $role == 'admin'){ ?>
                <li><a href="manage_rooms.php">🔧 Manage Rooms</a></li>
            <?php } ?>
            <li><a href="logout.php">🚪 Logout</a></li>
        </ul>
    </div>

    <div class="container">
        <h2>Hostel Rooms 🏠</h2>
        <table id="roomsTable">
            <thead>
                <tr>
                    <th>Block</th>
                    <th>Room Number</th>
                    <th>Status</th>
                    <?php if($role == 'warden' || $role == 'admin'){ ?>
                        <th>Action</th>
                    <?php } ?>
                </tr>
            </thead>
            <tbody>
                <?php foreach($rooms as $room){ ?>
                    <tr>
                        <td><?= $room['block']; ?></td>
                        <td><?= $room['number']; ?></td>
                        <td><?= $room['status']=='Available' ? '✅ Available':'❌ Occupied'; ?></td>
                        <?php if($role == 'warden' || $role == 'admin'){ ?>
                            <td>
                                <?php if($room['status']=='Available'){ ?>
                                    <a href="checkin.php?room=<?= $room['number']; ?>" class="btn btn-primary">Check-in</a>
                                <?php } else { ?>
                                    <a href="checkout.php?room=<?= $room['number']; ?>" class="btn btn-danger">Check-out</a>
                                <?php } ?>
                            </td>
                        <?php } ?>
                    </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</div>