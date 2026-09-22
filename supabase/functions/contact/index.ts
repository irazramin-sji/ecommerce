import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    // Store in DB
    const { error: dbError } = await supabase
      .from("contact_form_submissions")
      .insert({ name, email, subject, message });

    if (dbError) {
      return jsonResponse({ error: dbError.message }, 500);
    }

    // Send simple SendGrid email if key present
    if (SENDGRID_API_KEY) {
      try {
        await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: email }],
                subject: `Norralco Contact: ${subject || "Message received"}`
              }
            ],
            from: { email: "no-reply@norralco.example", name: "Norralco" },
            content: [
              { type: "text/plain", value: `Hi ${name},\n\nThanks for contacting Norralco. We received your message:\n\n${message}\n\nWe will follow up shortly.` }
            ]
          })
        });
      } catch (e) {
        // non-fatal
        console.error("SendGrid send failed", e);
      }
    }

    return jsonResponse({ message: "Contact submission received" });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
