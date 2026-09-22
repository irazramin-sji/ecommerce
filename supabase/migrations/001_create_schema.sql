-- 001_create_schema.sql
-- Initial schema for Norralco E-commerce Platform
-- Creates core tables and RLS policies per spec.

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Users table (profile linked to Supabase Auth)
create table if not exists public.users_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  price numeric(10,2) not null default 0,
  sku text unique,
  category_id uuid references public.categories(id) on delete set null,
  material_type text,
  shape text,
  length text,
  tip_size text,
  stock_quantity integer not null default 0,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  "order" integer default 0
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  description text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customer reviews
create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.users_profile(id) on delete set null,
  rating integer check (rating >=1 and rating <=5),
  comment text,
  created_at timestamptz default now(),
  is_approved boolean default false
);

-- Static content
create table if not exists public.static_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  content text,
  type text check (type in ('page','faq_item','download','video')),
  category text,
  "order" integer default 0,
  file_url text,
  embed_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users_profile(id) on delete set null,
  total_amount numeric(10,2) not null default 0,
  status text default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  shipping_address_id uuid references public.addresses(id) on delete set null,
  billing_address_id uuid references public.addresses(id) on delete set null,
  stripe_payment_intent_id text unique,
  invoice_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null default 0
);

-- Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users_profile(id) on delete set null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip_code text,
  country text,
  is_shipping boolean default false,
  is_billing boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now()
);

-- Contact form submissions
create table if not exists public.contact_form_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  subject text,
  message text,
  submitted_at timestamptz default now()
);

-- Auditing trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach trigger to tables with updated_at
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger trg_static_content_updated_at
  before update on public.static_content
  for each row execute function public.set_updated_at();

-- Row Level Security (RLS) policies
-- Enable RLS where user associated data exists
alter table public.users_profile enable row level security;
create policy "users_profile_self_or_admin" on public.users_profile
  for all
  using (
    auth.role() = 'authenticated' and (
      (auth.uid() = id) or
      (exists (select 1 from auth.users u where u.id = auth.uid() and (
        (select role from public.users_profile where id = auth.uid()) = 'admin'
      )))
    )
  )
  with check (
    auth.uid() = id or (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- products: public read; admin write
alter table public.products enable row level security;
create policy "products_public_read" on public.products
  for select using (true);

create policy "products_admin_crud" on public.products
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- product_images: public read; admin write
alter table public.product_images enable row level security;
create policy "product_images_public_read" on public.product_images
  for select using (true);

create policy "product_images_admin_crud" on public.product_images
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- categories: public read; admin write
alter table public.categories enable row level security;
create policy "categories_public_read" on public.categories
  for select using (true);

create policy "categories_admin_crud" on public.categories
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- customer_reviews: select only approved for public; customers can insert their own
alter table public.customer_reviews enable row level security;
create policy "reviews_public_select_approved" on public.customer_reviews
  for select using (is_approved = true);

create policy "reviews_insert_authenticated" on public.customer_reviews
  for insert with check (
    auth.role() = 'authenticated' and (new.user_id = auth.uid())
  );

create policy "reviews_admin_manage" on public.customer_reviews
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- orders: customers see own orders; admins see all
alter table public.orders enable row level security;
create policy "orders_customer_select" on public.orders
  for select using (user_id = auth.uid());

create policy "orders_customer_insert" on public.orders
  for insert with check (user_id = auth.uid());

create policy "orders_admin_full" on public.orders
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- addresses: customers manage own; admin manage all
alter table public.addresses enable row level security;
create policy "addresses_customer_select_insert" on public.addresses
  for all using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );

create policy "addresses_admin" on public.addresses
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- static_content: public read; admin write
alter table public.static_content enable row level security;
create policy "static_content_public_read" on public.static_content
  for select using (true);

create policy "static_content_admin" on public.static_content
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- newsletter_subscribers: admin read; public insert via Edge Function only
alter table public.newsletter_subscribers enable row level security;
create policy "newsletter_admin" on public.newsletter_subscribers
  for all using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  ) with check (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- contact_form_submissions: admin read; insert via Edge Function
alter table public.contact_form_submissions enable row level security;
create policy "contact_admin" on public.contact_form_submissions
  for select using (
    (select role from public.users_profile where id = auth.uid()) = 'admin'
  );

-- Allow anonymous inserts from Edge Functions by checking for function role via a check on current_setting
-- Because Edge Functions will use the service_role, they bypass RLS. No USING (true) left for user-touchable tables.

-- End of migration
