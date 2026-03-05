-- Cashout function: allows users to sell back their open positions
-- Refunds the original bet amount and removes the bet from the pool

CREATE OR REPLACE FUNCTION cashout_bet(p_user_id uuid, p_bet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bet RECORD;
  v_market RECORD;
BEGIN
  -- Get the bet (must belong to this user)
  SELECT * INTO v_bet FROM bets WHERE id = p_bet_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bet not found');
  END IF;

  -- Get the market
  SELECT * INTO v_market FROM markets WHERE id = v_bet.market_id;
  IF v_market.resolved THEN
    RETURN jsonb_build_object('error', 'Market already resolved');
  END IF;

  -- Remove bet amount from the appropriate pool
  IF v_bet.side = 'YES' THEN
    UPDATE markets SET yes_pool = GREATEST(yes_pool - v_bet.amount, 0) WHERE id = v_bet.market_id;
  ELSE
    UPDATE markets SET no_pool = GREATEST(no_pool - v_bet.amount, 0) WHERE id = v_bet.market_id;
  END IF;

  -- Refund user balance
  UPDATE profiles SET balance = balance + v_bet.amount WHERE id = p_user_id;

  -- Log the cashout transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'cashout', v_bet.amount,
    'Cashout: ' || v_bet.side || ' on ' || v_market.candidate || ' — $' || v_bet.amount::text);

  -- Record market history snapshot after cashout
  INSERT INTO market_history (market_id, yes_pool, no_pool)
  SELECT id, yes_pool, no_pool FROM markets WHERE id = v_bet.market_id;

  -- Delete the bet
  DELETE FROM bets WHERE id = p_bet_id;

  RETURN jsonb_build_object('success', true, 'refund', v_bet.amount);
END;
$$;
