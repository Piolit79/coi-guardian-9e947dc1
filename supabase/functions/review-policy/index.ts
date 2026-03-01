import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { coi_id, file_path } = await req.json();

    if (!coi_id || !file_path) {
      return new Response(
        JSON.stringify({ error: "coi_id and file_path are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("certificates")
      .download(file_path);

    if (dlError || !fileData) {
      console.error("Download error:", dlError);
      return new Response(
        JSON.stringify({ error: "Failed to download policy file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);
    const mimeType = "application/pdf";

    // AI deep-dive review
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an expert insurance policy reviewer working for a General Contractor (GC). 
Your job is to perform a deep review of a subcontractor's General Liability insurance policy document.

Focus on identifying:
1. **Labor Law Exclusions** - NY Labor Law 240/241 exclusions, construction-specific exclusions
2. **Action Over Exclusions** - Whether third-party-over claims are excluded
3. **Hammer Clause** - Consent-to-settle provisions that could force the insured to accept a settlement
4. **Additional Insured Endorsements** - Whether the GC is (or can be) listed as additional insured
5. **Subrogation Waivers** - Whether subrogation rights are waived in favor of the GC
6. **Cross-Liability / Severability** - Whether each insured is treated separately
7. **Sunset/Tail Provisions** - Limitations on reporting claims after policy expiration
8. **Per-Project Aggregate** - Whether there's a per-project aggregate or just a general aggregate
9. **Exclusions of Concern** - Any other exclusions that transfer liability from the sub to the GC

For each finding, assess the risk level: HIGH (immediate concern), MEDIUM (should be addressed), LOW (minor/informational).
Rate the overall policy from the GC's perspective as: FAVORABLE, ACCEPTABLE, NEEDS_REVIEW, or UNFAVORABLE.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Review this GL policy document in detail. Identify all provisions that could transfer liability from the subcontractor to the General Contractor, with special focus on labor law exclusions, action over exclusions, hammer clauses, and additional insured status.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "policy_review_result",
              description: "Return the structured policy review results",
              parameters: {
                type: "object",
                properties: {
                  overall_rating: {
                    type: "string",
                    enum: ["FAVORABLE", "ACCEPTABLE", "NEEDS_REVIEW", "UNFAVORABLE"],
                    description: "Overall assessment from GC perspective",
                  },
                  summary: {
                    type: "string",
                    description: "Brief 2-3 sentence summary of the policy review",
                  },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: {
                          type: "string",
                          description: "Category of finding (e.g. Labor Law Exclusion, Hammer Clause, etc.)",
                        },
                        risk_level: {
                          type: "string",
                          enum: ["HIGH", "MEDIUM", "LOW"],
                        },
                        title: {
                          type: "string",
                          description: "Short title of the finding",
                        },
                        description: {
                          type: "string",
                          description: "Detailed explanation of the finding and its implications for the GC",
                        },
                        recommendation: {
                          type: "string",
                          description: "Recommended action for the GC",
                        },
                      },
                      required: ["category", "risk_level", "title", "description"],
                      additionalProperties: false,
                    },
                  },
                  additional_insured_status: {
                    type: "string",
                    enum: ["confirmed", "not_found", "unclear"],
                    description: "Whether GC is listed as additional insured",
                  },
                  subrogation_waiver: {
                    type: "string",
                    enum: ["confirmed", "not_found", "unclear"],
                  },
                },
                required: ["overall_rating", "summary", "findings", "additional_insured_status", "subrogation_waiver"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "policy_review_result" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI review failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI could not review the policy" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const review = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, review }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-policy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
