import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WMATA_BASE = "https://api.wmata.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("WMATA_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "WMATA_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { endpoint, params } = await req.json();

    // Whitelist allowed WMATA endpoints
    const ALLOWED = [
      "/Rail.svc/json/jStations",
      "/Rail.svc/json/jLines",
      "/StationPrediction.svc/json/GetPrediction/All",
      "/NextBusService.svc/json/jPredictions",
      "/Rail.svc/json/jStationInfo",
    ];

    // Allow dynamic station prediction paths
    const isStationPrediction = /^\/StationPrediction\.svc\/json\/GetPrediction\/[A-Z0-9,]+$/.test(endpoint);
    if (!ALLOWED.includes(endpoint) && !isStationPrediction) {
      return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(`${WMATA_BASE}${endpoint}`);
    if (params && typeof params === "object") {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const wmataRes = await fetch(url.toString(), {
      headers: { api_key: apiKey },
    });

    const data = await wmataRes.json();

    return new Response(JSON.stringify(data), {
      status: wmataRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("WMATA proxy error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
