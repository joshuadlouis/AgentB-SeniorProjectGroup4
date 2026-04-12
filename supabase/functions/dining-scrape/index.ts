const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRAPHQL_URL =
  "https://api.elevate-dxp.com/api/mesh/c087f756-cc72-4649-a36f-3a41b700c519/graphql";

const HEADERS: Record<string, string> = {
  store: "ch_howard_en",
  "magento-store-code": "ch_howard",
  "magento-website-code": "ch_howard",
  "magento-store-view-code": "ch_howard_en",
  "magento-customer-group":
    "b6589fc6ab0dc82cf12099d1c2d40ab994e8410c",
  "x-api-key": "ElevateAPIProd",
  "aem-elevate-clientpath": "ch/howard/en",
  accept: "application/graphql-response+json,application/json",
  "content-type": "application/json",
};

const QUERY = `{
  getAllStoreLocations {
    commerceAttributes { name url_key latitude longitude address_line_1 }
    aemAttributes {
      name
      description { plaintext }
      hoursOfOperation { schedule }
      teaserAssetRef { ... on AEM_ImageRef { _publishUrl _dynamicUrl } }
    }
  }
}`;

// ─── In-memory cache (24 h) ───────────────────────────────
let cache: { data: unknown; ts: number } | null = null;
const TTL = 24 * 60 * 60 * 1000;

// ─── Opening-hours parser ─────────────────────────────────
const DAY_MAP: Record<string, number> = {
  Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
};

interface TimeRange { open: string; close: string }

function parseOpeningHours(raw: string, dayOfWeek: number): TimeRange | null {
  if (!raw || !raw.trim()) return null;
  const segments = raw.split(";").map((s) => s.trim());
  for (const seg of segments) {
    if (seg.toLowerCase().includes("off")) {
      // check if this "off" applies to our day
      const dayPart = seg.split(/\s+/)[0];
      if (dayMatchesRange(dayPart, dayOfWeek)) return null;
      continue;
    }
    const parts = seg.split(/\s+/);
    if (parts.length < 2) continue;
    const dayPart = parts[0];
    const timePart = parts[1];
    if (dayMatchesRange(dayPart, dayOfWeek)) {
      const [open, close] = timePart.split("-");
      if (open && close) return { open, close };
    }
  }
  return null;
}

function dayMatchesRange(dayRange: string, dayOfWeek: number): boolean {
  if (dayRange.includes("-")) {
    const [startStr, endStr] = dayRange.split("-");
    const start = DAY_MAP[startStr];
    const end = DAY_MAP[endStr];
    if (start === undefined || end === undefined) return false;
    if (start <= end) return dayOfWeek >= start && dayOfWeek <= end;
    return dayOfWeek >= start || dayOfWeek <= end;
  }
  return DAY_MAP[dayRange] === dayOfWeek;
}

function isCurrentlyOpen(range: TimeRange, nowMinutes: number): boolean {
  const [oh, om] = range.open.split(":").map(Number);
  const [ch, cm] = range.close.split(":").map(Number);
  return nowMinutes >= oh * 60 + om && nowMinutes < ch * 60 + cm;
}

// ─── Build response ───────────────────────────────────────
interface Location {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  todayHours: string;
  isOpen: boolean;
  mealPeriods: { name: string; hours: string }[];
}

function buildLocations(raw: any[]): Location[] {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const dayOfWeek = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return raw.map((loc) => {
    const c = loc.commerceAttributes;
    const a = loc.aemAttributes;
    const schedules = a?.hoursOfOperation?.schedule ?? [];
    const standard = schedules.find((s: any) => s.type === "standard");
    const mealPeriods: { name: string; hours: string }[] = [];
    let isOpen = false;
    const todayRanges: string[] = [];

    if (standard) {
      for (const mp of standard.meal_periods) {
        const hrs = mp.opening_hours?.trim();
        if (!hrs) continue;
        // Skip entries that are just "off" for every day
        const allOff = hrs.split(";").every((s: string) =>
          s.trim().toLowerCase().includes("off") || !s.trim()
        );
        if (allOff) continue;
        // Only include "All Day" or specific meal periods with real times
        const range = parseOpeningHours(hrs, dayOfWeek);
        if (range) {
          todayRanges.push(`${range.open}–${range.close}`);
          if (isCurrentlyOpen(range, nowMinutes)) isOpen = true;
        }
        // Only add meal periods that have actual time data somewhere
        if (hrs.match(/\d{2}:\d{2}/)) {
          mealPeriods.push({ name: mp.meal_period, hours: hrs });
        }
      }
    }

    const imgRef = a?.teaserAssetRef;
    const dynamicUrl = imgRef?._dynamicUrl;
    const imageUrl = dynamicUrl
      ? `https://images.elevate-dxp.com${dynamicUrl}?width=600&quality=75&format=webply`
      : imgRef?._publishUrl ?? "";

    return {
      name: a?.name ?? c?.name ?? "Unknown",
      address: c?.address_line_1 ?? "",
      latitude: parseFloat(c?.latitude ?? "0"),
      longitude: parseFloat(c?.longitude ?? "0"),
      description: a?.description?.plaintext ?? "",
      imageUrl,
      todayHours: todayRanges.length > 0 ? todayRanges.join(", ") : "Closed today",
      isOpen,
      mealPeriods,
    };
  });
}

// ─── Handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(GRAPHQL_URL);
    url.searchParams.set("query", QUERY);
    url.searchParams.set("variables", "{}");

    const resp = await fetch(url.toString(), { method: "GET", headers: HEADERS });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`GraphQL request failed [${resp.status}]: ${body}`);
    }

    const json = await resp.json();
    const rawLocations = json?.data?.getAllStoreLocations ?? [];
    const locations = buildLocations(rawLocations);

    const payload = { locations, fetchedAt: new Date().toISOString() };
    cache = { data: payload, ts: Date.now() };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("dining-scrape error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
