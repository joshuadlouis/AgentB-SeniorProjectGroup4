// Howard University Shuttle Schedules — real data

export interface ShuttleStop {
  name: string;
  latitude: number;
  longitude: number;
  /** Offset from first departure in minutes */
  offsetMinutes: number;
}

export interface ShuttleRoute {
  id: string;
  name: string;
  color: string;
  stops: ShuttleStop[];
  weekday: { startHour: number; endHour: number; frequencyMin: number } | null;
  weekend: { startHour: number; endHour: number; frequencyMin: number } | null;
}

// Coordinates for major stops (approximate)
const COORDS = {
  GA_HOWARD:    { lat: 38.9218, lng: -77.0208 },
  GA_FAIRMONT:  { lat: 38.9193, lng: -77.0212 },
  BOOK_STORE:   { lat: 38.9228, lng: -77.0201 },
  DREW_HALL:    { lat: 38.9240, lng: -77.0198 },
  BRYANT_4TH:   { lat: 38.9252, lng: -77.0170 },
  SHAW_METRO:   { lat: 38.9128, lng: -77.0220 },
  HU_HOSPITAL:  { lat: 38.9210, lng: -77.0230 },
  U_ST_13TH:    { lat: 38.9170, lng: -77.0289 },
  U_ST_10TH:    { lat: 38.9170, lng: -77.0256 },
  NINTH_1851:   { lat: 38.9175, lng: -77.0237 },
  TOWERS:       { lat: 38.9230, lng: -77.0266 },
  W_6TH:        { lat: 38.9220, lng: -77.0182 },
  EAST_TOWERS:  { lat: 38.9208, lng: -77.0160 },
  FLORIDA_13TH: { lat: 38.9162, lng: -77.0286 },
  COLUMBIA_14TH:{ lat: 38.9285, lng: -77.0322 },
  VAN_NESS:     { lat: 38.9435, lng: -77.0632 },
  WEST_CAMPUS:  { lat: 38.9470, lng: -77.0650 },
  HARVARD_14TH: { lat: 38.9267, lng: -77.0320 },
  CLOVER_PARK:  { lat: 38.9310, lng: -77.0098 },
  LANES_APT:    { lat: 38.9055, lng: -77.0020 },
  MAZZA:        { lat: 38.9230, lng: -77.0435 },
  N_CAPITOL_801:{ lat: 38.9075, lng: -77.0098 },
};

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: "north-campus",
    name: "North Campus",
    color: "#2563EB",
    stops: [
      { name: "Shaw Metro", ...COORDS.SHAW_METRO, offsetMinutes: 0 },
      { name: "HU Hospital", ...COORDS.HU_HOSPITAL, offsetMinutes: 4 },
      { name: "Book Store", ...COORDS.BOOK_STORE, offsetMinutes: 7 },
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 10 },
      { name: "GA @ Fairmont", ...COORDS.GA_FAIRMONT, offsetMinutes: 12 },
      { name: "Drew Hall", ...COORDS.DREW_HALL, offsetMinutes: 14 },
      { name: "4th & Bryant", ...COORDS.BRYANT_4TH, offsetMinutes: 17 },
    ],
    weekday: { startHour: 7, endHour: 22, frequencyMin: 18 },
    weekend: null,
  },
  {
    id: "south-regular",
    name: "South Campus – Regular",
    color: "#DC2626",
    stops: [
      { name: "U St Metro (13th)", ...COORDS.U_ST_13TH, offsetMinutes: 0 },
      { name: "U St Metro (10th)", ...COORDS.U_ST_10TH, offsetMinutes: 4 },
      { name: "1851 9th St", ...COORDS.NINTH_1851, offsetMinutes: 8 },
      { name: "Towers", ...COORDS.TOWERS, offsetMinutes: 14 },
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 19 },
      { name: "6th & W St", ...COORDS.W_6TH, offsetMinutes: 23 },
      { name: "East Towers", ...COORDS.EAST_TOWERS, offsetMinutes: 27 },
      { name: "13th & Florida", ...COORDS.FLORIDA_13TH, offsetMinutes: 32 },
    ],
    weekday: { startHour: 7, endHour: 23, frequencyMin: 35 },
    weekend: null,
  },
  {
    id: "south-express",
    name: "South Campus – Express",
    color: "#EA580C",
    stops: [
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 0 },
      { name: "4th & Bryant", ...COORDS.BRYANT_4TH, offsetMinutes: 4 },
      { name: "6th & W St", ...COORDS.W_6TH, offsetMinutes: 8 },
      { name: "East Towers", ...COORDS.EAST_TOWERS, offsetMinutes: 12 },
    ],
    weekday: { startHour: 7, endHour: 19, frequencyMin: 18 },
    weekend: null,
  },
  {
    id: "west-campus",
    name: "West Campus",
    color: "#7C3AED",
    stops: [
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 0 },
      { name: "East Towers", ...COORDS.EAST_TOWERS, offsetMinutes: 8 },
      { name: "14th & Columbia", ...COORDS.COLUMBIA_14TH, offsetMinutes: 18 },
      { name: "Van Ness Metro", ...COORDS.VAN_NESS, offsetMinutes: 30 },
      { name: "West Campus", ...COORDS.WEST_CAMPUS, offsetMinutes: 35 },
      { name: "14th & Harvard", ...COORDS.HARVARD_14TH, offsetMinutes: 48 },
      { name: "Towers", ...COORDS.TOWERS, offsetMinutes: 55 },
    ],
    weekday: { startHour: 7, endHour: 22, frequencyMin: 60 },
    weekend: null,
  },
  {
    id: "lanes-apt",
    name: "The Lanes APT",
    color: "#0D9488",
    stops: [
      { name: "Lanes APT", ...COORDS.LANES_APT, offsetMinutes: 0 },
      { name: "Book Store", ...COORDS.BOOK_STORE, offsetMinutes: 25 },
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 30 },
      { name: "4th & Bryant", ...COORDS.BRYANT_4TH, offsetMinutes: 33 },
    ],
    weekday: { startHour: 6, endHour: 23, frequencyMin: 60 },
    weekend: { startHour: 12, endHour: 23, frequencyMin: 60 },
  },
  {
    id: "clover-park",
    name: "Clover @ Park",
    color: "#CA8A04",
    stops: [
      { name: "Clover @ Park", ...COORDS.CLOVER_PARK, offsetMinutes: 0 },
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 30 },
    ],
    weekday: { startHour: 6, endHour: 23, frequencyMin: 60 },
    weekend: { startHour: 12, endHour: 23, frequencyMin: 60 },
  },
  {
    id: "mazza-801",
    name: "Mazza / 801 N Capitol",
    color: "#DB2777",
    stops: [
      { name: "GA @ Howard", ...COORDS.GA_HOWARD, offsetMinutes: 0 },
      { name: "GA @ Fairmont", ...COORDS.GA_FAIRMONT, offsetMinutes: 4 },
      { name: "4th & Bryant", ...COORDS.BRYANT_4TH, offsetMinutes: 10 },
      { name: "801 N Capitol", ...COORDS.N_CAPITOL_801, offsetMinutes: 20 },
      { name: "Mazza", ...COORDS.MAZZA, offsetMinutes: 40 },
    ],
    weekday: { startHour: 7, endHour: 21, frequencyMin: 20 },
    weekend: null,
  },
];

