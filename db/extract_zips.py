import os
import zipfile
import logging
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('zip_extraction.log'),
        logging.StreamHandler()
    ]
)

def extract_zip_files():
    """Extract all zip files in the data/rainfall directory"""
    # Set up directory paths
    zip_dir = os.path.join('data', 'rainfall')
    extract_dir = os.path.join('data', 'extracted', 'rainfall')
    
    # Create extraction directory if it doesn't exist
    os.makedirs(extract_dir, exist_ok=True)
    
    # Get list of all zip files
    zip_files = [f for f in os.listdir(zip_dir) if f.endswith('.zip')]
    
    # Process each zip file
    for zip_file in tqdm(zip_files, desc="Extracting zip files"):
        zip_path = os.path.join(zip_dir, zip_file)
        station_id = zip_file.split('_')[0]
        
        # Create station-specific directory
        station_dir = os.path.join(extract_dir, station_id)
        os.makedirs(station_dir, exist_ok=True)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract all files to the station directory
                zip_ref.extractall(station_dir)
                logging.info(f"Successfully extracted {zip_file} to {station_dir}")
                
                # Print the first few lines of the CSV file
                csv_files = [f for f in zip_ref.namelist() if f.endswith('.csv')]
                if csv_files:
                    with zip_ref.open(csv_files[0]) as f:
                        content = f.read().decode()
                        print(f"\nFirst few lines of {zip_file}:")
                        print(content[:500])
                        print("-" * 80)
                
        except Exception as e:
            logging.error(f"Error extracting {zip_file}: {e}")
            continue

if __name__ == "__main__":
    # Change working directory to the script's location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    extract_zip_files()
