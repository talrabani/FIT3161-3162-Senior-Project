import os
import zipfile
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime
import logging
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='rainfall_data_processing.log'
)

# Database connection parameters
DB_PARAMS = {
    'dbname': 'weather_db',
    'user': 'postgres',
    'password': 'postgres',  # Change this to your actual password
    'host': 'localhost',
    'port': '5432'
}

def connect_to_db():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
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
    main() 