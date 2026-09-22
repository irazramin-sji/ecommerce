import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AddressSchema = z.object({
  address_line1: z.string().min(1, "Required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  zip_code: z.string().min(1, "Required"),
  country: z.string().min(1, "Required")
});

type AddressForm = z.infer<typeof AddressSchema>;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm<AddressForm>({
    resolver: zodResolver(AddressSchema),
    defaultValues: { country: "USA" }
  });

  async function onSubmit(values: AddressForm) {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      const body = {
        user_id: user?.id ?? null,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
        shipping_address: values,
        billing_address: values
      };

      // call Edge Function
      const res = await supabase.functions.invoke("checkout_intent", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        toast.error("Checkout failed: " + text);
        return;
      }
      const json = await res.json();
      // Simulated payment step: we assume success
      toast.success("Order placed");
      clear();
      navigate("/order-success");
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    }
  }

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="py-6"><h1 className="text-2xl font-bold">Checkout</h1></div>
      </PageLayout.Header>

      <PageLayout.Content>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Address Line 1</label>
              <input {...register("address_line1")} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium">Address Line 2</label>
              <input {...register("address_line2")} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">City</label>
                <input {...register("city")} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium">State</label>
                <input {...register("state")} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">ZIP</label>
                <input {...register("zip_code")} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium">Country</label>
                <input {...register("country")} className="input" />
              </div>
            </div>

            <div>
              <Button type="submit">Place Order - ${subtotal.toFixed(2)}</Button>
            </div>
          </form>

          <aside className="p-4 border rounded">
            <div className="font-medium">Order Summary</div>
            <div className="mt-2 text-sm text-muted-foreground">Items: {items.length}</div>
            <div className="mt-4 flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          </aside>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