// ── Helpers ──────────────────────────────────────────

/** Is today a weekday? */
export function isWeekday(date = new Date()): boolean {
  const d = date.getDay();
  return d >= 1 && d <= 5;
}

export type RouteStatus = "active" | "inactive" | "weekend-no-service" | "after-hours";

/** Check the current operating status of a route. */
export function getRouteStatus(route: ShuttleRoute, now = new Date()): RouteStatus {
  const weekday = isWeekday(now);
  const schedule = weekday ? route.weekday : route.weekend;

  if (!schedule) return weekday ? "inactive" : "weekend-no-service";

  const hour = now.getHours();
  if (hour < schedule.startHour || hour >= schedule.endHour) return "after-hours";
  return "active";
}

/** Get the next departure times for the first stop. Returns up to `count` times. */
export function getNextDepartures(route: ShuttleRoute, count = 5, now = new Date()): Date[] {
  const weekday = isWeekday(now);
  const schedule = weekday ? route.weekday : route.weekend;
  if (!schedule) return [];

  const departures: Date[] = [];
  const todayStart = new Date(now);
  todayStart.setHours(schedule.startHour, 0, 0, 0);

  // Generate all departures for today
  let t = new Date(todayStart);
  const endTime = new Date(now);
  endTime.setHours(schedule.endHour, 0, 0, 0);

  while (t < endTime) {
    if (t >= now) departures.push(new Date(t));
    if (departures.length >= count) break;
    t = new Date(t.getTime() + schedule.frequencyMin * 60000);
  }

  return departures;
}

/** Build full schedule for a stop (all departure times today). */
export function getStopSchedule(
  route: ShuttleRoute,
  stopIndex: number,
  now = new Date()
): Date[] {
  const weekday = isWeekday(now);
  const schedule = weekday ? route.weekday : route.weekend;
  if (!schedule) return [];

  const stop = route.stops[stopIndex];
  if (!stop) return [];

  const times: Date[] = [];
  const todayStart = new Date(now);
  todayStart.setHours(schedule.startHour, 0, 0, 0);
  const endTime = new Date(now);
  endTime.setHours(schedule.endHour, 0, 0, 0);

  let t = new Date(todayStart.getTime() + stop.offsetMinutes * 60000);
  while (t < endTime) {
    times.push(new Date(t));
    t = new Date(t.getTime() + schedule.frequencyMin * 60000);
  }
  return times;
}

/** Minutes until next shuttle at the first stop, or null if not running. */
export function minutesUntilNext(route: ShuttleRoute, now = new Date()): number | null {
  const deps = getNextDepartures(route, 1, now);
  if (deps.length === 0) return null;
  return Math.round((deps[0].getTime() - now.getTime()) / 60000);
}
