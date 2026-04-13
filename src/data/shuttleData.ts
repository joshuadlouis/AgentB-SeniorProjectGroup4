// Howard University Shuttle Schedules — real addresses & coordinates
// Path coordinates follow actual DC streets for accurate Leaflet polylines.

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
  /** Pre-computed path coordinates for the Leaflet polyline (follows roads) */
  path: [number, number][];
  weekday: { startHour: number; endHour: number; frequencyMin: number } | null;
  weekend: { startHour: number; endHour: number; frequencyMin: number } | null;
}

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: "north-campus",
    name: "North Campus",
    color: "#003A70", // Howard Navy
    stops: [
      { name: "Shaw-Howard Metro", address: "1701 7th St NW, Washington, DC", lat: 38.9128, lng: -77.0220, offsetMinutes: 0, isMajor: true },
      { name: "HU Hospital", address: "2041 Georgia Ave NW, Washington, DC", lat: 38.9210, lng: -77.0230, offsetMinutes: 4, isMajor: false },
      { name: "Book Store", address: "2205 Georgia Ave NW, Washington, DC", lat: 38.9228, lng: -77.0201, offsetMinutes: 7, isMajor: true },
      { name: "Georgia & Howard Pl", address: "Georgia Ave & Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0208, offsetMinutes: 10, isMajor: false },
      { name: "Georgia & Fairmont", address: "Georgia Ave & Fairmont St NW, Washington, DC", lat: 38.9193, lng: -77.0212, offsetMinutes: 12, isMajor: false },
      { name: "Drew Hall", address: "511 Gresham Pl NW, Washington, DC 20059", lat: 38.9240, lng: -77.0198, offsetMinutes: 14, isMajor: false },
      { name: "4th & Bryant", address: "4th St & Bryant St NW, Washington, DC", lat: 38.9252, lng: -77.0170, offsetMinutes: 17, isMajor: false },
    ],
    path: [
      // Shaw-Howard Metro → north on 7th St
      [38.9128, -77.0220],
      [38.9140, -77.0218],
      [38.9155, -77.0216],
      [38.9170, -77.0214],
      // Turn west onto Florida Ave / U St area
      [38.9175, -77.0220],
      // North on Georgia Ave
      [38.9185, -77.0225],
      [38.9193, -77.0212], // Georgia & Fairmont
      [38.9200, -77.0218],
      [38.9210, -77.0230], // HU Hospital
      [38.9218, -77.0208], // Georgia & Howard Pl
      [38.9228, -77.0201], // Book Store
      // Continue north on campus roads
      [38.9235, -77.0200],
      [38.9240, -77.0198], // Drew Hall
      // East to 4th St
      [38.9242, -77.0190],
      [38.9245, -77.0180],
      [38.9252, -77.0170], // 4th & Bryant
    ],
    weekday: { startHour: 7, endHour: 22, frequencyMin: 18 },
    weekend: null,
  },
  {
    id: "south-express",
    name: "South Campus Express",
    color: "#E51937", // Howard Red
    stops: [
      { name: "Georgia & Howard", address: "Georgia Ave & Howard Pl NW, Washington, DC", lat: 38.9218, lng: -77.0208, offsetMinutes: 0, isMajor: false },
      { name: "4th & Bryant", address: "4th St & Bryant St NW, Washington, DC", lat: 38.9252, lng: -77.0170, offsetMinutes: 4, isMajor: false },
      { name: "6th & W St", address: "6th St & W St NW, Washington, DC", lat: 38.9175, lng: -77.0182, offsetMinutes: 8, isMajor: false },
      { name: "East Towers", address: "2251 Sherman Ave NW, Washington, DC", lat: 38.9230, lng: -77.0266, offsetMinutes: 12, isMajor: false },
    ],
    path: [
      // Georgia & Howard → east on Howard Pl
      [38.9218, -77.0208],
      [38.9220, -77.0200],
      // North on campus roads to 4th & Bryant
      [38.9230, -77.0195],
      [38.9240, -77.0185],
      [38.9252, -77.0170], // 4th & Bryant
      // South on 4th St
      [38.9240, -77.0172],
      [38.9220, -77.0175],
      // West on W St
      [38.9200, -77.0178],
      [38.9175, -77.0182], // 6th & W St
      // North-west on 9th St / Sherman Ave to East Towers
      [38.9185, -77.0200],
      [38.9195, -77.0220],
      [38.9210, -77.0240],
      [38.9220, -77.0255],
      [38.9230, -77.0266], // East Towers
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
    path: [
      // 6th & Howard Pl
      [38.9218, -77.0190],
      // West along Howard Pl / campus streets
      [38.9220, -77.0210],
      [38.9225, -77.0230],
      [38.9230, -77.0250],
      [38.9230, -77.0266], // East Towers (Sherman Ave)
      // North on Sherman Ave → 14th St
      [38.9240, -77.0275],
      [38.9250, -77.0290],
      [38.9260, -77.0305],
      [38.9270, -77.0315],
      [38.9285, -77.0322], // 14th & Columbia Rd
      // Northwest on 14th → Columbia Rd → Connecticut Ave
      [38.9295, -77.0330],
      [38.9310, -77.0360],
      [38.9330, -77.0400],
      [38.9350, -77.0440],
      [38.9370, -77.0480],
      [38.9390, -77.0520],
      [38.9410, -77.0560],
      [38.9425, -77.0600],
      [38.9435, -77.0632], // Van Ness Metro
      // West to West Campus
      [38.9445, -77.0640],
      [38.9455, -77.0645],
      [38.9470, -77.0650], // West Campus
      // Return: south on Connecticut Ave
      [38.9435, -77.0632],
      [38.9410, -77.0560],
      [38.9390, -77.0520],
      [38.9350, -77.0440],
      [38.9310, -77.0360],
      [38.9285, -77.0322],
      // South on 14th St
      [38.9267, -77.0320], // 14th & Harvard St
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
    path: [
      // Georgia & Howard Pl
      [38.9218, -77.0208],
      // North on Georgia Ave
      [38.9240, -77.0210],
      [38.9270, -77.0215],
      [38.9300, -77.0220],
      [38.9330, -77.0225],
      [38.9360, -77.0228],
      [38.9390, -77.0232],
      [38.9420, -77.0238],
      [38.9450, -77.0242],
      [38.9480, -77.0248],
      [38.9510, -77.0255],
      [38.9540, -77.0262],
      [38.9560, -77.0268],
      [38.9575, -77.0273],
      // Turn to Dahlia St
      [38.9585, -77.0276],
      [38.9590, -77.0278], // Clover at The Parks
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
    path: [
      // The Lanes APT (400 Florida Ave NE)
      [38.9055, -77.0020],
      // West on Florida Ave
      [38.9065, -77.0050],
      [38.9075, -77.0080],
      [38.9085, -77.0100],
      [38.9095, -77.0120],
      [38.9105, -77.0140],
      // Continue west on Florida Ave → U St area
      [38.9115, -77.0155],
      [38.9125, -77.0165],
      [38.9140, -77.0175],
      // North on 7th St / Georgia Ave
      [38.9160, -77.0185],
      [38.9180, -77.0195],
      [38.9200, -77.0200],
      [38.9218, -77.0205],
      [38.9228, -77.0201], // Book Store
      // East to 6th & Howard Pl
      [38.9222, -77.0195],
      [38.9218, -77.0190], // 6th & Howard Pl
      // North to 4th & Bryant
      [38.9225, -77.0188],
      [38.9235, -77.0182],
      [38.9245, -77.0176],
      [38.9252, -77.0170], // 4th & Bryant
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
    path: [
      // Mazza GrandMarc (College Park)
      [38.9960, -76.9370],
      // South on Baltimore Ave / US-1
      [38.9920, -76.9380],
      [38.9880, -76.9390],
      [38.9830, -76.9400],
      // Merge onto I-295 / BW Parkway area
      [38.9750, -76.9450],
      [38.9650, -76.9520],
      [38.9550, -76.9600],
      [38.9450, -76.9680],
      [38.9350, -76.9760],
      // Approach DC via New York Ave
      [38.9250, -76.9850],
      [38.9200, -76.9920],
      [38.9150, -76.9980],
      [38.9100, -77.0040],
      // N Capitol St
      [38.9085, -77.0070],
      [38.9075, -77.0098], // 801 N Capitol
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
