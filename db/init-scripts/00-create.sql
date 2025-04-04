-- Database schema for weather application

-- Create the PostGIS extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS postgis;

-- TOWN table
CREATE TABLE IF NOT EXISTS TOWN (
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    PRIMARY KEY (name, state)
);

-- USER table
CREATE TABLE IF NOT EXISTS "USER" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL  -- Stores encrypted password
);

-- USER_TOWN_BOOKMARK table
CREATE TABLE IF NOT EXISTS USER_TOWN_BOOKMARK (
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, name, state),
    FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (name, state) REFERENCES TOWN(name, state) ON DELETE CASCADE
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

-- SAVED_MAP table
CREATE TABLE IF NOT EXISTS SAVED_MAP (
    saved_map_id SERIAL PRIMARY KEY,
    map_center_location POINT NOT NULL,
    map_zoom_level INTEGER NOT NULL,
    map_show_rainfall BOOLEAN NOT NULL DEFAULT FALSE,
    map_show_temp_min BOOLEAN NOT NULL DEFAULT FALSE,
    map_show_temp_max BOOLEAN NOT NULL DEFAULT FALSE,
    map_show_average BOOLEAN NOT NULL DEFAULT FALSE,
    map_time_period CHAR(1) NOT NULL CHECK (map_time_period IN ('A', 'B', 'C')), -- A=Daily, B=Monthly, C=Yearly
    user_id INTEGER NOT NULL,
    saved_map_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
);

-- Add comments to explain the time period values
COMMENT ON COLUMN SAVED_MAP.map_time_period IS 'A=Daily, B=Monthly, C=Yearly';

-- Modified STATION table to use GeoJSON for coordinates
CREATE TABLE IF NOT EXISTS STATION (
    station_id INTEGER PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    station_location GEOMETRY(POINT, 4326) NOT NULL, -- Using SRID 4326 (WGS84) for GPS coordinates
    station_height DECIMAL(6,1),
    station_state CHAR(3) NOT NULL,
    station_start_year INTEGER NOT NULL,
    station_end_year INTEGER
);

-- Create spatial index on station location
CREATE INDEX IF NOT EXISTS idx_station_location ON STATION USING GIST(station_location);

-- Add comment to explain the coordinates format
COMMENT ON COLUMN STATION.station_location IS 'Geographic coordinates in SRID 4326 (WGS84)';

-- SA4 Boundaries table - 2021 data
CREATE TABLE IF NOT EXISTS SA4_BOUNDARIES (
    gid SERIAL PRIMARY KEY,
    sa4_code21 VARCHAR(3),
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

-- RAINFALL_DATA_DAILY table
CREATE TABLE IF NOT EXISTS RAINFALL_DATA_DAILY (
    station_id INTEGER,
    date DATE,
    rainfall DECIMAL(5,1),
    PRIMARY KEY (station_id, date),
    FOREIGN KEY (station_id) REFERENCES STATION(station_id) ON DELETE CASCADE
);

-- Add comments to explain the data tables
COMMENT ON TABLE RAINFALL_DATA_DAILY IS 'Daily rainfall records for each station in mm';


