import * as d3 from "d3";
//  stationData[station.id] = {
//             id: station.id,
//             name: station.name,
//             color: getStationColor(station.id),
//             data: data
//           };
//         }
// 

const dateFormatter = (date, frequency) => {
    switch (frequency) {
        case 'daily': {return date.split('T')[0].split('-').reverse().join('-');}
        case 'monthly': {return date.split('-').slice(0,2).reverse().join('-');}
        case 'yearly': {return date.split('-')[0];}
        default: console.log("Invalid frequency type");
    }
}

const downloadAsCSV = (data, dataType, frequency) => {
    let csvArr = [['Date']];
    Object.values(data).forEach(station => csvArr[0].push(station['name']));
    Object.values(data).forEach(station => {
        Object.keys(station['data']).forEach(dataPoint => {
            const intId = parseInt(dataPoint)+1;
            csvArr[intId]?
                csvArr[intId].push(station['data'][dataPoint][dataType])
                : csvArr.push(
                    [dateFormatter(station['data'][dataPoint]['date'], frequency), // Get the date in frequency format
                    station['data'][dataPoint][dataType]]
                );
        })
    })
    const csvContent = "data:text/csv;charset=utf-8," + csvArr.map(e => e.join(",")).join("\n");
    var url = encodeURI(csvContent);
    // window.open(url);
    const a = document.createElement('a');
    a.setAttribute('download', `graph_data_${dataType}.csv`);
    a.setAttribute('href', url);
    a.dispatchEvent(new MouseEvent('click'));
}

/**
 * Downloads temperature range data (min and max) as a CSV file
 * @param {Object} data Station data object containing temperature data
 * @param {string} frequency Data frequency (daily, monthly, yearly)
 */
const downloadTemperatureRangeAsCSV = (data, frequency) => {
    // Create header row with station names for both min and max temperatures
    let csvArr = [['Date']];
    Object.values(data).forEach(station => {
        csvArr[0].push(`${station['name']} (Min °C)`);
        csvArr[0].push(`${station['name']} (Max °C)`);
    });
    
    // Create a map to organize data by date
    const dateMap = new Map();
    
    // Collect all unique dates across all stations
    Object.values(data).forEach(station => {
        Object.keys(station['data']).forEach(dataPoint => {
            const date = dateFormatter(station['data'][dataPoint]['date'], frequency);
            if (!dateMap.has(date)) {
                dateMap.set(date, {});
            }
        });
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
        // Convert dates to comparable format based on frequency
        if (frequency === 'yearly') {
            return parseInt(a) - parseInt(b);
        } else if (frequency === 'monthly') {
            const [monthA, yearA] = a.split('-');
            const [monthB, yearB] = b.split('-');
            return (yearA - yearB) || (monthA - monthB);
        } else {
            // Daily format: DD-MM-YYYY
            const [dayA, monthA, yearA] = a.split('-');
            const [dayB, monthB, yearB] = b.split('-');
            return (yearA - yearB) || (monthA - monthB) || (dayA - dayB);
        }
    });
    
    // For each date, add a row with min and max temps for each station
    sortedDates.forEach(date => {
        const row = [date];
        
        Object.values(data).forEach(station => {
            let minTemp = null;
            let maxTemp = null;
            
            // Find the matching data point for this date and station
            Object.keys(station['data']).forEach(dataPoint => {
                const dataDate = dateFormatter(station['data'][dataPoint]['date'], frequency);
                if (dataDate === date) {
                    minTemp = station['data'][dataPoint]['min_temp'];
                    maxTemp = station['data'][dataPoint]['max_temp'];
                }
            });
            
            // Add min and max temps to the row
            row.push(minTemp !== null ? minTemp : 'N/A');
            row.push(maxTemp !== null ? maxTemp : 'N/A');
        });
        
        csvArr.push(row);
    });
    
    // Generate and download the CSV
    const csvContent = "data:text/csv;charset=utf-8," + csvArr.map(e => e.join(",")).join("\n");
    const url = encodeURI(csvContent);
    const a = document.createElement('a');
    a.setAttribute('download', `temperature_range_data.csv`);
    a.setAttribute('href', url);
    a.dispatchEvent(new MouseEvent('click'));
}

// Turn svg object into base64 encoded string
const svgToXML = (svg) => {
    var serializer = new XMLSerializer();
    var xmlString = serializer.serializeToString(svg);
    return 'data:image/svg+xml;base64,' + btoa(xmlString);
    }

// Create canvas to draw the svg into an image
const makeCanvas = (svg) => {
    const img = new Image;
    img.setAttribute('src', svgToXML(svg));
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', svg.clientWidth);
    canvas.setAttribute('height', svg.clientHeight);
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas;
    }

// Download graph 
const downloadGraph = (fileExtension) => {
    if (!d3.select('#chart').node()) return;
    const svg = d3.select('#chart').node();
    if (fileExtension != 'svg') {
        const canvas = makeCanvas(svg);
        var url = canvas.toDataURL(`image/${fileExtension}`, 1.0);
    } else {
        var url = svgToXML(svg);
    }
    const a = document.createElement('a');
    a.setAttribute('download', `graph.${fileExtension}`);
    a.setAttribute('href', url);
    a.dispatchEvent(new MouseEvent('click'));
    }
const downloadGraphAsPNG = () => {
    downloadGraph('png');
    }
const downloadGraphAsJPEG = () => {
    downloadGraph('jpeg');
    }
const downloadGraphAsSVG = () => {
    downloadGraph('svg');
    }

export  { downloadGraphAsPNG, downloadGraphAsJPEG, downloadGraphAsSVG, downloadAsCSV, downloadTemperatureRangeAsCSV };