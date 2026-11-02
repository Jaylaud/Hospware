-- ==============================================================================
-- HOSPWARE SUPABASE POSTGRESQL SCHEMA
-- Cloud-First Hotel & Property Management Architecture
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Hotels / Properties
create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  currency text not null default 'USD',
  time_zone text not null default 'UTC',
  address text,
  phone text,
  email text,
  tax_number text,
  subscription_tier text not null default 'starter' check (subscription_tier in ('starter', 'standard', 'premium')),
  subscription_status text not null default 'active' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled')),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'annual')),
  max_rooms integer not null default 30,
  active_modules text[] not null default '{front_desk,owner_reports}',
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1b. Module Subscription History & Audits
create table if not exists public.hotel_module_history (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  module_key text not null,
  action text not null check (action in ('activated', 'deactivated', 'trial_started')),
  actor_id uuid references auth.users(id),
  monthly_fee numeric(10,2) not null default 0.00,
  notes text,
  created_at timestamptz not null default now()
);

-- 2. Staff Profiles (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  hotel_id uuid references public.hotels(id) on delete cascade,
  full_name text not null,
  role text not null default 'receptionist' check (role in ('owner', 'manager', 'receptionist', 'housekeeper', 'waiter', 'kitchen')),
  pin_code text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Room Types
create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0.00,
  capacity_adults integer not null default 2,
  capacity_children integer not null default 0,
  amenities text[] default '{}',
  created_at timestamptz not null default now()
);

-- 4. Rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  room_type_id uuid references public.room_types(id) on delete set null,
  room_number text not null,
  floor text default '1',
  status text not null default 'available' check (status in ('available', 'occupied', 'dirty', 'cleaning', 'maintenance', 'reserved')),
  current_reservation_id uuid,
  last_cleaned_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Guests
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  id_number text,
  id_type text default 'passport',
  nationality text,
  notes text,
  created_at timestamptz not null default now()
);

-- 6. Reservations
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  room_type_id uuid references public.room_types(id) on delete set null,
  check_in_date date not null,
  check_out_date date not null,
  actual_check_in timestamptz,
  actual_check_out timestamptz,
  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partially_paid', 'paid', 'refunded')),
  adults integer not null default 1,
  children integer not null default 0,
  total_amount numeric(10,2) not null default 0.00,
  paid_amount numeric(10,2) not null default 0.00,
  source text not null default 'direct',
  notes text,
  created_at timestamptz not null default now()
);

-- 7. Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  method text not null check (method in ('cash', 'card', 'bank_transfer', 'mobile_money', 'other')),
  reference text,
  receipt_number text unique,
  processed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 8. Receipts (For POS and Desk Printing)
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  receipt_number text not null unique,
  guest_name text not null,
  room_number text,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null,
  tax_amount numeric(10,2) not null default 0.00,
  total_amount numeric(10,2) not null,
  currency text not null default 'USD',
  payment_method text not null,
  issued_at timestamptz not null default now()
);

-- 9. Housekeeping Tasks
create table if not exists public.housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'inspected')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 10. Owner Subscriptions & Billing History
create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  invoice_number text not null unique,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'paid' check (status in ('paid', 'pending', 'failed')),
  plan_tier text not null,
  period_start date not null,
  period_end date not null,
  payment_method text not null,
  pdf_url text,
  created_at timestamptz not null default now()
);

-- 11. Activity Feed & Notifications (For Owner Realtime Monitoring)
create table if not exists public.activity_notifications (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels(id) on delete cascade,
  actor_name text not null,
  event_type text not null check (event_type in ('check_in', 'check_out', 'payment', 'cleaning_done', 'room_issue', 'alert')),
  title text not null,
  description text not null,
  metadata jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- Instant updates to Web, Desktop Dashboard, and Mobile App
-- ==============================================================================
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.housekeeping_tasks;
alter publication supabase_realtime add table public.activity_notifications;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data is isolated per hotel tenant
-- ==============================================================================
alter table public.hotels enable row level security;
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_types enable row level security;
alter table public.guests enable row level security;
alter table public.reservations enable row level security;
alter table public.payments enable row level security;
alter table public.receipts enable row level security;
alter table public.housekeeping_tasks enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.activity_notifications enable row level security;

-- Authenticated users can view their hotel's data
create policy "Users can view their hotel" on public.hotels
  for select using (auth.uid() = owner_id or id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can view members of their hotel" on public.profiles
  for select using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can view their hotel rooms" on public.rooms
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can view their hotel room types" on public.room_types
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can manage guests" on public.guests
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can manage reservations" on public.reservations
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can manage payments" on public.payments
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can manage receipts" on public.receipts
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Users can manage housekeeping tasks" on public.housekeeping_tasks
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));

create policy "Owners can view subscription invoices" on public.subscription_invoices
  for select using (hotel_id in (select id from public.hotels where owner_id = auth.uid()));

create policy "Users can view notifications" on public.activity_notifications
  for all using (hotel_id in (select hotel_id from public.profiles where id = auth.uid()));
