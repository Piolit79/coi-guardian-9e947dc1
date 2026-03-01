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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("project_id") as string;

    if (!file || !projectId) {
      return new Response(JSON.stringify({ error: "file and project_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file to storage
    const filePath = `${projectId}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 for AI
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    const mimeType = file.type || "application/pdf";

    // Call AI to extract COI data using tool calling
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
            content: `You are a Certificate of Insurance (COI) data extraction expert. Extract all relevant information from the provided COI document image. Be precise with policy numbers, dates, and coverage amounts. If a field is not found, leave it empty.`,
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
                text: "Extract all COI data from this certificate of insurance document.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_coi_data",
              description: "Extract structured COI data from the document",
              parameters: {
                type: "object",
                properties: {
                  subcontractor: { type: "string", description: "The insured party / subcontractor name" },
                  company: { type: "string", description: "The insurance company or agency name" },
                  gl_policy_number: { type: "string", description: "General Liability policy number" },
                  gl_carrier: { type: "string", description: "General Liability insurance carrier" },
                  gl_effective_date: { type: "string", description: "GL policy effective date in YYYY-MM-DD format" },
                  gl_expiration_date: { type: "string", description: "GL policy expiration date in YYYY-MM-DD format" },
                  gl_coverage_limit: { type: "string", description: "GL coverage limit amount (e.g. $1,000,000)" },
                  wc_policy_number: { type: "string", description: "Workers Compensation policy number" },
                  wc_carrier: { type: "string", description: "Workers Compensation carrier" },
                  wc_effective_date: { type: "string", description: "WC effective date in YYYY-MM-DD format" },
                  wc_expiration_date: { type: "string", description: "WC expiration date in YYYY-MM-DD format" },
                  labor_law_coverage: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether labor law coverage is included" },
                  action_over: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether action over coverage is included" },
                  hammer_clause: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether hammer clause is included" },
                },
                required: ["subcontractor"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_coi_data" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI could not extract data from the document" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Insert the COI record
    const { data: coi, error: insertError } = await supabase
      .from("subcontractor_cois")
      .insert({
        project_id: projectId,
        subcontractor: extracted.subcontractor || file.name,
        company: extracted.company || "",
        gl_policy_number: extracted.gl_policy_number || null,
        gl_carrier: extracted.gl_carrier || null,
        gl_effective_date: extracted.gl_effective_date || null,
        gl_expiration_date: extracted.gl_expiration_date || null,
        gl_coverage_limit: extracted.gl_coverage_limit || null,
        wc_policy_number: extracted.wc_policy_number || null,
        wc_carrier: extracted.wc_carrier || null,
        wc_effective_date: extracted.wc_effective_date || null,
        wc_expiration_date: extracted.wc_expiration_date || null,
        labor_law_coverage: extracted.labor_law_coverage || "unknown",
        action_over: extracted.action_over || "unknown",
        hammer_clause: extracted.hammer_clause || "unknown",
        coi_file_path: filePath,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save COI record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, coi, extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-coi error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
