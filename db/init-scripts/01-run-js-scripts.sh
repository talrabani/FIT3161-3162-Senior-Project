#!/bin/bash
set -e

echo "Running JavaScript initialization scripts..."

# Ensure environment variables are available
export PGHOST=${PGHOST:-127.0.0.1}
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-weather_db}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-postgres}

# Also use the POSTGRES_* variables if they exist
export POSTGRES_HOST=${POSTGRES_HOST:-127.0.0.1}
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

echo "Processing station data..."
cd /docker-entrypoint-initdb.d
node 02-process-stations.js

echo "Processing rainfall data..."
node 03-process-rainfall-csv.js

echo "JavaScript initialization scripts completed successfully" 