import { useEffect, useRef } from "react";

export default function MapPreview({ pickup, delivery }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.google || !pickup || !delivery) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: -26.2041, lng: 28.0473 } // Johannesburg
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: map
    });

    directionsService.route(
      {
        origin: pickup,
        destination: delivery,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }, [pickup, delivery]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        marginTop: "20px"
      }}
    />
  );
}

