import os
import zipfile
import logging
from tqdm import tqdm

# Set up logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/zip_extract.log'),
        logging.StreamHandler()
    ]
)

def extract_zip_files(zip_dir, extract_dir):
    
    # Create extraction directory if it doesn't exist
    os.makedirs(extract_dir, exist_ok=True)
    
    # Get list of all zip files
    zip_files = [f for f in os.listdir(zip_dir) if f.endswith('.zip')]
    
    # Process each zip file
    for zip_file in tqdm(zip_files, desc="Extracting zip files"):
        zip_path = os.path.join(zip_dir, zip_file)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Extract all files directly to the extraction directory
                zip_ref.extractall(extract_dir)
                logging.info(f"Successfully extracted {zip_file} to {extract_dir}")
                
                
        except Exception as e:
            logging.error(f"Error extracting {zip_file}: {e}")
            continue

if __name__ == "__main__":
    # Change working directory to the script's location
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    """Extract all zip files in the data/rainfall_zips directory"""
    # Set up directory paths
    zip_dir = os.path.join('data', 'rainfall_zips')
    extract_dir = os.path.join('data', 'extracted', 'rainfall')
    extract_zip_files(zip_dir, extract_dir)


    """Extract all zip files in the data/max_temp_zips directory"""
    # Set up directory paths
    zip_dir = os.path.join('data', 'max_temp_zips')
    extract_dir = os.path.join('data', 'extracted', 'max_temp')
    extract_zip_files(zip_dir, extract_dir)


    """Extract all zip files in the data/min_temp_zips directory"""
    # Set up directory paths
    zip_dir = os.path.join('data', 'min_temp_zips')
    extract_dir = os.path.join('data', 'extracted', 'min_temp')
    extract_zip_files(zip_dir, extract_dir)