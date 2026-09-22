import { supabase } from "@/integrations/supabase/client";

export type ProductFilter = {
  search?: string;
  category?: string;
  material?: string;
  shape?: string;
  length?: string;
  tip_size?: string;
  page?: number;
  limit?: number;
};

export async function listProducts(filters: ProductFilter = {}) {
  // Call Supabase Edge Function 'products'
  const res = await supabase.functions.invoke("products", {
    method: "POST",
    body: JSON.stringify(filters)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch products");
  }
  const json = await res.json();
  return json.data || [];
}

export async function getProductBySlug(slug: string) {
  const res = await supabase.functions.invoke("product-by-slug", {
    method: "GET",
    // function supports query param 'slug'
    query: { slug }
  } as any);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch product");
  }
  const json = await res.json();
  return json.data || null;
}
