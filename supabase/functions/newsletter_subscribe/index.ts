import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAILCHIMP_API_KEY = Deno.env.get("MAILCHIMP_API_KEY") || "";
const MAILCHIMP_LIST_ID = Deno.env.get("MAILCHIMP_LIST_ID") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }
    const body = await req.json();
    const { email } = body;
    if (!email) return jsonResponse({ error: "Missing email" }, 400);

    // Insert into Supabase backup
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email }, { onConflict: ["email"] });

    if (error) return jsonResponse({ error: error.message }, 500);

    // Optionally call Mailchimp
    if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
      try {
        const dc = MAILCHIMP_API_KEY.split("-").pop();
        await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`, {
          method: "POST",
          headers: {
            Authorization: `apikey ${MAILCHIMP_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email_address: email, status: "subscribed" })
        });
      } catch (e) {
        console.error("Mailchimp subscribe failed", e);
      }
    }

    return jsonResponse({ message: "Subscribed" });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
