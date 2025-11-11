#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Grant superuser privileges to vsttour user
    ALTER USER vsttour WITH SUPERUSER CREATEDB CREATEROLE;

    -- Grant all privileges on database
    GRANT ALL PRIVILEGES ON DATABASE vsttour_db TO vsttour;

    -- Grant all privileges on schema public
    GRANT ALL ON SCHEMA public TO vsttour;
    ALTER SCHEMA public OWNER TO vsttour;

    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vsttour;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vsttour;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO vsttour;

    -- Ensure public schema is properly configured
    GRANT USAGE, CREATE ON SCHEMA public TO vsttour;
EOSQL

echo "PostgreSQL initialization completed successfully!"
