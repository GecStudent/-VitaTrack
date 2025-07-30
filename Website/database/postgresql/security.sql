-- VitaTrack PostgreSQL Database Security
-- Version: 1.0.0
-- Date: 2023-07-01

-- Set search path
SET search_path TO vitatrack, public;

-- Create application roles
CREATE ROLE vitatrack_admin;
CREATE ROLE vitatrack_app;
CREATE ROLE vitatrack_readonly;

-- Grant privileges to roles
GRANT ALL PRIVILEGES ON SCHEMA vitatrack TO vitatrack_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA vitatrack TO vitatrack_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA vitatrack TO vitatrack_admin;

GRANT USAGE ON SCHEMA vitatrack TO vitatrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vitatrack TO vitatrack_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA vitatrack TO vitatrack_app;

GRANT USAGE ON SCHEMA vitatrack TO vitatrack_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA vitatrack TO vitatrack_readonly;

-- Create application users
CREATE USER vitatrack_app_user WITH PASSWORD 'app_password_here';
CREATE USER vitatrack_readonly_user WITH PASSWORD 'readonly_password_here';

-- Assign roles to users
GRANT vitatrack_app TO vitatrack_app_user;
GRANT vitatrack_readonly TO vitatrack_readonly_user;

-- Enable Row Level Security (RLS) on all user-related tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_targets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users table policies
CREATE POLICY users_isolation_policy ON users
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- Allow admin to see all users
CREATE POLICY users_admin_policy ON users
    USING (current_setting('app.is_admin', true)::boolean = true);

-- User auth policies
CREATE POLICY user_auth_isolation_policy ON user_auth
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Weight logs policies
CREATE POLICY weight_logs_isolation_policy ON weight_logs
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Body measurements policies
CREATE POLICY body_measurements_isolation_policy ON body_measurements
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Goals policies
CREATE POLICY goals_isolation_policy ON goals
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Meal logs policies
CREATE POLICY meal_logs_isolation_policy ON meal_logs
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Meal items policies (through meal_logs)
CREATE POLICY meal_items_isolation_policy ON meal_items
    USING (meal_log_id IN (SELECT id FROM meal_logs WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Workout logs policies
CREATE POLICY workout_logs_isolation_policy ON workout_logs
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Workout exercises policies (through workout_logs)
CREATE POLICY workout_exercises_isolation_policy ON workout_exercises
    USING (workout_log_id IN (SELECT id FROM workout_logs WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- Water logs policies
CREATE POLICY water_logs_isolation_policy ON water_logs
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Sleep logs policies
CREATE POLICY sleep_logs_isolation_policy ON sleep_logs
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- User daily targets policies
CREATE POLICY user_daily_targets_isolation_policy ON user_daily_targets
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Create function to set user context
CREATE OR REPLACE FUNCTION set_user_context(p_user_id uuid, p_is_admin boolean DEFAULT false)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, false);
    PERFORM set_config('app.is_admin', p_is_admin::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;