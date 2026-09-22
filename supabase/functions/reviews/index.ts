import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }
    const body = await req.json();
    const { product_id, user_id, rating, comment } = body;

    if (!product_id || !user_id || !rating) {
      return jsonResponse({ error: "Missing fields" }, 400);
    }

    const { data, error } = await supabase
      .from("customer_reviews")
      .insert({
        product_id,
        user_id,
        rating,
        comment,
        is_approved: false
      })
      .select()
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ data, message: "Review submitted and awaiting approval" });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
