import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse } from "../_shared/responses";

// NOTE: This function simulates creating an order and a Stripe Payment Intent.
// In production, set STRIPE_SECRET and use Stripe SDK server-side.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
    const body = await req.json();
    const { user_id, items = [], shipping_address, billing_address } = body;

    if (!items.length) return jsonResponse({ error: "Cart is empty" }, 400);

    // Calculate total and create order record (transactional behavior simulated)
    let total = 0;
    for (const it of items) {
      total += Number(it.unit_price) * Number(it.quantity);
    }

    // Create addresses
    const { data: shippingAddr } = await supabase
      .from("addresses")
      .insert([{ ...shipping_address, user_id }])
      .select()
      .single();

    const { data: billingAddr } = await supabase
      .from("addresses")
      .insert([{ ...billing_address, user_id }])
      .select()
      .single();

    // Create order
    const { data: order } = await supabase
      .from("orders")
      .insert([{
        user_id,
        total_amount: total,
        status: "pending",
        shipping_address_id: shippingAddr?.id ?? null,
        billing_address_id: billingAddr?.id ?? null
      }])
      .select()
      .single();

    // Insert order_items and decrement stock
    for (const it of items) {
      await supabase.from("order_items").insert([{
        order_id: order.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price
      }]);

      // Decrement stock_quantity (service role)
      await supabase.rpc("decrement_stock_if_available", { p_product_id: it.product_id, p_quantity: it.quantity }).catch(() => {});
    }

    // Simulate Stripe client_secret (frontend uses this to render payment element)
    const client_secret = `simulated_client_secret_${order.id}`;

    // Update order with simulated stripe id
    await supabase.from("orders").update({ stripe_payment_intent_id: client_secret }).eq("id", order.id);

    return jsonResponse({ client_secret, order_id: order.id });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
