import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="py-6">
          <h1 className="text-2xl font-bold">Your Cart</h1>
        </div>
      </PageLayout.Header>

      <PageLayout.Content>
        {items.length === 0 ? (
          <div className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-2">Browse products and add items to your cart.</p>
              <Link to="/" className="inline-block mt-4">
                <Button>Continue shopping</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={it.product_id} className="flex items-center gap-4 p-4 border rounded">
                  <div className="w-24 h-24 bg-muted rounded overflow-hidden">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={it.name} className="object-cover w-full h-full" />
                    ) : <div className="text-sm text-muted-foreground p-4">No image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-muted-foreground">${it.unit_price.toFixed(2)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="btn btn-sm" onClick={() => updateQuantity(it.product_id, Math.max(1, it.quantity - 1))}>-</button>
                      <div>{it.quantity}</div>
                      <button className="btn btn-sm" onClick={() => updateQuantity(it.product_id, it.quantity + 1)}>+</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeItem(it.product_id)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="p-4 border rounded">
              <div className="font-medium">Order Summary</div>
              <div className="mt-4 flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="mt-6">
                <Link to="/checkout"><Button>Proceed to Checkout</Button></Link>
              </div>
            </aside>
          </div>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
}
