#!/bin/bash
set -e

echo "Running JavaScript initialization scripts..."

# Ensure environment variables are available
export PGHOST=${PGHOST:-db}
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-weather_db}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-postgres}

# Also use the POSTGRES_* variables if they exist
export POSTGRES_HOST=${POSTGRES_HOST:-db}
export POSTGRES_PORT=${POSTGRES_PORT:-5432}
export POSTGRES_DB=${POSTGRES_DB:-weather_db}
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Force node to use IPv4
export NODE_OPTIONS="--dns-result-order=ipv4first"

echo "Database connection parameters:"
echo "Host: $PGHOST / $POSTGRES_HOST"
echo "Port: $PGPORT / $POSTGRES_PORT"
echo "Database: $PGDATABASE / $POSTGRES_DB"
echo "User: $PGUSER / $POSTGRES_USER"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
maxRetries=30
retryCount=0
until pg_isready -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t 1 > /dev/null 2>&1; do
    retryCount=$((retryCount+1))
    if [ $retryCount -ge $maxRetries ]; then
        echo "Error: Maximum retry attempts ($maxRetries) reached. PostgreSQL is still not ready."
        exit 1
    fi
    echo "PostgreSQL is not ready yet... waiting 1 second (attempt $retryCount/$maxRetries)"
    sleep 1
done
echo "PostgreSQL is ready!"

echo "Processing station data..."
cd /docker-entrypoint-initdb.d
node 02-process-stations.js

echo "Processing rainfall data..."
node 03-process-rainfall-csv.js

echo "JavaScript initialization scripts completed successfully" 