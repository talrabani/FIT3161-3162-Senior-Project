# API Documentation

## GET /api/boundaries
### /api/boundaries/sa4
Returns all SA4 boundaries as GeoJSON
### /api/boundaries/sa4/:code
Returns a specific SA4 boundary by code
### /api/boundaries/sa4/:code/stations
Returns all stations that belong to a specific SA4 boundary.

Optional query parameter:
- date: Filter stations that have data available for the provided date (YYYY-MM-DD)
### /api/boundaries/sa4-summary
Returns a summary of how many stations are in each SA4 boundary
### /api/stations-in-rect
Returns all stations within the bounding box
- Body: { minLat, maxLat, minLng, maxLng }

## GET /api/rainfall
### /api/rainfall/station/:station_id/date/:date
Returns data for a specific station on a given date
### /api/rainfall/station/:station_id/month/:month/year/:year
Returns monthly rainfall data for a specific station on a given month, year
### /api/rainfall/station/:station_id/year/:year
Returns yearly data for a specific station on a given year
### /api/rainfall/station/:station_id/date/:start_date/end_date/:end_date
Returns daily data for a specific station for a range of dates
### /api/rainfall/aggregated/station/:station_id/frequency/:frequency/date/:start_date/end_date/:end_date
Returns average (monthly or yearly) rainfall data for a specific station for a range of dates.
### /api/rainfall/sa4/month/:month/year/:year
Returns the average rainfall for all SA4 areas on a given month, year
### /api/rainfall/sa4/year/:year
Returns the average for all SA4 areas on a given year by averaging the monthly averages by year

## POST /api/auth
### /api/auth/signup
Creates a user in the database using username, email, and password
### /api/auth/login
Uses JWT to login to user
## GET /api/auth
### /api/auth/user
Get user information
### /api/auth/user/preferences
Update user preferences

## GET /api/stations
### /api/stations/search
Search for stations by name, id, or state
- query: The search term
### /api/stations/:id
Get details for a specific station by ID