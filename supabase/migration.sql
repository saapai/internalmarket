-- =============================================
-- SEP Internal Prediction Market - Full Schema
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text,
  display_name text,
  balance numeric default 0 check (balance >= 0),
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- Markets table
create table if not exists public.markets (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories on delete cascade not null,
  candidate text not null,
  yes_pool numeric default 0 check (yes_pool >= 0),
  no_pool numeric default 0 check (no_pool >= 0),
  resolved boolean default false,
  outcome boolean,
  created_at timestamptz default now()
);

-- Bets table
create table if not exists public.bets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  market_id uuid references public.markets on delete cascade not null,
  side text not null check (side in ('YES', 'NO')),
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('deposit', 'bet', 'payout', 'withdrawal')),
  amount numeric not null,
  description text,
  created_at timestamptz default now()
);

-- =============================================
-- INDEXES
-- =============================================

create index if not exists idx_markets_category on public.markets(category_id);
create index if not exists idx_bets_user on public.bets(user_id);
create index if not exists idx_bets_market on public.bets(market_id);
create index if not exists idx_transactions_user on public.transactions(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.markets enable row level security;
alter table public.bets enable row level security;
alter table public.transactions enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Categories: readable by all
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- Markets: readable by all
create policy "Markets are viewable by everyone"
  on public.markets for select
  using (true);

-- Markets: updatable by all authenticated (for pool updates via RPC)
create policy "Markets updatable by authenticated"
  on public.markets for update
  using (auth.role() = 'authenticated');

-- Bets: users can see all bets, insert their own
create policy "Bets are viewable by everyone"
  on public.bets for select
  using (true);

create policy "Users can insert own bets"
  on public.bets for insert
  with check (auth.uid() = user_id);

-- Transactions: users can see their own
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Admin policies for transactions (allow admins to insert for any user)
create policy "Admins can insert any transaction"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admin policies for profiles (allow admins to update any profile balance)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to place a bet (atomic operation)
create or replace function public.place_bet(
  p_user_id uuid,
  p_market_id uuid,
  p_side text,
  p_amount numeric
)
returns json
language plpgsql
security definer
as $$
declare
  v_balance numeric;
  v_market record;
  v_bet_id uuid;
begin
  -- Check market is not resolved
  select * into v_market from public.markets where id = p_market_id;
  if v_market.resolved then
    return json_build_object('error', 'Market is already resolved');
  end if;

  -- Check user balance
  select balance into v_balance from public.profiles where id = p_user_id;
  if v_balance < p_amount then
    return json_build_object('error', 'Insufficient balance');
  end if;

  -- Deduct balance
  update public.profiles
  set balance = balance - p_amount
  where id = p_user_id;

  -- Update market pools
  if p_side = 'YES' then
    update public.markets
    set yes_pool = yes_pool + p_amount
    where id = p_market_id;
  else
    update public.markets
    set no_pool = no_pool + p_amount
    where id = p_market_id;
  end if;

  -- Create bet record
  insert into public.bets (user_id, market_id, side, amount)
  values (p_user_id, p_market_id, p_side, p_amount)
  returning id into v_bet_id;

  -- Create transaction record
  insert into public.transactions (user_id, type, amount, description)
  values (
    p_user_id,
    'bet',
    -p_amount,
    'Bet ' || p_amount || ' on ' || p_side || ' for ' || v_market.candidate
  );

  return json_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'new_balance', v_balance - p_amount
  );
end;
$$;

-- Function to resolve a market and distribute payouts
create or replace function public.resolve_market(
  p_market_id uuid,
  p_outcome boolean
)
returns json
language plpgsql
security definer
as $$
declare
  v_market record;
  v_total_pool numeric;
  v_winning_pool numeric;
  v_bet record;
  v_payout numeric;
  v_total_paid numeric := 0;
begin
  -- Get market
  select * into v_market from public.markets where id = p_market_id;
  if v_market.resolved then
    return json_build_object('error', 'Market already resolved');
  end if;

  v_total_pool := v_market.yes_pool + v_market.no_pool;

  if p_outcome then
    v_winning_pool := v_market.yes_pool;
  else
    v_winning_pool := v_market.no_pool;
  end if;

  -- Mark market as resolved
  update public.markets
  set resolved = true, outcome = p_outcome
  where id = p_market_id;

  -- If no one bet on winning side, or no bets at all, skip payouts
  if v_winning_pool > 0 and v_total_pool > 0 then
    -- Distribute payouts to winners
    for v_bet in
      select * from public.bets
      where market_id = p_market_id
      and side = (case when p_outcome then 'YES' else 'NO' end)
    loop
      v_payout := (v_bet.amount / v_winning_pool) * v_total_pool;

      -- Credit winner
      update public.profiles
      set balance = balance + v_payout
      where id = v_bet.user_id;

      -- Record payout transaction
      insert into public.transactions (user_id, type, amount, description)
      values (
        v_bet.user_id,
        'payout',
        v_payout,
        'Payout from ' || v_market.candidate || ' (' ||
        (case when p_outcome then 'YES' else 'NO' end) || ' won)'
      );

      v_total_paid := v_total_paid + v_payout;
    end loop;
  end if;

  return json_build_object(
    'success', true,
    'total_pool', v_total_pool,
    'winning_pool', v_winning_pool,
    'total_paid', v_total_paid
  );
end;
$$;
