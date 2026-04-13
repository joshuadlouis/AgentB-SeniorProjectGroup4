/**
 * OSRM Routing Service with localStorage caching.
 *
 * Fetches real street-level driving geometry from the public OSRM demo server.
 * Results are cached in localStorage so we only hit the API once per unique
 * set of stop coordinates. Cache is versioned — if stops change the old entry
 * is automatically replaced.
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const CACHE_PREFIX = "osrm-route-cache-v2:";

/** Simple hash of stop coords to use as a cache key */
function coordsKey(coords: [number, number][]): string {
  return coords.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|");
}

/**
 * Fetch a driving route from OSRM for the given waypoints.
 * Returns an array of [lat, lng] pairs that follow actual roads.
 *
 * OSRM expects lng,lat order in the URL but we work in lat,lng internally.
 */
export async function fetchOSRMRoute(
  stops: [number, number][]
): Promise<[number, number][]> {
  if (stops.length < 2) return stops;

  // Check localStorage cache first
  const key = CACHE_PREFIX + coordsKey(stops);
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached) as [number, number][];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupt cache
  }

  // Build OSRM URL  (lng,lat pairs separated by semicolons)
  const coordStr = stops.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
      throw new Error(`OSRM returned code: ${data.code}`);
    }

    // OSRM returns [lng, lat] — flip to [lat, lng]
    const path: [number, number][] = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    // Cache the result
    try {
      localStorage.setItem(key, JSON.stringify(path));
    } catch {
      // localStorage full — clear old OSRM caches and retry
      clearOldCache();
      try {
        localStorage.setItem(key, JSON.stringify(path));
      } catch {
        // give up caching silently
      }
    }

    return path;
  } catch (err) {
    console.warn("OSRM routing failed, will use fallback path:", err);
    return []; // empty = caller should use fallback
  }
}

/** Fetch routes for all shuttle routes in parallel */
export async function fetchAllRoutes(
  routes: { id: string; stops: { lat: number; lng: number }[] }[]
): Promise<Record<string, [number, number][]>> {
  const results: Record<string, [number, number][]> = {};

  await Promise.all(
    routes.map(async (route) => {
      const coords: [number, number][] = route.stops.map((s) => [s.lat, s.lng]);
      const path = await fetchOSRMRoute(coords);
      if (path.length > 0) {
        results[route.id] = path;
      }
    })
  );

  return results;
}

/** Remove old OSRM cache entries to free localStorage space */
function clearOldCache() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("osrm-route-cache")) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
