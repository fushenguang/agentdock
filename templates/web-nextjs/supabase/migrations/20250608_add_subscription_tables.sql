-- Migration: add subscription tables for payments
-- Created: 2025-06-08

-- ============================================
-- subscription_plans: plan catalog
-- ============================================
create table if not exists subscription_plans (
  id serial primary key,
  plan_code text not null unique,
  plan_name text not null,
  description text,
  price_monthly int not null default 0,
  price_yearly int not null default 0,
  features jsonb default '{}',
  display_order int default 0,
  is_active bool default true,
  is_featured bool default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table subscription_plans enable row level security;

-- RLS policies: all authenticated users can SELECT
 create policy "Allow authenticated select on subscription_plans"
  on subscription_plans for select
  to authenticated
  using (true);

-- service_role only for INSERT/UPDATE/DELETE
 create policy "Allow service_role all on subscription_plans"
  on subscription_plans for all
  to service_role
  using (true)
  with check (true);

-- ============================================
-- user_subscriptions: user subscription records
-- ============================================
create table if not exists user_subscriptions (
  id serial primary key,
  user_id uuid references auth.users not null,
  plan_id int references subscription_plans(id) not null,
  status text not null default 'pending' check (status in ('trial', 'active', 'expired', 'cancelled', 'pending')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  cancel_at_period_end bool default false,
  last_payment_id int,
  next_billing_date date,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table user_subscriptions enable row level security;

-- Users can only SELECT their own records
 create policy "Allow users select own subscriptions"
  on user_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- Users can UPDATE their own records (for cancel_at_period_end)
 create policy "Allow users update own subscriptions"
  on user_subscriptions for update
  to authenticated
  using (user_id = auth.uid());

-- service_role for INSERT
 create policy "Allow service_role all on user_subscriptions"
  on user_subscriptions for all
  to service_role
  using (true)
  with check (true);

-- ============================================
-- payments: payment records
-- ============================================
create table if not exists payments (
  id serial primary key,
  user_id uuid references auth.users not null,
  subscription_id int references user_subscriptions(id),
  order_no text not null unique,
  amount int not null,
  currency text default 'CNY',
  payment_method text not null check (payment_method in ('alipay', 'wechat', 'stripe')),
  payment_channel text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  provider_trade_no text,
  provider_response jsonb,
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table payments enable row level security;

-- Users can SELECT their own payment records
 create policy "Allow users select own payments"
  on payments for select
  to authenticated
  using (user_id = auth.uid());

-- service_role for INSERT/UPDATE
 create policy "Allow service_role all on payments"
  on payments for all
  to service_role
  using (true)
  with check (true);

-- ============================================
-- Seed data: Free + Pro plans
-- ============================================
insert into subscription_plans (plan_code, plan_name, description, price_monthly, price_yearly, features, display_order, is_active, is_featured)
values
  ('free', 'Free', '基础免费方案', 0, 0, '{"maxProjects": 3, "maxApiCalls": 1000}'::jsonb, 1, true, false),
  ('pro', 'Pro', '专业版方案', 3900, 29900, '{"maxProjects": 50, "maxApiCalls": 100000, "prioritySupport": true}'::jsonb, 2, true, true)
on conflict (plan_code) do nothing;
