import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShuttleRoute } from "@/data/shuttleData";

interface TransitMapProps {
  routes: ShuttleRoute[];
  selectedRouteId: string | null;
}

export const TransitMap = ({ routes, selectedRouteId }: TransitMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [38.9225, -77.0210],
      zoom: 14,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const drawStops = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.clearLayers();

    const visibleRoutes = selectedRouteId
      ? routes.filter((r) => r.id === selectedRouteId)
      : routes;

    const allPoints: [number, number][] = [];

    visibleRoutes.forEach((route) => {
      const coords: [number, number][] = route.stops.map((s) => [s.lat, s.lng]);
      allPoints.push(...coords);

      // Draw polyline connecting stops
      if (coords.length >= 2) {
        const polyline = L.polyline(coords, {
          color: route.color,
          weight: selectedRouteId === route.id ? 5 : 3,
          opacity: 0.8,
          dashArray: selectedRouteId && selectedRouteId !== route.id ? "6,8" : undefined,
        });
        layersRef.current.addLayer(polyline);
      }

      // Draw stop markers
      route.stops.forEach((stop, i) => {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:${i === 0 ? 16 : 12}px;height:${i === 0 ? 16 : 12}px;border-radius:50%;background:${route.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [i === 0 ? 16 : 12, i === 0 ? 16 : 12],
          iconAnchor: [i === 0 ? 8 : 6, i === 0 ? 8 : 6],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon });
        marker.bindPopup(
          `<div style="font-size:13px"><strong>${stop.name}</strong><br/><span style="color:#888">${route.name} · +${stop.offsetMinutes} min</span></div>`
        );
        layersRef.current.addLayer(marker);
      });
    });

    // Fit bounds
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routes, selectedRouteId]);

  useEffect(() => {
    drawStops();
  }, [drawStops]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-sm z-0"
    />
  );
};
