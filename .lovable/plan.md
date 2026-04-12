

## Plan: Tab-Based Map/List Sync with Mutual Exclusivity

### Problem
Currently, shuttle route polylines and markers are always drawn on the map regardless of the active tab. Metro lines also linger when switching back to shuttles. The two categories need strict mutual exclusivity.

### Changes

**1. `TransitMap.tsx` — Add `activeTab` prop for layer control**
- Add `activeTab: 'shuttles' | 'public-transit'` to `TransitMapProps`
- In the shuttle `drawRoutes` callback: skip drawing entirely if `activeTab !== 'shuttles'`, and clear shuttle layers
- In the metro lines effect: skip drawing if `activeTab !== 'public-transit'`, and clear metro line layers
- In the metro station effect: skip if `activeTab !== 'public-transit'`, and clear metro station layer
- Add a new effect that handles smooth map centering on tab switch:
  - `shuttles` → fly to campus bounds (Howard area, ~38.922, -77.021, zoom 14)
  - `public-transit` → fly to Howard-area metro stations (Shaw/U St area, ~38.917, -77.022, zoom 13)

**2. `TransitDashboard.tsx` — Pass `activeTab` prop**
- Pass `tab` as `activeTab` to `TransitMap`
- Remove the existing conditional logic that nulls out props per tab (the map component will handle it internally via `activeTab`)

**3. Walking ETA optimization (already handled)**
- The `filteredStations` memo in `PublicTransit.tsx` already only computes walking times for visible stations. The `PublicTransit` component only renders when the metro tab is active (via `TabsContent`), so no extra work needed.

### Summary of behavior
- Switching to "Campus Shuttles": map clears all metro polylines/markers, draws shuttle routes, centers on campus
- Switching to "Public Transit": map clears all shuttle polylines/markers, draws metro lines per preferences, centers on Shaw/U St area
- Selecting a metro color tab: only that line's polyline is shown, map zooms to fit it
- Walking ETAs only calculated for stations in the active, filtered list (already the case)

