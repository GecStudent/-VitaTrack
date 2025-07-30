-- VitaTrack PostgreSQL Database Backup and Restore Procedures
-- Version: 1.0.0
-- Date: 2023-07-01

-- Create backup function
CREATE OR REPLACE FUNCTION create_database_backup()
RETURNS void AS $$
DECLARE
    backup_path TEXT;
    backup_filename TEXT;
    backup_command TEXT;
BEGIN
    -- Set backup path and filename
    backup_path := '/var/lib/postgresql/backups';
    backup_filename := 'vitatrack_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS') || '.sql';
    
    -- Create backup command
    backup_command := 'pg_dump -U postgres -d vitatrack -f ' || backup_path || '/' || backup_filename;
    
    -- Execute backup command
    EXECUTE backup_command;
    
    -- Log backup
    INSERT INTO backup_log (filename, backup_path, created_at)
    VALUES (backup_filename, backup_path, now());
    
    RAISE NOTICE 'Backup created: %', backup_filename;
END;
$$ LANGUAGE plpgsql;

-- Create restore function
CREATE OR REPLACE FUNCTION restore_database_from_backup(p_backup_filename TEXT)
RETURNS void AS $$
DECLARE
    backup_path TEXT;
    restore_command TEXT;
BEGIN
    -- Set backup path
    backup_path := '/var/lib/postgresql/backups';
    
    -- Create restore command
    restore_command := 'psql -U postgres -d vitatrack -f ' || backup_path || '/' || p_backup_filename;
    
    -- Execute restore command
    EXECUTE restore_command;
    
    -- Log restore
    INSERT INTO restore_log (filename, restore_date)
    VALUES (p_backup_filename, now());
    
    RAISE NOTICE 'Database restored from backup: %', p_backup_filename;
END;
$$ LANGUAGE plpgsql;

-- Create backup log table
CREATE TABLE IF NOT EXISTS backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    backup_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT
);

-- Create restore log table
CREATE TABLE IF NOT EXISTS restore_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    restore_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT
);

-- Create scheduled backup function
CREATE OR REPLACE FUNCTION schedule_daily_backup()
RETURNS void AS $$
BEGIN
    PERFORM create_database_backup();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily backup using pg_cron (requires pg_cron extension)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', 'SELECT schedule_daily_backup()');  -- Run at midnight every day