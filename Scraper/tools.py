# Code written by Maddy Prazeus 31494978
# Last modified 03/03/2025

import json
import os
import requests

data = {

}

# this code will take the stations list from http://www.bom.gov.au/climate/data/lists_by_element/stations.txt
# and format it into a json object

with open("stations_updated.txt") as file:
    lines = file.readlines()

    # hard coded indexes are to avoid padded text (column names and copyright)
    for line in lines[4:-6]:
        # split on all empty space
        dataSplit = [x.strip() for x in line.split()]
        #print(dataSplit)

        # extract the names of each site and group them into one string, we use isdigit
        # to work out if we have reached the start year column
        i = 2
        while not(dataSplit[i].isdigit() and len(dataSplit[i]) == 4):
            i += 1

        name = " ".join(dataSplit[2:i])


        stationNum = dataSplit[0]
        district = dataSplit[1]
        start = dataSplit[i]
        end = dataSplit[i + 1] if dataSplit[i + 1] != ".." else None
        lat = dataSplit[i + 2]
        lon = dataSplit[i + 3]
        source = dataSplit[i + 4] if dataSplit[i + 4] != "....." else None
        state = dataSplit[i + 5]
        height = dataSplit[i + 6] if dataSplit[i + 6] != ".." else None
        barHeight = dataSplit[i + 7] if dataSplit[i + 7] != ".." else None
        wmo = dataSplit[i + 8] if dataSplit[i + 8] != ".." else None


        data[stationNum] = {
            "district": district,
            "stationName":  name,
            "startYear": start,
            "endYear": end,
            "latitude":  lat,
            "longitude":  lon,
            "source": source,
            "state": state,
            "height": height,
            "bar height": barHeight,
            "wmo": wmo,
            "Rainfall": None,
            "Temperature": None

        }

# write python dict to json

with open("test.json", "w") as outfile:

    json.dump(data, outfile)


# example download url grabbed by scraper
url = 'http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=001006&p_c=-197022&p_nccObsCode=122&p_startYear=2025'

# change this to desired local path on your machine
path = 'C:\\Users\\Maddy\\Documents\\Maddy\\coding\\bomScraper'



def download_file(url, destination_folder=None):
    """
    Download a file with browser-like headers to bypass 403 restrictions.
    
    Args:
        url (str): Direct download URL of the file
        destination_folder (str, optional): Path to save the file
    
    Returns:
        str: Path to the downloaded file
    """
    # Headers to mimic browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': url  # Sometimes helps with access
    }
    
    destination_folder = destination_folder or os.getcwd()
    os.makedirs(destination_folder, exist_ok=True)
    
    response = requests.get(url, headers=headers, stream=True)
    response.raise_for_status()
    
    filename = response.headers.get('Content-Disposition', '').split('filename=')[-1].strip('"') or url.split('/')[-1]
    file_path = os.path.join(destination_folder, filename)
    
    with open(file_path, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)
    
    return file_path

# Example usage
# downloaded_file = download_file(url, path)