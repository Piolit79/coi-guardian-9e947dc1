import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const THRESHOLDS = [
  { days: 30, type: "30_day", label: "30 days" },
  { days: 15, type: "15_day", label: "15 days" },
  { days: 3, type: "3_day", label: "3 days" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get GC settings for notification email
    const { data: settings } = await supabase
      .from("gc_settings")
      .select("notification_email, company_name")
      .limit(1)
      .maybeSingle();

    const toEmail = settings?.notification_email;
    if (!toEmail) {
      return new Response(
        JSON.stringify({ message: "No notification email configured in Settings. Skipping." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all COIs with their project info
    const { data: cois, error: coiErr } = await supabase
      .from("subcontractor_cois")
      .select("id, subcontractor, gl_expiration_date, wc_expiration_date, project_id");

    if (coiErr) throw coiErr;

    // Get project names for context
    const projectIds = [...new Set((cois || []).map((c) => c.project_id))];
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    const projectMap = new Map((projects || []).map((p) => [p.id, p.name]));

    // Get already-sent reminders
    const { data: sentReminders } = await supabase
      .from("coi_reminders")
      .select("coi_id, reminder_type, policy_type, expiration_date");

    const sentSet = new Set(
      (sentReminders || []).map(
        (r) => `${r.coi_id}_${r.reminder_type}_${r.policy_type}_${r.expiration_date}`
      )
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const remindersToSend: Array<{
      coiId: string;
      sub: string;
      project: string;
      policyType: string;
      expDate: string;
      threshold: (typeof THRESHOLDS)[number];
    }> = [];

    for (const coi of cois || []) {
      const policies = [
        { type: "gl", date: coi.gl_expiration_date },
        { type: "wc", date: coi.wc_expiration_date },
      ];

      for (const policy of policies) {
        if (!policy.date) continue;
        const expDate = new Date(policy.date);
        expDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil(
          (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        for (const threshold of THRESHOLDS) {
          if (daysUntil <= threshold.days && daysUntil > 0) {
            const key = `${coi.id}_${threshold.type}_${policy.type}_${policy.date}`;
            if (!sentSet.has(key)) {
              remindersToSend.push({
                coiId: coi.id,
                sub: coi.subcontractor,
                project: projectMap.get(coi.project_id) || "Unknown",
                policyType: policy.type.toUpperCase(),
                expDate: policy.date,
                threshold,
              });
            }
          }
        }
      }
    }

    if (remindersToSend.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send today." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by threshold for a cleaner email
    const grouped = new Map<string, typeof remindersToSend>();
    for (const r of remindersToSend) {
      const key = r.threshold.type;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }

    // Build email HTML
    let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">`;
    html += `<h2 style="color: #1a1a1a;">COI Expiration Reminders</h2>`;
    html += `<p style="color: #666;">The following certificates need attention:</p>`;

    for (const [type, items] of grouped) {
      const label = THRESHOLDS.find((t) => t.type === type)?.label || type;
      html += `<h3 style="color: #d97706; margin-top: 24px;">⚠️ Expiring within ${label}</h3>`;
      html += `<table style="width: 100%; border-collapse: collapse; font-size: 14px;">`;
      html += `<tr style="background: #f5f5f5; text-align: left;">
        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Subcontractor</th>
        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Project</th>
        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Type</th>
        <th style="padding: 8px; border-bottom: 1px solid #ddd;">Expires</th>
      </tr>`;
      for (const item of items) {
        html += `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.sub}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.project}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.policyType}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.expDate}</td>
        </tr>`;
      }
      html += `</table>`;
    }

    html += `<p style="color: #888; margin-top: 24px; font-size: 12px;">Upload updated certificates to stop receiving these reminders.</p>`;
    html += `</div>`;

    // Send via Resend
    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "COI Tracker <onboarding@resend.dev>",
        to: [toEmail],
        subject: `⚠️ ${remindersToSend.length} COI(s) expiring soon`,
        html,
      }),
    });

    if (!emailResp.ok) {
      const errBody = await emailResp.text();
      console.error("Resend error:", emailResp.status, errBody);
      throw new Error(`Failed to send email: ${emailResp.status}`);
    }

    // Record sent reminders so we don't resend
    const records = remindersToSend.map((r) => ({
      coi_id: r.coiId,
      reminder_type: r.threshold.type,
      policy_type: r.policyType.toLowerCase(),
      expiration_date: r.expDate,
    }));

    const { error: insertErr } = await supabase
      .from("coi_reminders")
      .upsert(records, { onConflict: "coi_id,reminder_type,policy_type,expiration_date" });

    if (insertErr) console.error("Failed to record reminders:", insertErr);

    return new Response(
      JSON.stringify({ success: true, sent: remindersToSend.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("coi-reminders error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
