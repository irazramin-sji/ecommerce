import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../../_shared/responses";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Simple catalog importer that accepts a JSON payload with "items": [{name, sku, price, category, attributes..., images: []}, ...]
 * For large CSVs, upload to Supabase Storage and call this function with the storage URL in production.
 */
serve(async (req) => {
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
    const body = await req.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: "No items provided" }, 400);
    }

    const results: any[] = [];
    for (const item of items) {
      const slug = (item.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      // Upsert product
      const { data: product, error } = await supabase
        .from("products")
        .upsert({
          name: item.name,
          slug,
          price: item.price || 0,
          sku: item.sku || null,
          material_type: item.material_type || null,
          shape: item.shape || null,
          length: item.length || null,
          tip_size: item.tip_size || null,
          stock_quantity: item.stock_quantity || 0,
          description: item.description || null,
          is_featured: !!item.is_featured
        }, { onConflict: ["sku", "slug", "name"] })
        .select()
        .single();

      if (error) {
        results.push({ item, error: error.message });
        continue;
      }

      // Insert images if present
      if (Array.isArray(item.images) && item.images.length) {
        for (const [idx, url] of item.images.entries()) {
          await supabase.from("product_images").upsert({
            product_id: product.id,
            url,
            alt_text: item.name,
            "order": idx
          }, { onConflict: ["product_id", "url"] });
        }
      }

      results.push({ item: item.sku || item.name, status: "ok", product_id: product.id });
    }

    return jsonResponse({ results });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
