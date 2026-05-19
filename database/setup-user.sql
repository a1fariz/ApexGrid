-- ============================================================
-- APEXGRID — DATABASE USER SETUP
-- Run this as postgres superuser before starting the application
-- ============================================================

-- Create the apex user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apex') THEN
        CREATE USER apex WITH PASSWORD 'apex123';
        RAISE NOTICE 'User apex created';
    ELSE
        RAISE NOTICE 'User apex already exists';
    END IF;
END $$;

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE apexgrid_db TO apex;

-- Grant schema privileges (needed for JPA)
\c apexgrid_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO apex;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO apex;
GRANT ALL PRIVILEGES ON SCHEMA public TO apex;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO apex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO apex;

\echo 'User setup complete!'
