#!/bin/bash
set -e

echo "Running post-initialization scripts..."

# Ensure environment variables are available
export PGHOST=${PGHOST:-localhost}
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-weather_db}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-postgres}

# Also use the POSTGRES_* variables if they exist
export POSTGRES_HOST=${POSTGRES_HOST:-localhost}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}
export POSTGRES_DB=${POSTGRES_DB:-weather_db}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

echo "Database connection parameters:"
echo "Host: $PGHOST / $POSTGRES_HOST"
echo "Port: $PGPORT / $POSTGRES_PORT"
echo "Database: $PGDATABASE / $POSTGRES_DB"
echo "User: $PGUSER / $POSTGRES_USER"

# Wait for PostgreSQL to be fully ready
echo "Verifying PostgreSQL connection..."
maxRetries=30
retryCount=0
while ! psql -c "SELECT 1" > /dev/null 2>&1; do
    retryCount=$((retryCount+1))
    if [ $retryCount -ge $maxRetries ]; then
        echo "Error: Maximum retry attempts ($maxRetries) reached. PostgreSQL is still not ready."
        exit 1
    fi
    echo "PostgreSQL is not ready yet... waiting 1 second (attempt $retryCount/$maxRetries)"
    sleep 1
done
echo "PostgreSQL is ready and accepting connections!"

# # Always create the SQL schema to ensure all tables exist
# echo "Creating or updating database schema..."
# psql -f /docker-entrypoint-initdb.d/00-create.sql

# Go to the init-scripts directory
cd /docker-entrypoint-initdb.d

# Process station data
echo "Processing station data..."
node 02-process-stations.js

# echo "Processing rainfall data..."
# node 03-process-rainfall-csv.js

# Import SA4 boundary data 
echo "Importing SA4 boundary data..."
node 04-import-sa4-data.js

echo "Post-initialization scripts completed successfully"

# Keep the script running so the container doesn't exit
echo "Initialization complete. PostgreSQL is now running."
tail -f /dev/null 