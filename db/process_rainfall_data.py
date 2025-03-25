import os
import zipfile
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime
import logging
from tqdm import tqdm
from dotenv import load_dotenv

# Set up logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rainfall_data_processing.log'),
        logging.StreamHandler()  # This will also print to console
    ]
)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    logging.info(f"Loaded .env file from {env_path}")
    # Debug: Print all relevant environment variables
    logging.info("Environment variables after loading:")
    for key in ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_HOST', 'POSTGRES_PORT']:
        logging.info(f"{key}: {os.getenv(key)}")
else:
    logging.error(f"Could not find .env file at {env_path}")

# Database connection parameters from environment variables
DB_PARAMS = {
    'dbname': os.getenv('POSTGRES_DB', 'weather_db'),
    'user': os.getenv('POSTGRES_USER', 'postgres'),
    'password': os.getenv('POSTGRES_PASSWORD', 'postgres'),
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432')  # Make sure this matches the mapped port
}

# Log the connection parameters (excluding password)
logging.info("Database connection parameters:")
safe_params = {k: v for k, v in DB_PARAMS.items() if k != 'password'}
logging.info(str(safe_params))

def connect_to_db():
    """Create a database connection"""
    try:
        logging.info("Attempting to connect to database...")
        conn = psycopg2.connect(**DB_PARAMS)
        logging.info("Successfully connected to database")
        return conn
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        raise

def process_daily_data(df, station_id):
    """Process daily rainfall data and return it in the correct format"""
    # Ensure date is in datetime format
    df['date'] = pd.to_datetime(df['date'])
    
    # Rename columns to match database schema if necessary
    df = df.rename(columns={'rainfall_mm': 'rainfall'})
    
    # Add station_id column
    df['station_id'] = station_id
    
    return df[['station_id', 'date', 'rainfall']]

def calculate_monthly_data(daily_data):
    """Calculate monthly aggregates from daily data"""
    monthly = daily_data.groupby([
        'station_id',
        daily_data['date'].dt.year,
        daily_data['date'].dt.month
    ])['rainfall'].sum().reset_index()
    
    monthly.columns = ['station_id', 'year', 'month', 'rainfall']
    return monthly

def calculate_yearly_data(daily_data):
    """Calculate yearly aggregates from daily data"""
    yearly = daily_data.groupby([
        'station_id',
        daily_data['date'].dt.year
    ])['rainfall'].sum().reset_index()
    
    yearly.columns = ['station_id', 'year', 'rainfall']
    return yearly

def insert_data(conn, table_name, data):
    """Insert data into specified table using batch insert"""
    cursor = conn.cursor()
    
    if table_name == 'RAINFALL_DATA_DAILY':
        query = """
        INSERT INTO RAINFALL_DATA_DAILY (station_id, date, rainfall)
        VALUES (%s, %s, %s)
        ON CONFLICT (station_id, date) DO UPDATE
        SET rainfall = EXCLUDED.rainfall
        """
        data_tuples = [(row['station_id'], row['date'], row['rainfall']) 
                       for _, row in data.iterrows()]
    
    elif table_name == 'RAINFALL_DATA_MONTHLY':
        query = """
        INSERT INTO RAINFALL_DATA_MONTHLY (station_id, year, month, rainfall)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (station_id, month, year) DO UPDATE
        SET rainfall = EXCLUDED.rainfall
        """
        data_tuples = [(row['station_id'], row['year'], row['month'], row['rainfall'])
                       for _, row in data.iterrows()]
    
    else:  # RAINFALL_DATA_YEARLY
        query = """
        INSERT INTO RAINFALL_DATA_YEARLY (station_id, year, rainfall)
        VALUES (%s, %s, %s)
        ON CONFLICT (station_id, year) DO UPDATE
        SET rainfall = EXCLUDED.rainfall
        """
        data_tuples = [(row['station_id'], row['year'], row['rainfall'])
                       for _, row in data.iterrows()]
    
    try:
        execute_batch(cursor, query, data_tuples, page_size=1000)
        conn.commit()
    except Exception as e:
        conn.rollback()
        logging.error(f"Error inserting data into {table_name}: {e}")
        raise
    finally:
        cursor.close()

def process_zip_file(zip_path, conn):
    """Process a single zip file containing rainfall data"""
    station_id = os.path.basename(zip_path).split('_')[0]
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Assuming there's only one CSV file in the zip
            csv_filename = [f for f in zip_ref.namelist() if f.endswith('.csv')][0]
            
            # Read the CSV file directly from the zip
            with zip_ref.open(csv_filename) as csv_file:
                df = pd.read_csv(csv_file)
                
                # Process daily data
                daily_data = process_daily_data(df, station_id)
                insert_data(conn, 'RAINFALL_DATA_DAILY', daily_data)
                
                # Calculate and insert monthly aggregates
                monthly_data = calculate_monthly_data(daily_data)
                insert_data(conn, 'RAINFALL_DATA_MONTHLY', monthly_data)
                
                # Calculate and insert yearly aggregates
                yearly_data = calculate_yearly_data(daily_data)
                insert_data(conn, 'RAINFALL_DATA_YEARLY', yearly_data)
                
                logging.info(f"Successfully processed data for station {station_id}")
                
    except Exception as e:
        logging.error(f"Error processing zip file {zip_path}: {e}")
        raise

def main():
    """Main function to process all rainfall data"""
    # Set up directory paths relative to the db folder
    data_dir = os.path.join('data', 'rainfall')
    processed_dir = os.path.join('data', 'processed', 'rainfall')
    
    # Create processed directory if it doesn't exist
    os.makedirs(processed_dir, exist_ok=True)
    
    # Connect to the database
    conn = connect_to_db()
    
    try:
        # Get list of all zip files
        zip_files = [f for f in os.listdir(data_dir) if f.endswith('_rainfall.zip')]
        
        # Process each zip file
        for zip_file in tqdm(zip_files, desc="Processing rainfall data"):
            zip_path = os.path.join(data_dir, zip_file)
            try:
                process_zip_file(zip_path, conn)
                
                # Move processed file to processed directory
                os.rename(zip_path, os.path.join(processed_dir, zip_file))
                
            except Exception as e:
                logging.error(f"Failed to process {zip_file}: {e}")
                continue
                
    finally:
        conn.close()

if __name__ == "__main__":
    # Change working directory to the script's location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main() 