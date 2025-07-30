-- VitaTrack PostgreSQL Database Seed Data
-- Version: 1.0.0
-- Date: 2023-07-01
-- Description: Exercise categories seed data

-- Set search path
SET search_path TO vitatrack, public;

-- Insert exercise categories
INSERT INTO exercise_categories (name, description) VALUES
('Cardio', 'Cardiovascular exercises that increase heart rate and improve endurance'),
('Strength', 'Resistance training exercises that build muscle strength and power'),
('Flexibility', 'Exercises that improve range of motion and muscle elasticity'),
('Balance', 'Exercises that improve stability and coordination'),
('HIIT', 'High-Intensity Interval Training combining short bursts of intense exercise with recovery periods'),
('Yoga', 'Mind-body practice combining physical postures, breathing techniques, and meditation'),
('Pilates', 'Exercise system focused on improving flexibility, strength, and body awareness'),
('Calisthenics', 'Bodyweight exercises performed with minimal equipment'),
('Functional', 'Exercises that train muscles for daily activities and movements'),
('Sports', 'Athletic activities and sports-specific training');