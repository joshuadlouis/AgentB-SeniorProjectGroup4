// Howard University Shuttle Schedules — real addresses & coordinates

export interface ShuttleStop {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Offset from first departure in minutes */
  offsetMinutes: number;
  /** Major stops get a distinct marker */
  isMajor: boolean;
}

export interface ShuttleRoute {
  id: string;
  name: string;
  color: string;
  stops: ShuttleStop[];
  weekday: { startHour: number; endHour: number; frequencyMin: number } | null;
  weekend: { startHour: number; endHour: number; frequencyMin: number } | null;
}

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: "north-campus",
    name: "North Campus",
    color: "#003A70",
    stops: [
      { name: "Shaw-Howard Metro", address: "1701 7th St NW, Washington, DC", lat: 38.9128, lng: -77.0220, offsetMinutes: 0, isMajor: true },
      { name: "HU Hospital", address: "2041 Georgia Ave NW, Washington, DC", lat: 38.9210, lng: -77.0230, offsetMinutes: 4, isMajor: false },
      { name: "Book Store", address: "2201 Georgia Ave NW, Washington, DC", lat: 38.9228, lng: -77.0201, offsetMinutes: 7, isMajor: true },
      { name: "Georgia & Howard Pl", address: "Georgia Ave & Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0208, offsetMinutes: 10, isMajor: false },
      { name: "Georgia & Fairmont", address: "Georgia Ave & Fairmont St NW, Washington, DC", lat: 38.9193, lng: -77.0212, offsetMinutes: 12, isMajor: false },
      { name: "Drew Hall", address: "511 Gresham Pl NW, Washington, DC 20059", lat: 38.9240, lng: -77.0198, offsetMinutes: 14, isMajor: false },
      { name: "4th & Bryant", address: "4th St & Bryant St NW, Washington, DC", lat: 38.9252, lng: -77.0170, offsetMinutes: 17, isMajor: false },
    ],
    weekday: { startHour: 7, endHour: 22, frequencyMin: 18 },
    weekend: null,
  },
  {
    id: "south-express",
    name: "South Campus Express",
    color: "#E51937",
    stops: [
      { name: "Georgia & Howard", address: "Georgia Ave & Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0208, offsetMinutes: 0, isMajor: false },
      { name: "4th & Bryant", address: "4th St & Bryant St NW, Washington, DC", lat: 38.9252, lng: -77.0170, offsetMinutes: 4, isMajor: false },
      { name: "6th & W St", address: "6th St & W St NW, Washington, DC", lat: 38.9220, lng: -77.0182, offsetMinutes: 8, isMajor: false },
      { name: "East Towers", address: "2251 Sherman Ave NW, Washington, DC", lat: 38.9230, lng: -77.0266, offsetMinutes: 12, isMajor: false },
    ],
    weekday: { startHour: 7, endHour: 19, frequencyMin: 18 },
    weekend: null,
  },
  {
    id: "west-campus",
    name: "West Campus",
    color: "#4A4A4A",
    stops: [
      { name: "6th & Howard Pl", address: "6th St and Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0190, offsetMinutes: 0, isMajor: false },
      { name: "East Towers", address: "2251 Sherman Ave NW, Washington, DC", lat: 38.9230, lng: -77.0266, offsetMinutes: 8, isMajor: false },
      { name: "14th & Columbia Rd", address: "14th St and Columbia Rd NW, Washington, DC", lat: 38.9285, lng: -77.0322, offsetMinutes: 18, isMajor: false },
      { name: "Van Ness Metro", address: "4200 Connecticut Ave NW, Washington, DC", lat: 38.9435, lng: -77.0632, offsetMinutes: 30, isMajor: true },
      { name: "West Campus", address: "2900 Van Ness St NW, Washington, DC", lat: 38.9470, lng: -77.0650, offsetMinutes: 35, isMajor: true },
      { name: "14th & Harvard St", address: "14th St and Harvard St NW, Washington, DC", lat: 38.9267, lng: -77.0320, offsetMinutes: 48, isMajor: false },
    ],
    weekday: { startHour: 7, endHour: 22, frequencyMin: 60 },
    weekend: null,
  },
  {
    id: "clover-park",
    name: "Clover at The Parks",
    color: "#2E7D32",
    stops: [
      { name: "Georgia & Howard Pl", address: "Georgia Ave & Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0208, offsetMinutes: 0, isMajor: false },
      { name: "Clover at The Parks", address: "1155 Dahlia St NW, Washington, DC 20012", lat: 38.9590, lng: -77.0278, offsetMinutes: 30, isMajor: true },
    ],
    weekday: { startHour: 6, endHour: 23, frequencyMin: 60 },
    weekend: { startHour: 12, endHour: 23, frequencyMin: 60 },
  },
  {
    id: "lanes-apt",
    name: "The Lanes APT",
    color: "#7B1FA2",
    stops: [
      { name: "The Lanes APT", address: "400 Florida Ave NE, Washington, DC 20002", lat: 38.9055, lng: -77.0020, offsetMinutes: 0, isMajor: true },
      { name: "Book Store", address: "2205 Georgia Ave NW, Washington, DC 20059", lat: 38.9228, lng: -77.0201, offsetMinutes: 25, isMajor: true },
      { name: "6th & Howard Pl", address: "6th St NW & Howard Pl NW, Washington, DC 20059", lat: 38.9218, lng: -77.0190, offsetMinutes: 28, isMajor: false },
      { name: "4th & Bryant", address: "Bryant St NW & 4th St NW, Washington, DC 20001", lat: 38.9252, lng: -77.0170, offsetMinutes: 33, isMajor: false },
    ],
    weekday: { startHour: 6, endHour: 23, frequencyMin: 60 },
    weekend: { startHour: 12, endHour: 23, frequencyMin: 60 },
  },
  {
    id: "mazza-801",
    name: "Mazza / 801 N Capitol",
    color: "#FF9800",
    stops: [
      { name: "Mazza GrandMarc", address: "9530 Baltimore Ave, College Park, MD 20740", lat: 38.9960, lng: -76.9370, offsetMinutes: 0, isMajor: true },
      { name: "801 N Capitol", address: "801 N Capitol St NE, Washington, DC 20002", lat: 38.9075, lng: -77.0098, offsetMinutes: 40, isMajor: true },
    ],
    weekday: { startHour: 7, endHour: 21, frequencyMin: 20 },
    weekend: null,
  },
];

// ── Helpers ──────────────────────────────────────────

export function isWeekday(date = new Date()): boolean {
  const d = date.getDay();
  return d >= 1 && d <= 5;
}

export type RouteStatus = "active" | "inactive" | "weekend-no-service" | "after-hours";

export function getRouteStatus(route: ShuttleRoute, now = new Date()): RouteStatus {
  const weekday = isWeekday(now);
  const schedule = weekday ? route.weekday : route.weekend;
  if (!schedule) return weekday ? "inactive" : "weekend-no-service";
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < schedule.startHour || hour >= schedule.endHour) return "after-hours";
  return "active";
}

export function getNextDepartures(route: ShuttleRoute, count = 5, now = new Date()): Date[] {
  const weekday = isWeekday(now);
  const schedule = weekday ? route.weekday : route.weekend;
  if (!schedule) return [];
  const departures: Date[] = [];
  const todayStart = new Date(now);
  todayStart.setHours(schedule.startHour, 0, 0, 0);
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

export function getStopSchedule(route: ShuttleRoute, stopIndex: number, now = new Date()): Date[] {
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

export function minutesUntilNext(route: ShuttleRoute, now = new Date()): number | null {
  const deps = getNextDepartures(route, 1, now);
  if (deps.length === 0) return null;
  return Math.round((deps[0].getTime() - now.getTime()) / 60000);
}
