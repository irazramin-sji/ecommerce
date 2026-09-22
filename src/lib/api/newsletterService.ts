import { supabase } from "@/integrations/supabase/client";

export async function subscribeNewsletter(email: string) {
  const res = await supabase.functions.invoke("newsletter_subscribe", {
    method: "POST",
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to subscribe");
  }
  return await res.json();
}
