# Australian Weather Explorer

An interactive visualization tool that allows users to compare temperatures and rainfall at selected locations in Australia, at different times of the year, and across multiple years.

## Features

- Interactive Australian map with selectable locations
- Temperature comparison charts (daily and monthly views)
- Rainfall comparison charts (daily and monthly views)
- Historical data comparison for up to 3 locations
- Adjustable date ranges for viewing historical trends
- Responsive design for desktop and mobile

## Data Source

This application uses weather data from the Australian Bureau of Meteorology (BOM) via the Open-Meteo API.

## Technologies Used

- React 19
- Recharts for data visualization
- Leaflet for interactive maps
- React Query for data fetching
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start the development server:
   ```
   pnpm run dev
   ```
4. Open your browser to `http://localhost:5173`

## Usage

1. Select locations on the map (up to 3)
2. Adjust the date range using the date picker
3. Toggle between temperature and rainfall views
4. Switch between daily and monthly data aggregation

## License

This project is open source and available under the MIT License.
