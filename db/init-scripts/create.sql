-- Database schema for weather application

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
