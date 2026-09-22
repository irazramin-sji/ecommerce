import { useState, useEffect } from "react";

type CartItem = {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image?: string | null;
  sku?: string | null;
};

const STORAGE_KEY = "norralco_cart_v1";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item: CartItem) {
    setItems((prev) => {
      const found = prev.find((p) => p.product_id === item.product_id);
      if (found) {
        return prev.map((p) => p.product_id === item.product_id ? { ...p, quantity: p.quantity + item.quantity } : p);
      }
      return [...prev, item];
    });
  }

  function updateQuantity(product_id: string, quantity: number) {
    setItems((prev) => prev.map((p) => p.product_id === product_id ? { ...p, quantity } : p));
  }

  function removeItem(product_id: string) {
    setItems((prev) => prev.filter((p) => p.product_id !== product_id));
  }

  function clear() {
    setItems([]);
  }

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  return { items, addItem, updateQuantity, removeItem, clear, count, subtotal };
}
