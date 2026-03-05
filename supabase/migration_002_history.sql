-- =============================================
-- Market history: track probability over time
-- Run this AFTER migration.sql
-- =============================================

create table if not exists public.market_history (
  id uuid default uuid_generate_v4() primary key,
  market_id uuid references public.markets on delete cascade not null,
  yes_pool numeric not null,
  no_pool numeric not null,
  created_at timestamptz default now()
);

create index if not exists idx_market_history_market on public.market_history(market_id);
create index if not exists idx_market_history_time on public.market_history(market_id, created_at);

-- RLS: everyone can read history
alter table public.market_history enable row level security;

create policy "Market history is viewable by everyone"
  on public.market_history for select
  using (true);

-- Allow inserts from security definer functions
create policy "System can insert market history"
  on public.market_history for insert
  with check (true);

-- Enable realtime
alter publication supabase_realtime add table public.market_history;

-- Update place_bet function to record history snapshot
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

  -- Record probability snapshot
  select * into v_market from public.markets where id = p_market_id;
  insert into public.market_history (market_id, yes_pool, no_pool)
  values (p_market_id, v_market.yes_pool, v_market.no_pool);

  return json_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'new_balance', v_balance - p_amount
  );
end;
$$;
