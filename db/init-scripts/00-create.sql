-- Database schema for weather application

-- Create the PostGIS extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS postgis;

-- USER table
DROP TABLE IF EXISTS "USER" CASCADE;
CREATE TABLE IF NOT EXISTS "USER" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- Stores encrypted password
    email VARCHAR(100) NOT NULL UNIQUE,
    units VARCHAR(50) NOT NULL DEFAULT 'metric' -- 'metric' or 'imperial'
);

-- GRAPH table
CREATE TABLE IF NOT EXISTS GRAPH (
    user_id INTEGER NOT NULL,
    graph_id SERIAL,
    graph_image BYTEA,
    graph_name VARCHAR(100) NOT NULL,
    graph_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, graph_id),
    FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
);

-- SA4 Boundaries table - 2021 data
CREATE TABLE IF NOT EXISTS SA4_BOUNDARIES (
    gid SERIAL PRIMARY KEY,
    sa4_code21 VARCHAR(3) UNIQUE,
    sa4_name21 VARCHAR(100),
    ste_code21 VARCHAR(1),
    ste_name21 VARCHAR(50),
    areasqkm21 NUMERIC,
    loci_uri21 VARCHAR(255),
    geometry GEOMETRY(MULTIPOLYGON, 4326)
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_sa4_boundaries_geometry ON SA4_BOUNDARIES USING GIST(geometry);

-- Add comment
COMMENT ON TABLE SA4_BOUNDARIES IS 'Statistical Areas Level 4 (SA4) boundaries from ABS ASGS Edition 3';

-- Modified STATION table to use GeoJSON for coordinates and add SA4 link
CREATE TABLE IF NOT EXISTS STATION (
    station_id INTEGER PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    station_location GEOMETRY(POINT, 4326) NOT NULL, -- Using SRID 4326 (WGS84) for GPS coordinates
    station_height DECIMAL(6,1),
    station_state CHAR(3) NOT NULL,
    station_start_year INTEGER NOT NULL,
    station_end_year INTEGER,
    sa4_code VARCHAR(3),
    FOREIGN KEY (sa4_code) REFERENCES SA4_BOUNDARIES(sa4_code21)
);

-- Create spatial index on station location
CREATE INDEX IF NOT EXISTS idx_station_location ON STATION USING GIST(station_location);

-- Add comment to explain the coordinates format
COMMENT ON COLUMN STATION.station_location IS 'Geographic coordinates in SRID 4326 (WGS84)';
COMMENT ON COLUMN STATION.sa4_code IS 'Statistical Area Level 4 code that this station belongs to';

-- RAINFALL_DATA_DAILY table
CREATE TABLE IF NOT EXISTS RAINFALL_DATA_DAILY (
    station_id INTEGER,
    date DATE,
    rainfall DECIMAL(5,1),
    max_temp DECIMAL(5,1),
    min_temp DECIMAL(5,1),
    PRIMARY KEY (station_id, date),
    FOREIGN KEY (station_id) REFERENCES STATION(station_id) ON DELETE CASCADE
);

-- Average rainfall for every SA4 area by month
CREATE TABLE IF NOT EXISTS SA4_RAINFALL_MONTHLY (
    sa4_code VARCHAR(3),
    year INTEGER,
    month INTEGER,
    rainfall DECIMAL(5,1),
    max_temp DECIMAL(5,1),
    min_temp DECIMAL(5,1),
    PRIMARY KEY (sa4_code, year, month),
    FOREIGN KEY (sa4_code) REFERENCES SA4_BOUNDARIES(sa4_code21)
);

-- Add comments to explain the data tables
COMMENT ON TABLE RAINFALL_DATA_DAILY IS 'Daily rainfall records for each station in mm';


