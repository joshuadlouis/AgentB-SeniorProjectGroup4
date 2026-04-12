import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShuttleRoute } from "@/data/shuttleData";
import { type WmataStation, lineColor } from "@/components/PublicTransit";

interface TransitMapProps {
  routes: ShuttleRoute[];
  selectedRouteId: string | null;
  metroStation?: WmataStation | null;
}

// OSRM public demo server for routing
async function fetchOSRMRoute(coords: [number, number][]): Promise<[number, number][]> {
  if (coords.length < 2) return coords;
  const coordStr = coords.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      return data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
      );
    }
  } catch (e) {
    console.warn("OSRM routing failed, falling back to straight lines", e);
  }
  return coords;
}

function createMajorIcon(color: string) {
  return L.divIcon({
    className: "major-stop-marker",
    html: `<div style="
      width:20px;height:20px;border-radius:4px;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;border-radius:50%;background:white;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createMinorIcon(color: string) {
  return L.divIcon({
    className: "minor-stop-marker",
    html: `<div style="
      width:12px;height:12px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function createMetroIcon(lineCodes: string[]) {
  const color = lineColor(lineCodes[0] || "");
  return L.divIcon({
    className: "metro-station-marker",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:8px;height:8px;border-radius:50%;background:white;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export const TransitMap = ({ routes, selectedRouteId, metroStation }: TransitMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());
  const metroLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const [routeCache, setRouteCache] = useState<Record<string, [number, number][]>>({});

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
    metroLayerRef.current.addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw shuttle routes
  const drawRoutes = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.clearLayers();

    const visibleRoutes = selectedRouteId
      ? routes.filter((r) => r.id === selectedRouteId)
      : routes;

    const allPoints: [number, number][] = [];

    for (const route of visibleRoutes) {
      const stopCoords: [number, number][] = route.stops.map((s) => [s.lat, s.lng]);
      allPoints.push(...stopCoords);

      const cacheKey = route.id;
      let routePath = routeCache[cacheKey];
      if (!routePath && stopCoords.length >= 2) {
        routePath = await fetchOSRMRoute(stopCoords);
        setRouteCache((prev) => ({ ...prev, [cacheKey]: routePath! }));
      }

      const pathCoords = routePath && routePath.length > 0 ? routePath : stopCoords;
      if (pathCoords.length >= 2) {
        const polyline = L.polyline(pathCoords, {
          color: route.color,
          weight: selectedRouteId === route.id ? 5 : 3,
          opacity: 0.85,
        });
        layersRef.current.addLayer(polyline);
      }

      route.stops.forEach((stop) => {
        const icon = stop.isMajor
          ? createMajorIcon(route.color)
          : createMinorIcon(route.color);
        const marker = L.marker([stop.lat, stop.lng], { icon });
        marker.bindPopup(
          `<div style="font-size:13px">
            <strong>${stop.name}</strong>
            ${stop.isMajor ? ' <span style="color:#003A70;font-size:10px;">★ Major</span>' : ""}
            <br/><span style="color:#888;font-size:11px">${route.name}</span>
            <br/><span style="color:#aaa;font-size:10px">${stop.address}</span>
          </div>`
        );
        layersRef.current.addLayer(marker);
      });
    }

    // Only fit bounds if no metro station is selected
    if (!metroStation && allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (selectedRouteId) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [routes, selectedRouteId, routeCache, metroStation]);

  useEffect(() => {
    drawRoutes();
  }, [drawRoutes]);

  // Draw metro station marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    metroLayerRef.current.clearLayers();

    if (metroStation) {
      const lineCodes = [
        metroStation.LineCode1,
        metroStation.LineCode2,
        metroStation.LineCode3,
        metroStation.LineCode4,
      ].filter(Boolean) as string[];

      const icon = createMetroIcon(lineCodes);
      const marker = L.marker([metroStation.Lat, metroStation.Lon], { icon });

      const lineLabels = lineCodes
        .map((lc) => `<span style="background:${lineColor(lc)};color:white;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:bold;">${lc}</span>`)
        .join(" ");

      marker.bindPopup(
        `<div style="font-size:13px">
          <strong>🚇 ${metroStation.Name}</strong>
          <br/><div style="margin-top:4px">${lineLabels}</div>
        </div>`
      ).openPopup();

      metroLayerRef.current.addLayer(marker);
      map.flyTo([metroStation.Lat, metroStation.Lon], 15, { duration: 0.8 });
    }
  }, [metroStation]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-sm z-0"
    />
  );
};
