import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { class_name } = await req.json();
    if (!class_name) throw new Error("class_name is required");

    // Fetch course content for this class
    const { data: content } = await supabase
      .from("course_content")
      .select("topic, lesson_content")
      .eq("user_id", user.id)
      .eq("class_name", class_name)
      .eq("generation_status", "complete")
      .order("topic_order", { ascending: true });

    if (!content || content.length === 0) {
      throw new Error(
        "No course content found. Generate course content first."
      );
    }

    // Build a combined text for the AI
    const courseText = content
      .map(
        (c: any) =>
          `## ${c.topic}\n${(c.lesson_content || "").slice(0, 2000)}`
      )
      .join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a study aid that creates flashcards from course material. Extract the most important terms, concepts, definitions, and key facts. Return ONLY a JSON array of objects with 'front' and 'back' keys. front = question/term, back = answer/definition. Return 15-25 cards. No markdown wrapping.",
            },
            {
              role: "user",
              content: `Create flashcards from this course content for "${class_name}":\n\n${courseText.slice(0, 8000)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_flashcards",
                description: "Create flashcard pairs from course content",
                parameters: {
                  type: "object",
                  properties: {
                    cards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          front: { type: "string" },
                          back: { type: "string" },
                        },
                        required: ["front", "back"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["cards"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_flashcards" },
          },
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429)
        return new Response(
          JSON.stringify({
            error: "Rate limited, please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      if (aiRes.status === 402)
        return new Response(
          JSON.stringify({
            error: "Credits exhausted, please add funds.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      throw new Error("AI generation failed");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let flashcardPairs: { front: string; back: string }[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      flashcardPairs = parsed.cards || [];
    }

    if (flashcardPairs.length === 0) {
      throw new Error("AI did not generate any flashcards");
    }

    // Create deck
    const { data: deck, error: deckErr } = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: user.id,
        class_name,
        title: `${class_name} — Auto-generated`,
        description: `Generated from ${content.length} topics`,
      })
      .select()
      .single();

    if (deckErr) throw deckErr;

    // Insert cards
    const cardRows = flashcardPairs.map((c) => ({
      deck_id: deck.id,
      user_id: user.id,
      front_text: c.front,
      back_text: c.back,
    }));

    const { error: cardsErr } = await supabase
      .from("flashcards")
      .insert(cardRows);
    if (cardsErr) throw cardsErr;

    return new Response(
      JSON.stringify({ deck_id: deck.id, count: flashcardPairs.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-flashcards error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
