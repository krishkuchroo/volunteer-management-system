-- Volunteer Management System - Seed Data
-- Run this AFTER schema.sql
-- Passwords are hashed versions of:
--   admin@example.com     -> Admin123!
--   coordinator@example.com -> Coord123!
--   volunteer@example.com  -> Volunteer123!
--
-- To regenerate hashes, run in Node:
--   const bcrypt = require('bcrypt');
--   bcrypt.hash('Admin123!', 10).then(console.log);

-- Clear existing seed data (safe for dev only)
DELETE FROM volunteer_hours;
DELETE FROM activity_logs;
DELETE FROM password_reset_tokens;
DELETE FROM volunteer_profiles;
DELETE FROM users WHERE email IN (
    'admin@example.com',
    'coordinator@example.com',
    'volunteer@example.com',
    'volunteer2@example.com'
);

-- Admin user
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified, is_active)
VALUES (
    'admin@example.com',
    '$2b$10$0G1NpkzsnlXMilxNU9mOR.Ex3Q5htHBzRI6nTp5aXnc8Q/AnP0dl2',
    'admin',
    'System',
    'Administrator',
    true,
    true
);

-- Coordinator user
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified, is_active)
VALUES (
    'coordinator@example.com',
    '$2b$10$Npfb6iaVT2jErudH3VCewOVZO.EeSYQWCfKHVtVVHCfb1MJwnw31e',
    'coordinator',
    'Jane',
    'Smith',
    '+12025550143',
    true,
    true
);

-- Volunteer user 1
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified, is_active)
VALUES (
    'volunteer@example.com',
    '$2b$10$4KpTB6VujHifdJHtnjmjVeECZNti4F1akmjlTod7WLdx32h7snh1G',
    'volunteer',
    'John',
    'Doe',
    '+12025550187',
    true,
    true
);

-- Volunteer user 2
INSERT INTO users (email, password_hash, role, first_name, last_name, is_verified, is_active)
VALUES (
    'volunteer2@example.com',
    '$2b$10$4KpTB6VujHifdJHtnjmjVeECZNti4F1akmjlTod7WLdx32h7snh1G',
    'volunteer',
    'Alice',
    'Johnson',
    true,
    true
);

-- Create volunteer profiles for volunteer users
INSERT INTO volunteer_profiles (user_id, skills, availability, background_check_status, hours_logged)
SELECT id, ARRAY['First Aid', 'Teaching'], 'Weekends', 'approved', 12.5
FROM users WHERE email = 'volunteer@example.com';

INSERT INTO volunteer_profiles (user_id, skills, availability, background_check_status, hours_logged)
SELECT id, ARRAY['Cooking', 'Driving'], 'Weekdays', 'pending', 0
FROM users WHERE email = 'volunteer2@example.com';

-- Add some sample hours for volunteer 1
INSERT INTO volunteer_hours (volunteer_id, date, hours, description)
SELECT vp.id, '2026-01-10', 4.0, 'Food bank sorting'
FROM volunteer_profiles vp
JOIN users u ON vp.user_id = u.id
WHERE u.email = 'volunteer@example.com';

INSERT INTO volunteer_hours (volunteer_id, date, hours, description)
SELECT vp.id, '2026-01-17', 8.5, 'Community cleanup event'
FROM volunteer_profiles vp
JOIN users u ON vp.user_id = u.id
WHERE u.email = 'volunteer@example.com';
