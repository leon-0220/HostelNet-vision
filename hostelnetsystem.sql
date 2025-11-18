CREATE DATABASE hostelnet;
DROP DATABASE hostelnet;
USE hostelnet;
DROP TABLE IF EXISTS hostel_units;
CREATE TABLE hostel_units (
    unit_code VARCHAR(20) PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    description TEXT,
    gender ENUM('male','female') NOT NULL DEFAULT 'male'
);

INSERT INTO hostel_units (unit_code, unit_name, description, gender)
VALUES 
('D401', 'Kelana Parkview', 'Male Hostel', 'male'),
('D402', 'Kelana Parkview', 'Male Hostel', 'male'),
('11A', 'SS4B/13', 'Male Hostel', 'male'),
('14', 'SS4C/15', 'Male Hostel', 'male'),
('20', 'SS5D/6A', 'Male Hostel', 'male'),
('21A', 'SS4D/8', 'Male Hostel', 'male'),
('21B', 'SS4D/8', 'Male Hostel', 'male'),
('32', 'SS5C/11', 'Male Hostel', 'male'),
('20-1', 'Spacepod', 'Male Hostel', 'male'),
('36-1', 'Spacepod', 'Male Hostel', 'male'),
('38-1', 'Spacepod', 'Male Hostel', 'male'),
('D201', 'Kelana Parkview', 'Female Hostel', 'female'),
('D202', 'Kelana Parkview', 'Female Hostel', 'female'),
('D204', 'Kelana Parkview', 'Female Hostel', 'female'),
('D301', 'Kelana Parkview', 'Female Hostel', 'female'),
('D404', 'Kelana Parkview', 'Female Hostel', 'female'),
('12', 'SS5D/8', 'Female Hostel', 'female'),
('18A4', 'Ayamas', 'Female Hostel', 'female'),
('20B2', 'Focus Point', 'Female Hostel', 'female'),
('20B3', 'Focus Point', 'Female Hostel', 'female'),
('20B4', 'Focus Point', 'Female Hostel', 'female'),
('24B3', '7-11', 'Female Hostel', 'female'),
('24A4', '7-11', 'Female Hostel', 'female'),
('5B', 'SS6/8', 'Female Hostel', 'female'),
('5C', 'SS6/8', 'Female Hostel', 'female'),
('36-2', 'Spacepod', 'Female Hostel', 'female'),
('36-3', 'Spacepod', 'Female Hostel', 'female'),
('38-2', 'Spacepod', 'Female Hostel', 'female'),
('38-3', 'Spacepod', 'Female Hostel', 'female'),
('20-2', 'Spacepod', 'Female Hostel', 'female'),
('20-3', 'Spacepod', 'Female Hostel', 'female');

DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    available INT NOT NULL DEFAULT 4,
    status ENUM('active','inactive','maintenance') DEFAULT 'active',
    PRIMARY KEY (unit_code, room_number),
    FOREIGN KEY (unit_code) REFERENCES hostel_units(unit_code) ON DELETE CASCADE
);

INSERT INTO rooms (unit_code, room_number, capacity, available)
VALUES 
('24B3', '02', 10, 3),
('24B3', '03', 10, 3),
('24B3', '04', 12, 2);

DROP TABLE IF EXISTS students;
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    course VARCHAR(100),
    gender ENUM('male','female'),
    email VARCHAR(150),
    phone VARCHAR(20) DEFAULT NULL,
    room VARCHAR(20) DEFAULT NULL,
    status ENUM('pending','checked-in','checked-out') DEFAULT 'pending'
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ref_id VARCHAR(50) NOT NULL,           
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,         
    password VARCHAR(255) NOT NULL,
    role ENUM('student','finance','warden','admin','maintenance') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_student FOREIGN KEY (user_ref_id) REFERENCES students(student_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
    staff_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    CONSTRAINT fk_admin_user FOREIGN KEY (staff_id) REFERENCES users(user_ref_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS room_assignment;
CREATE TABLE room_assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    assigned_date DATE NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (unit_code, room_number) REFERENCES rooms(unit_code, room_number)
);

DROP TABLE IF EXISTS maintenance_requests;
CREATE TABLE maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ref_id VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    request_text TEXT NOT NULL,
    status ENUM('pending','in_progress','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ref_id) REFERENCES users(user_ref_id)
);

DROP TABLE IF EXISTS completed_jobs;
CREATE TABLE completed_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO completed_jobs (job_title, description)
VALUES 
('Fix Aircond', 'Aircond at Room B202 repaired successfully.'),
('Change Bulb', 'Bulb replaced at Hallway 3.'),
('Plumbing', 'Leak fixed at Block A toilet.');

DROP TABLE IF EXISTS checkin_checkout;
CREATE TABLE checkin_checkout (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    unit_code VARCHAR(20) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    checkin_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkout_date TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_code, room_number) REFERENCES rooms(unit_code, room_number)
);

SELECT * FROM students;
SELECT * FROM users;
DESCRIBE users;

ALTER TABLE users
ADD COLUMN student_id VARCHAR(20) NULL AFTER id,
ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL;

ALTER TABLE users
ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE AFTER role;

ALTER TABLE users
MODIFY user_ref_id INT NOT NULL DEFAULT 0;

ALTER TABLE users
MODIFY user_ref_id INT NOT NULL AUTO_INCREMENT;

ALTER TABLE users
MODIFY user_ref_id INT NOT NULL DEFAULT 0;
ALTER TABLE users
DROP COLUMN user_ref_id;
ALTER TABLE users 
MODIFY user_ref_id INT NULL;
ALTER TABLE users
MODIFY user_ref_id VARCHAR(20) NULL;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    gender ENUM('Male','Female') NOT NULL,
    course VARCHAR(100),
    room VARCHAR(50),
    status ENUM('pending','checked-in','checked-out') DEFAULT 'pending',
    phone VARCHAR(20)
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_ref_id VARCHAR(20) DEFAULT NULL, -- link to student if student, NULL if admin
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin') DEFAULT 'student',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ref_id) REFERENCES students(student_id) ON DELETE CASCADE
);

ALTER TABLE users
ADD COLUMN student_id VARCHAR(20) NULL;

ALTER TABLE users
ADD CONSTRAINT fk_student
FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL;

DESCRIBE users;

ALTER TABLE users ADD COLUMN staff_id VARCHAR(50);