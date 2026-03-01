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
    const filePath = `uploads/coi/${projectId}/${Date.now()}_${file.name}`;
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

    // Convert file to base64 for AI (chunked to avoid stack overflow)
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
            content: `You are an ACORD Certificate of Insurance (COI) data extraction expert. 

CRITICAL INSTRUCTIONS for extracting data:
- The document is an ACORD 25 form with multiple sections: General Liability, Automobile Liability, Umbrella/Excess, Workers Compensation, etc.
- Each section has its OWN "Policy Eff (MM/DD/YYYY)" and "Policy Exp (MM/DD/YYYY)" columns.
- For gl_effective_date and gl_expiration_date: ONLY use the dates from the "COMMERCIAL GENERAL LIABILITY" row. Do NOT use dates from other sections.
- For wc_effective_date and wc_expiration_date: ONLY use the dates from the "WORKERS COMPENSATION" row.
- The "insured" name is in the top-left area of the form — use ONLY the company/person name as the subcontractor name. Do NOT include their address, city, state, or zip code. For example if the insured is "TRIPLE A POOLS & SPAS, INC.\n50 PURICK ST.\nBLUE POINT, NY 11715", the subcontractor should be just "TRIPLE A POOLS & SPAS, INC."
- The "producer" is the insurance agency/broker — use this as the company field.
- Policy numbers, carriers, and limits should also come from their respective sections.
- GL LIMITS: Extract BOTH "Each Occurrence" limit AND "General Aggregate" limit from the GL section. These are typically shown as separate line items (e.g., $1,000,000 / $2,000,000).
- UMBRELLA/EXCESS: Extract umbrella policy number, carrier, and "Each Occurrence" limit from the Umbrella/Excess Liability section if present.
- CERTIFICATE HOLDER: Extract the certificate holder name from the bottom-left box of the form.
- DESCRIPTION OF OPERATIONS: Extract the full text from the "Description of Operations / Locations / Vehicles" section. This often contains Additional Insured endorsements and project-specific info.
- If a field is not found in the correct section, leave it empty.`,
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
                text: "Extract COI data from this ACORD certificate. Make sure GL dates come from the General Liability section row and WC dates from the Workers Compensation section row. Do not mix dates between sections.",
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
                  subcontractor: { type: "string", description: "The insured party / subcontractor name ONLY (no address). Just the company or person name." },
                  company: { type: "string", description: "The insurance company or agency name" },
                  gl_policy_number: { type: "string", description: "General Liability policy number" },
                  gl_carrier: { type: "string", description: "General Liability insurance carrier" },
                  gl_effective_date: { type: "string", description: "GL policy effective date in YYYY-MM-DD format" },
                  gl_expiration_date: { type: "string", description: "GL policy expiration date in YYYY-MM-DD format" },
                  gl_coverage_limit: { type: "string", description: "GL Each Occurrence limit (e.g. $1,000,000)" },
                  gl_per_occurrence_limit: { type: "string", description: "GL Each Occurrence limit (same as gl_coverage_limit, e.g. $1,000,000)" },
                  gl_aggregate_limit: { type: "string", description: "GL General Aggregate limit (e.g. $2,000,000)" },
                  umbrella_policy_number: { type: "string", description: "Umbrella/Excess Liability policy number" },
                  umbrella_carrier: { type: "string", description: "Umbrella/Excess Liability carrier" },
                  umbrella_limit: { type: "string", description: "Umbrella Each Occurrence limit (e.g. $5,000,000)" },
                  umbrella_effective_date: { type: "string", description: "Umbrella effective date YYYY-MM-DD" },
                  umbrella_expiration_date: { type: "string", description: "Umbrella expiration date YYYY-MM-DD" },
                  wc_policy_number: { type: "string", description: "Workers Compensation policy number" },
                  wc_carrier: { type: "string", description: "Workers Compensation carrier" },
                  wc_effective_date: { type: "string", description: "WC effective date in YYYY-MM-DD format" },
                  wc_expiration_date: { type: "string", description: "WC expiration date in YYYY-MM-DD format" },
                  labor_law_coverage: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether labor law coverage is included" },
                  action_over: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether action over coverage is included" },
                  hammer_clause: { type: "string", enum: ["included", "excluded", "unknown"], description: "Whether hammer clause is included" },
                  certificate_holder: { type: "string", description: "The certificate holder name from the bottom-left box" },
                  description_of_operations: { type: "string", description: "Full text from Description of Operations / Locations / Vehicles section" },
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
    const subName = (extracted.subcontractor || file.name).trim().toUpperCase();

    // Check if a record for this subcontractor already exists in this project
    const { data: existing } = await supabase
      .from("subcontractor_cois")
      .select("*")
      .eq("project_id", projectId)
      .ilike("subcontractor", subName)
      .limit(1)
      .maybeSingle();

    let coi;
    let dbError;

    if (existing) {
      // Merge: fill in missing fields from new cert
      const updates: Record<string, unknown> = {};
      if (!existing.gl_policy_number && extracted.gl_policy_number) {
        updates.gl_policy_number = extracted.gl_policy_number;
        updates.gl_carrier = extracted.gl_carrier || existing.gl_carrier;
        updates.gl_effective_date = extracted.gl_effective_date || existing.gl_effective_date;
        updates.gl_expiration_date = extracted.gl_expiration_date || existing.gl_expiration_date;
        updates.gl_coverage_limit = extracted.gl_coverage_limit || existing.gl_coverage_limit;
      } else if (extracted.gl_policy_number && extracted.gl_policy_number !== existing.gl_policy_number) {
        // New GL data overwrites if different policy
        updates.gl_policy_number = extracted.gl_policy_number;
        updates.gl_carrier = extracted.gl_carrier || existing.gl_carrier;
        updates.gl_effective_date = extracted.gl_effective_date || existing.gl_effective_date;
        updates.gl_expiration_date = extracted.gl_expiration_date || existing.gl_expiration_date;
        updates.gl_coverage_limit = extracted.gl_coverage_limit || existing.gl_coverage_limit;
      }
      if (!existing.wc_policy_number && extracted.wc_policy_number) {
        updates.wc_policy_number = extracted.wc_policy_number;
        updates.wc_carrier = extracted.wc_carrier || existing.wc_carrier;
        updates.wc_effective_date = extracted.wc_effective_date || existing.wc_effective_date;
        updates.wc_expiration_date = extracted.wc_expiration_date || existing.wc_expiration_date;
      } else if (extracted.wc_policy_number && extracted.wc_policy_number !== existing.wc_policy_number) {
        updates.wc_policy_number = extracted.wc_policy_number;
        updates.wc_carrier = extracted.wc_carrier || existing.wc_carrier;
        updates.wc_effective_date = extracted.wc_effective_date || existing.wc_effective_date;
        updates.wc_expiration_date = extracted.wc_expiration_date || existing.wc_expiration_date;
      }
      // Update provisions if they were unknown
      if (existing.labor_law_coverage === "unknown" && extracted.labor_law_coverage && extracted.labor_law_coverage !== "unknown") {
        updates.labor_law_coverage = extracted.labor_law_coverage;
      }
      if (existing.action_over === "unknown" && extracted.action_over && extracted.action_over !== "unknown") {
        updates.action_over = extracted.action_over;
      }
      if (existing.hammer_clause === "unknown" && extracted.hammer_clause && extracted.hammer_clause !== "unknown") {
        updates.hammer_clause = extracted.hammer_clause;
      }
      // New fields: always update if extracted and missing
      if (!existing.gl_per_occurrence_limit && extracted.gl_per_occurrence_limit) {
        updates.gl_per_occurrence_limit = extracted.gl_per_occurrence_limit;
      }
      if (!existing.gl_aggregate_limit && extracted.gl_aggregate_limit) {
        updates.gl_aggregate_limit = extracted.gl_aggregate_limit;
      }
      if (!existing.umbrella_policy_number && extracted.umbrella_policy_number) {
        updates.umbrella_policy_number = extracted.umbrella_policy_number;
        updates.umbrella_carrier = extracted.umbrella_carrier || null;
        updates.umbrella_limit = extracted.umbrella_limit || null;
        updates.umbrella_effective_date = extracted.umbrella_effective_date || null;
        updates.umbrella_expiration_date = extracted.umbrella_expiration_date || null;
      }
      if ((!existing.certificate_holder || existing.certificate_holder === 'unknown') && extracted.certificate_holder) {
        updates.certificate_holder = extracted.certificate_holder;
      }
      if (!existing.description_of_operations && extracted.description_of_operations) {
        updates.description_of_operations = extracted.description_of_operations;
      }

      if (Object.keys(updates).length > 0) {
        const { data, error } = await supabase
          .from("subcontractor_cois")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        coi = data;
        dbError = error;
      } else {
        coi = existing;
      }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("subcontractor_cois")
        .insert({
          project_id: projectId,
          subcontractor: subName,
          company: extracted.company || "",
          gl_policy_number: extracted.gl_policy_number || null,
          gl_carrier: extracted.gl_carrier || null,
          gl_effective_date: extracted.gl_effective_date || null,
          gl_expiration_date: extracted.gl_expiration_date || null,
          gl_coverage_limit: extracted.gl_coverage_limit || null,
          gl_per_occurrence_limit: extracted.gl_per_occurrence_limit || null,
          gl_aggregate_limit: extracted.gl_aggregate_limit || null,
          umbrella_policy_number: extracted.umbrella_policy_number || null,
          umbrella_carrier: extracted.umbrella_carrier || null,
          umbrella_limit: extracted.umbrella_limit || null,
          umbrella_effective_date: extracted.umbrella_effective_date || null,
          umbrella_expiration_date: extracted.umbrella_expiration_date || null,
          wc_policy_number: extracted.wc_policy_number || null,
          wc_carrier: extracted.wc_carrier || null,
          wc_effective_date: extracted.wc_effective_date || null,
          wc_expiration_date: extracted.wc_expiration_date || null,
          labor_law_coverage: extracted.labor_law_coverage || "unknown",
          action_over: extracted.action_over || "unknown",
          hammer_clause: extracted.hammer_clause || "unknown",
          certificate_holder: extracted.certificate_holder || "unknown",
          description_of_operations: extracted.description_of_operations || null,
          coi_file_path: filePath,
        })
        .select()
        .single();
      coi = data;
      dbError = error;
    }

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save COI record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-verify additional insured and certificate holder against GC settings
    const coiId = coi?.id;
    if (coiId) {
      try {
        const { data: gcSettings } = await supabase
          .from("gc_settings")
          .select("company_name, property_address, owner_info")
          .limit(1)
          .maybeSingle();

        if (gcSettings?.company_name) {
          const desc = (extracted.description_of_operations || "").toUpperCase();
          const certHolder = (extracted.certificate_holder || "").toUpperCase();
          const gcName = gcSettings.company_name.toUpperCase();

          // Check additional insured: company name must appear in description
          const aiConfirmed = desc.includes(gcName);

          // Check certificate holder matches GC name
          const certHolderMatch = certHolder.includes(gcName);

          const verifyUpdates: Record<string, unknown> = {
            additional_insured: aiConfirmed ? "confirmed" : "unconfirmed",
            certificate_holder: extracted.certificate_holder || "unknown",
          };

          await supabase
            .from("subcontractor_cois")
            .update(verifyUpdates)
            .eq("id", coiId);
        }
      } catch (verifyErr) {
        console.error("Verification check error (non-fatal):", verifyErr);
      }
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
