CREATE DATABASE IF NOT EXISTS hostelnetsystem;
USE hostelnetsystem;

CREATE TABLE IF NOT EXISTS hostel_units (
    unit_code VARCHAR(20) PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO hostel_units (unit_code, unit_name, description)
VALUES ('D401', 'Kelana Parkview', 'Male Hostel'),
       ('D402', 'Kelana Parkview', 'Male Hostel'),
       ('11A', 'SS4B/13', 'Male Hostel'),
       ('14', 'SS4C/15', 'Male Hostel'),
       ('20', 'SS5D/6A', 'Male Hostel'),
       ('21A', 'SS4D/8', 'Male Hostel'),
       ('21B', 'SS4D/8', 'Male Hostel'),
       ('32', 'SS5C/11', 'Male Hostel'),
       ('20-1', 'Spacepod', 'Male Hostel'),
       ('36-1', 'Spacepod', 'Male Hostel'),
       ('38-1', 'Spacepod', 'Male Hostel'),
       ('D201', 'Kelana Parkview', 'Female Hostel'),
       ('D202', 'Kelana Parkview', 'Female Hostel'),
       ('D204', 'Kelana Parkview', 'Female Hostel'),
       ('D301', 'Kelana Parkview', 'Female Hostel'),
       ('D404', 'Kelana Parkview', 'Female Hostel'),
       ('12', 'SS5D/8', 'Female Hostel'),
       ('18A4', 'Ayamas', 'Female Hostel'),
       ('20B2', 'Focus Point', 'Female Hostel'),
       ('20B3', 'Focus Point', 'Female Hostel'),
       ('20B4', 'Focus Point', 'Female Hostel'),
       ('24B3', '7-11', 'Female Hostel'),
       ('24A4', '7-11', 'Female Hostel'),
       ('5B', 'SS6/8', 'Female Hostel'),
       ('5C', 'SS6/8', 'Female Hostel'),
       ('36-2', 'Spacepod', 'Female Hostel'),
       ('36-3', 'Spacepod', 'Female Hostel'),
       ('38-2', 'Spacepod', 'Female Hostel'),
       ('38-3', 'Spacepod', 'Female Hostel'),
       ('20-2', 'Spacepod', 'Female Hostel'),
       ('20-3', 'Spacepod', 'Female Hostel');

CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    course VARCHAR(100),
    gender ENUM('male','female'),
    email VARCHAR(150)
);

INSERT INTO students (student_id, name, course, gender, email)
VALUES ('DLM0423-001', 'Tengku Adrean Ruiz Bin Tengku Asyraf Ruiz', 'Diploma in Logistic Management', 'male', 'tadrean@gmail.com'),
       ('DLM0423-002', 'Thariq Ridzuwan Bin Tizz Razif', 'Diploma in Logistic Management', 'male', 'thariq@gmail.com'),
       ('DIT0423-001', 'Rahmah Binti Mohamad Sukor', 'Diploma in IT', 'female', 'rahmahsukor5@gmail.com'),
       ('DIT0423-002', 'Puteri Nurelisah Binti Nasir', 'Diploma in IT', 'female', 'puteri@gmail.com'),
       ('DIT0423-003', 'Nur Aisyah', 'Diploma in IT', 'female', 'aisyah@gmail.com');

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ref_id VARCHAR(50) NOT NULL,           
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,         
    password VARCHAR(255) NOT NULL,
    role ENUM('student','finance','warden','admin','maintenance') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (user_ref_id, username, email, password, role)
VALUES ('DLM0423-001', 'JovenMaestro.09', 'tadrean@gmail.com', 'TengkuAdreanRuiz02', 'student'),
       ('DLM0423-002', 'Eagle.08', 'thariq@gmail.com', 'ThariqRidzuwan', 'student'),
       ('DIT0423-001', 'Leon.0920', 'rahmahsukor5@gmail.com', 'TengkuAdreanRuiz02', 'student'),
       ('FIN001', 'Finance.01', 'finance01@gmail.com', 'FinancePass01', 'finance'),
       ('WARD001', 'Warden.01', 'warden01@gmail.com', 'WardenPass01', 'warden'),
       ('ADMIN001', 'Admin.01', 'admin01@gmail.com', 'AdminPass01', 'admin'),
       ('MAIN001', 'Maintenance.01', 'maint01@gmail.com', 'MaintPass01', 'maintenance');

CREATE TABLE IF NOT EXISTS rooms (
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    available INT NOT NULL DEFAULT 0,
    status ENUM('active','inactive','maintenance') DEFAULT 'active',
    PRIMARY KEY (unit_code, room_number),
    FOREIGN KEY (unit_code) REFERENCES hostel_units(unit_code) ON DELETE CASCADE
);

INSERT INTO rooms (unit_code, room_number, capacity, available)
VALUES ('24B3', '02', 10, 3),
       ('24B3', '03', 10, 3),
       ('24B3', '04', 12, 2);

CREATE TABLE IF NOT EXISTS room_assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    assigned_date DATE NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (unit_code, room_number) REFERENCES rooms(unit_code, room_number)
);

CREATE TABLE IF NOT EXISTS checkin_checkout (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    checkin_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkout_date TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_code, room_number) REFERENCES rooms(unit_code, room_number)
);

CREATE TABLE IF NOT EXISTS payments (
   payment_id INT AUTO_INCREMENT PRIMARY KEY,
   student_id VARCHAR(20) NOT NULL,
   amount DECIMAL(10,2) NOT NULL,
   payment_date DATE NOT NULL,
   status ENUM('paid', 'pending', 'overdue') DEFAULT 'paid',
   FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

INSERT INTO payments (student_id, amount, payment_date, status)
VALUES ('DLM0423-001', '500', CURDATE(), 'paid');

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ref_id VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    request_text TEXT NOT NULL,
    status ENUM('pending','in_progress','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS completed_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO completed_jobs (job_title, description)
VALUES ('Fix Aircond', 'Aircond at Room B202 repaired successfully.'),
       ('Change Bulb', 'Bulb replaced at Hallway 3.'),
       ('Plumbing', 'Leak fixed at Block A toilet.');
