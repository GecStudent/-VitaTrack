-- VitaTrack PostgreSQL Database Seed Data
-- Version: 1.0.0
-- Date: 2023-07-01
-- Description: Exercises seed data

-- Set search path
SET search_path TO vitatrack, public;

-- Insert exercises for Cardio category
DO $$
DECLARE
    v_cardio_id UUID;
    v_strength_id UUID;
    v_flexibility_id UUID;
    v_hiit_id UUID;
    v_yoga_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO v_cardio_id FROM exercise_categories WHERE name = 'Cardio';
    SELECT id INTO v_strength_id FROM exercise_categories WHERE name = 'Strength';
    SELECT id INTO v_flexibility_id FROM exercise_categories WHERE name = 'Flexibility';
    SELECT id INTO v_hiit_id FROM exercise_categories WHERE name = 'HIIT';
    SELECT id INTO v_yoga_id FROM exercise_categories WHERE name = 'Yoga';
    
    -- Cardio exercises
    INSERT INTO exercises (category_id, name, muscle_group, equipment, difficulty, instructions, calories_per_min, met_value) VALUES
    (v_cardio_id, 'Running', 'Legs', 'None', 'intermediate', 'Run at a steady pace on a flat surface or treadmill.', 10.0, 8.0),
    (v_cardio_id, 'Cycling', 'Legs', 'Bicycle or stationary bike', 'beginner', 'Pedal at a moderate to high intensity on a bicycle or stationary bike.', 8.5, 7.0),
    (v_cardio_id, 'Swimming', 'Full Body', 'None', 'intermediate', 'Swim laps using freestyle, breaststroke, or other swimming styles.', 9.0, 7.5),
    (v_cardio_id, 'Jumping Rope', 'Legs, Shoulders', 'Jump rope', 'beginner', 'Jump rope continuously, alternating feet or using both feet together.', 12.0, 10.0),
    (v_cardio_id, 'Rowing', 'Full Body', 'Rowing machine', 'intermediate', 'Use a rowing machine with proper form, engaging legs, core, and arms.', 9.5, 7.5);
    
    -- Strength exercises
    INSERT INTO exercises (category_id, name, muscle_group, equipment, difficulty, instructions, calories_per_min, met_value) VALUES
    (v_strength_id, 'Push-ups', 'Chest, Shoulders, Triceps', 'None', 'intermediate', 'Start in a plank position with hands shoulder-width apart. Lower your body until your chest nearly touches the floor, then push back up.', 6.0, 5.0),
    (v_strength_id, 'Squats', 'Quadriceps, Hamstrings, Glutes', 'None or barbell', 'beginner', 'Stand with feet shoulder-width apart. Lower your body by bending your knees and pushing your hips back, as if sitting in a chair. Return to standing position.', 7.0, 5.5),
    (v_strength_id, 'Deadlifts', 'Lower Back, Hamstrings, Glutes', 'Barbell or dumbbells', 'advanced', 'Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees to grip the bar, then stand up by driving through heels and extending hips and knees.', 8.0, 6.0),
    (v_strength_id, 'Pull-ups', 'Back, Biceps', 'Pull-up bar', 'advanced', 'Hang from a pull-up bar with palms facing away. Pull your body up until your chin is above the bar, then lower back down with control.', 7.5, 6.0),
    (v_strength_id, 'Lunges', 'Quadriceps, Hamstrings, Glutes', 'None or dumbbells', 'beginner', 'Step forward with one leg and lower your body until both knees are bent at 90-degree angles. Push back to starting position and repeat with the other leg.', 6.5, 5.0);
    
    -- Flexibility exercises
    INSERT INTO exercises (category_id, name, muscle_group, equipment, difficulty, instructions, calories_per_min, met_value) VALUES
    (v_flexibility_id, 'Hamstring Stretch', 'Hamstrings', 'None', 'beginner', 'Sit on the floor with one leg extended and the other bent. Reach toward your extended foot, holding for 20-30 seconds.', 2.0, 2.0),
    (v_flexibility_id, 'Shoulder Stretch', 'Shoulders', 'None', 'beginner', 'Bring one arm across your chest and use the other arm to gently pull it closer to your body. Hold for 20-30 seconds.', 2.0, 2.0),
    (v_flexibility_id, 'Hip Flexor Stretch', 'Hip Flexors', 'None', 'beginner', 'Kneel on one knee with the other foot in front. Push your hips forward until you feel a stretch in the front of your hip. Hold for 20-30 seconds.', 2.5, 2.0);
    
    -- HIIT exercises
    INSERT INTO exercises (category_id, name, muscle_group, equipment, difficulty, instructions, calories_per_min, met_value) VALUES
    (v_hiit_id, 'Burpees', 'Full Body', 'None', 'advanced', 'Start standing, then squat down and place hands on floor. Jump feet back to plank position, perform a push-up, jump feet forward, and explosively jump up with arms overhead.', 14.0, 12.0),
    (v_hiit_id, 'Mountain Climbers', 'Core, Shoulders', 'None', 'intermediate', 'Start in a plank position. Rapidly alternate bringing knees toward chest, as if running in place in a plank position.', 12.0, 10.0),
    (v_hiit_id, 'Jumping Jacks', 'Full Body', 'None', 'beginner', 'Start standing with feet together and arms at sides. Jump feet out wide while raising arms overhead, then jump back to starting position.', 10.0, 8.0);
    
    -- Yoga exercises
    INSERT INTO exercises (category_id, name, muscle_group, equipment, difficulty, instructions, calories_per_min, met_value) VALUES
    (v_yoga_id, 'Downward Dog', 'Shoulders, Hamstrings, Calves', 'Yoga mat', 'beginner', 'Start on hands and knees, then lift hips up and back to form an inverted V shape. Press heels toward the floor and relax your head between your arms.', 3.5, 3.0),
    (v_yoga_id, 'Warrior II', 'Legs, Core', 'Yoga mat', 'beginner', 'Step feet wide apart, turn one foot out 90 degrees. Bend the knee of the turned-out foot while extending arms parallel to the floor in opposite directions.', 4.0, 3.5),
    (v_yoga_id, 'Tree Pose', 'Legs, Core', 'Yoga mat', 'intermediate', 'Stand on one leg, place the sole of the other foot on the inner thigh of the standing leg. Bring hands to prayer position or extend overhead.', 3.0, 2.5);
    
END $$;