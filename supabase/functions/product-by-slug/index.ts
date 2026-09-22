import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return jsonResponse({ error: "Missing slug parameter" }, 400);
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images(url, alt_text, "order"),
        product_videos(*),
        product_user_guides(*),
        customer_reviews(*)
      `)
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ data });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
