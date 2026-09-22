-- helper rpc to decrement stock if available; used by checkout_intent
create or replace function public.decrement_stock_if_available(p_product_id uuid, p_quantity integer)
returns void language plpgsql as $$
begin
  update public.products set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id and stock_quantity >= p_quantity;
end;
$$;
