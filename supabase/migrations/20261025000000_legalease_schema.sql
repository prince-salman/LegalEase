-- ============================================================================
-- LegalEase Production Database Schema (Supabase PostgreSQL)
-- Project Ref: jogjdlwrpnvzzxvvfisc
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. PROFILES & SUBSCRIPTION TIERS
-- Plans: 'trial' (3-Day Free Trial, Rp 0), 'chat' (1 Month Chat Only, Rp 150.000), 'full' (1 Month Full Suite: Call + Chat + Document Templates, Rp 300.000)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  company_name text not null default '',
  phone text default '',
  active_plan text not null default 'trial' check (active_plan in ('trial', 'chat', 'full')),
  plan_started_at timestamptz not null default now(),
  plan_expires_at timestamptz not null default (now() + interval '3 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. LICENSED NOTARIES & PPAT DIRECTORY
create table if not exists public.notaries (
  id text primary key,
  name text not null,
  title_tag text not null,
  sk_number text not null,
  city text not null,
  category text not null check (category in ('pt', 'property', 'contract', 'employment')),
  specialty text not null,
  rate_idr integer not null default 150000,
  rating numeric(3,2) not null default 4.95,
  sessions_completed integer not null default 120,
  is_online boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.notaries enable row level security;

create policy "Anyone can view active notaries"
  on public.notaries for select
  using (true);

-- Seed verified Indonesian Notaries & PPAT
insert into public.notaries (id, name, title_tag, sk_number, city, category, specialty, rate_idr, rating, sessions_completed, is_online)
values
  ('notary-1', 'Dr. Hendra Wijaya, S.H., M.Kn.', 'Notary & PPAT • Online', 'SK Kemenkumham AHU-0142.AH.02.01', 'Jakarta Selatan', 'pt', 'PT/CV Incorporation, Corporate Deeds & M&A', 150000, 4.98, 342, true),
  ('notary-2', 'Kartika Permatasari, S.H., M.Kn.', 'Notary & PPAT • Online', 'SK Kemenkumham AHU-0289.AH.02.01', 'Surabaya & Sidoarjo', 'property', 'Property Law, AJB, SHM/HGB & Land Conveyancing', 200000, 4.96, 289, true),
  ('notary-3', 'Bagus Pratama Putra, S.H., M.Kn.', 'Notary & Legal Counsel • Online', 'SK Kemenkumham AHU-0511.AH.02.01', 'Bandung & Jabodetabek', 'contract', 'Startup Investment, Shareholder Agreements & PKS', 175000, 4.97, 215, true),
  ('notary-4', 'Nadia Kusumawardhani, S.H., M.Kn.', 'Notary & PPAT • Online', 'SK Kemenkumham AHU-0634.AH.02.01', 'Jakarta Pusat', 'employment', 'Employment Contracts (PKWT/PKWTT), IP & OSS RBA', 150000, 4.95, 198, true)
on conflict (id) do nothing;

-- 3. CONSULTATION MESSAGES (ENCRYPTED CHAT)
create table if not exists public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notary_id text not null default 'notary-1',
  sender text not null check (sender in ('user', 'notary')),
  message_text text not null,
  attachment_title text,
  attachment_type text,
  created_at timestamptz not null default now()
);

alter table public.consultation_messages enable row level security;

create policy "Users can view their own consultation messages"
  on public.consultation_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own consultation messages"
  on public.consultation_messages for insert
  with check (auth.uid() = user_id);

-- 4. CONSULTATION & DEED SIGNING APPOINTMENTS
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notary_id text not null,
  notary_name text not null,
  consultation_mode text not null check (consultation_mode in ('chat', 'video', 'in_person_deed')),
  appointment_date date not null,
  appointment_time text not null,
  topic text not null,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Users can manage their own appointments"
  on public.appointments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. GENERATED LEGAL DOCUMENTS (SAVED BY USERS)
create table if not exists public.saved_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  template_key text not null,
  document_title text not null,
  document_number text not null,
  first_party text not null,
  second_party text not null,
  city text not null,
  contract_value text not null,
  effective_date date not null,
  compiled_content text not null,
  created_at timestamptz not null default now()
);

alter table public.saved_documents enable row level security;

create policy "Users can manage their own saved documents"
  on public.saved_documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. PT INCORPORATION CHECKLIST PROGRESS
create table if not exists public.checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  step_number integer not null,
  step_title text not null,
  completed boolean not null default false,
  notes text default '',
  updated_at timestamptz not null default now(),
  unique(user_id, step_number)
);

alter table public.checklist_progress enable row level security;

create policy "Users can manage their own checklist progress"
  on public.checklist_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. CORPORATE FILINGS & REQUESTS
create table if not exists public.corporate_filings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  filing_title text not null,
  filing_type text not null,
  company_name text not null,
  details text not null,
  status text not null default 'In Review' check (status in ('In Review', 'Drafting Deed', 'Awaiting Signature', 'Completed')),
  created_at timestamptz not null default now()
);

alter table public.corporate_filings enable row level security;

create policy "Users can manage their own corporate filings"
  on public.corporate_filings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. SUBSCRIPTION & PAYMENT TRANSACTIONS
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  invoice_number text not null,
  plan_key text not null,
  description text not null,
  amount_idr integer not null,
  payment_method text not null,
  status text not null default 'Paid',
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view and create their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
