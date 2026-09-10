"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
  customerLocation?: { lat: number; lng: number } | null;
  workerLocation?: { lat: number; lng: number } | null;
}

export default function Map({ customerLocation, workerLocation }: MapProps) {
  console.log("DEBUG MAP: Received props:", { customerLocation, workerLocation });
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const workerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      // Initialize map
      const centerLat = customerLocation?.lat || workerLocation?.lat || 20.5937;
      const centerLng = customerLocation?.lng || workerLocation?.lng || 78.9629;
      
      leafletMapRef.current = L.map(mapRef.current).setView([centerLat, centerLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMapRef.current);
    }

    const map = leafletMapRef.current;

    // --- Customer Marker ---
    if (customerLocation) {
      if (!customerMarkerRef.current) {
        const customerIcon = L.divIcon({
          html: `<div style="background: #0F1B2A; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏠</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        customerMarkerRef.current = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
          .addTo(map)
          .bindPopup("Your Location");
      } else {
        customerMarkerRef.current.setLatLng([customerLocation.lat, customerLocation.lng]);
      }
    }

    // --- Worker Marker ---
    if (workerLocation) {
      if (!workerMarkerRef.current) {
        const workerIcon = L.divIcon({
          html: `<div style="background: #14B8A6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">👷</div>`,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        workerMarkerRef.current = L.marker([workerLocation.lat, workerLocation.lng], { icon: workerIcon })
          .addTo(map)
          .bindPopup("Worker");
      } else {
        workerMarkerRef.current.setLatLng([workerLocation.lat, workerLocation.lng]);
      }
    }

    // --- Route Line ---
    if (customerLocation && workerLocation) {
      const latlngs = [
        [customerLocation.lat, customerLocation.lng] as [number, number],
        [workerLocation.lat, workerLocation.lng] as [number, number]
      ];

      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(latlngs, {
          color: "#3B82F6",
          weight: 4,
          dashArray: "8, 8",
          opacity: 0.8
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(latlngs);
      }

      // Adjust bounds
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (workerLocation) {
      map.setView([workerLocation.lat, workerLocation.lng]);
    } else if (customerLocation) {
      map.setView([customerLocation.lat, customerLocation.lng]);
    }

  }, [customerLocation, workerLocation]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height: "300px", width: "100%", borderRadius: "8px", zIndex: 0 }} />;
}
