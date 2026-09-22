import { supabase } from "@/integrations/supabase/client";

export async function submitReview(payload: { product_id: string; user_id: string; rating: number; comment?: string; }) {
  const res = await supabase.functions.invoke("reviews", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to submit review");
  }

  const json = await res.json();
  return json;
}
