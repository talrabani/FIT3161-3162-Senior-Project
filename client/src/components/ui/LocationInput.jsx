import { SearchBox } from "@mapbox/search-js-react";

export default function LocationInput( { location, setLocation } ) {

  return (
    <SearchBox
      options={{
        proximity: {
          lng: 133.7751,
          lat: -25.2744,
        },
      }}
      value={location}
      onRetrieve={(result) => {
        if (result.features && result.features.length > 0) {
          setLocation(result.features[0])
        }
      }}
      accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN} />
  );
}
