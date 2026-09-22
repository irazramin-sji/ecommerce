-- 002_decrement_stock_rpc.sql
-- Create RPC for decrementing stock safely
-- (This migration is separate to ensure the function exists for Edge Functions)
-- Contents identical to function above.

create or replace function public.decrement_stock_if_available(p_product_id uuid, p_quantity integer)
returns void language plpgsql as $$
begin
  update public.products set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id and stock_quantity >= p_quantity;
end;
$$;
