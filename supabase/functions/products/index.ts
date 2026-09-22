import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Expect JSON body with filters, page, limit
    const body = await req.json().catch(() => ({}));
    const {
      search,
      category,
      material,
      shape,
      length,
      tip_size,
      page = 0,
      limit = 12,
      cursor
    } = body || {};

    // Basic query builder using SQL to support filters and pagination
    // Use RPC-style via supabase admin client
    let query = supabase
      .from("products")
      .select(`*, product_images(url, alt_text, "order"), categories(*)`)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (category) {
      query = query.eq("category_id", category);
    }

    if (material) query = query.eq("material_type", material);
    if (shape) query = query.eq("shape", shape);
    if (length) query = query.eq("length", length);
    if (tip_size) query = query.eq("tip_size", tip_size);

    // Use range pagination
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await query.range(from, to);
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ data });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
