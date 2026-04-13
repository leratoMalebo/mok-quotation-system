import { useEffect, useRef } from "react";

export default function RouteMap({ pickup, delivery }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.google || !pickup || !delivery || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg default
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      polylineOptions: { strokeColor: "#0a2a43", strokeWeight: 4 },
    });

    directionsRenderer.setMap(map);

    directionsService.route({
      origin: pickup,
      destination: delivery,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      }
    });
  }, [pickup, delivery]);

  return (
    <div style={{ marginTop: 20 }}>
      <p style={{ fontWeight: 600, color: "#0a2a43", marginBottom: 8 }}>📍 Route Preview</p>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: 350,
          borderRadius: 12,
          border: "1px solid #ddd",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
