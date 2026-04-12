import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, className, assignmentTitle, rubricCriteria } = await req.json();

    if (!text || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Please provide at least 20 characters of writing to analyze." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) throw new Error("Unauthorized");

    // Get user learning styles for personalized feedback
    const { data: profile } = await supabase
      .from("profiles")
      .select("learning_styles")
      .eq("id", user.id)
      .single();

    const learningStyles = profile?.learning_styles || [];
    const styleHint = learningStyles.length > 0
      ? `The student prefers: ${learningStyles.join(", ")}. Tailor feedback style accordingly.`
      : "";

    // Build rubric context if provided
    const rubricContext = rubricCriteria && rubricCriteria.length > 0
      ? `\n\nRUBRIC CRITERIA TO EVALUATE AGAINST:\n${rubricCriteria.map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.description || ""}`).join("\n")}`
      : "";

    const systemPrompt = `You are a skilled university teaching assistant providing detailed, constructive feedback on student writing. Your feedback should feel like a one-on-one tutoring session — warm, specific, and actionable.

FEEDBACK APPROACH:
- Start with what the student did well (specific strengths)
- Identify areas for improvement with concrete suggestions
- Provide examples of how to improve specific passages
- Check for thesis clarity, argument structure, evidence use, transitions, and conclusion strength
- Evaluate grammar, style, and academic tone
- If a rubric is provided, evaluate against each criterion
- End with 2-3 prioritized next steps

${styleHint}
${rubricContext}

TONE: Encouraging but honest. Never vague — always reference specific parts of the writing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please provide detailed feedback on this ${assignmentTitle ? `assignment ("${assignmentTitle}") ` : ""}writing for the course "${className || "General"}":\n\n---\n${text}\n---`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_writing_feedback",
              description: "Return structured writing feedback",
              parameters: {
                type: "object",
                properties: {
                  overallScore: {
                    type: "number",
                    description: "Overall quality score from 1-10",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of specific strengths in the writing",
                  },
                  improvements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "The area needing improvement" },
                        issue: { type: "string", description: "What the issue is" },
                        suggestion: { type: "string", description: "Specific suggestion for improvement" },
                        example: { type: "string", description: "Example of improved text, if applicable" },
                      },
                      required: ["area", "issue", "suggestion"],
                    },
                  },
                  rubricScores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        criterion: { type: "string" },
                        score: { type: "number", description: "Score 1-5" },
                        comment: { type: "string" },
                      },
                      required: ["criterion", "score", "comment"],
                    },
                    description: "Scores against rubric criteria if provided",
                  },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 prioritized action items for the student",
                  },
                  detailedNarrative: {
                    type: "string",
                    description: "A warm, detailed narrative feedback paragraph in teaching style",
                  },
                },
                required: ["overallScore", "strengths", "improvements", "nextSteps", "detailedNarrative"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_writing_feedback" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI feedback generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    let feedback;
    try {
      feedback = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      throw new Error("Failed to parse feedback");
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ai_writing_feedback",
      entity_type: "writing_feedback",
      metadata: {
        className: className || null,
        assignmentTitle: assignmentTitle || null,
        textLength: text.length,
        overallScore: feedback.overallScore,
      },
    });

    return new Response(JSON.stringify({ success: true, feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("writing-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
