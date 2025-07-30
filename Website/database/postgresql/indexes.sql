-- VitaTrack PostgreSQL Database Indexes
-- Version: 1.0.0
-- Date: 2023-07-01

-- Set search path
SET search_path TO vitatrack, public;

-- User lookup indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name ON users(first_name, last_name);

-- Date-based lookup indexes
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, log_date);
CREATE INDEX idx_meal_logs_user_time ON meal_logs(user_id, meal_time);
CREATE INDEX idx_workout_logs_user_time ON workout_logs(user_id, start_time);
CREATE INDEX idx_water_logs_user_time ON water_logs(user_id, log_time);
CREATE INDEX idx_sleep_logs_user_time ON sleep_logs(user_id, sleep_start);

-- Foreign key indexes
CREATE INDEX idx_user_auth_user_id ON user_auth(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_meal_items_meal_log ON meal_items(meal_log_id);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_log_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX idx_exercises_category ON exercises(category_id);

-- Full-text search indexes
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin (name gin_trgm_ops);
CREATE INDEX idx_exercises_muscle_group_trgm ON exercises USING gin (muscle_group gin_trgm_ops);
CREATE INDEX idx_exercises_equipment_trgm ON exercises USING gin (equipment gin_trgm_ops);

-- JSONB indexes
CREATE INDEX idx_users_preferences ON users USING gin (preferences jsonb_path_ops);
CREATE INDEX idx_sleep_logs_stages ON sleep_logs USING gin (sleep_stages jsonb_path_ops);
CREATE INDEX idx_user_auth_provider_data ON user_auth USING gin (provider_data jsonb_path_ops);

-- Status and type indexes
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_type ON goals(goal_type);
CREATE INDEX idx_meal_logs_type ON meal_logs(meal_type);