-- Additional Premium Tables for Complete Feature Support

-- User Profiles and Subscriptions
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Subscription info
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'paused', 'expired', 'cancelled'
  subscription_started_at TIMESTAMP,
  subscription_expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT TRUE,

  -- Preferences
  email_preferences JSONB DEFAULT '{"alerts": true, "newsletter": true}',
  theme_preference TEXT DEFAULT 'system', -- 'light', 'dark', 'system'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Watchlist
CREATE TABLE IF NOT EXISTS public.watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Items in watchlist
  items JSONB DEFAULT '[]', -- array: { type, slug/id, added_at }

  is_public BOOLEAN DEFAULT FALSE,
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Positions
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Position info
  protocol_slug TEXT NOT NULL,
  position_type TEXT NOT NULL, -- 'tvl', 'governance', 'custom'
  quantity NUMERIC NOT NULL DEFAULT 0,
  entry_price NUMERIC,

  -- Cost basis
  cost_basis NUMERIC DEFAULT 0,
  entry_date TIMESTAMP DEFAULT NOW(),

  -- Metadata
  notes TEXT,
  tags JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Whale Activity Tracking
CREATE TABLE IF NOT EXISTS public.whale_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction info
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  protocol_slug TEXT NOT NULL,
  chain TEXT NOT NULL,

  -- Transaction details
  amount NUMERIC NOT NULL,
  amount_usd NUMERIC,
  token_symbol TEXT,

  -- Classification
  activity_type TEXT, -- 'deposit', 'withdrawal', 'swap', 'stake'
  whale_address TEXT, -- if from known whale

  tx_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Yield Farming Opportunities Cache
CREATE TABLE IF NOT EXISTS public.yield_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  protocol_slug TEXT NOT NULL,
  chain TEXT NOT NULL,
  pool_name TEXT NOT NULL,

  -- Yield metrics
  apy_base NUMERIC DEFAULT 0,
  apy_reward NUMERIC DEFAULT 0,
  apy_total NUMERIC DEFAULT 0,

  tvl_usd NUMERIC DEFAULT 0,
  liquidity_usd NUMERIC DEFAULT 0,

  -- Risk info
  risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  audit_status TEXT DEFAULT 'unknown',

  -- Assets
  token_symbols JSONB DEFAULT '[]',
  base_token TEXT,

  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(protocol_slug, chain, pool_name)
);

-- Market Snapshots for Historical Analysis
CREATE TABLE IF NOT EXISTS public.market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Global metrics
  total_tvl_usd NUMERIC,
  total_protocols INTEGER,
  active_users INTEGER,

  -- Top performers
  top_chains JSONB, -- array: { chain, tvl }
  top_protocols JSONB, -- array: { slug, tvl, change_7d }

  snapshot_date TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date::DATE)
);

-- Correlation Analysis Data Cache
CREATE TABLE IF NOT EXISTS public.asset_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  asset1_slug TEXT NOT NULL,
  asset2_slug TEXT NOT NULL,

  -- Correlation coefficient -1 to 1
  correlation_30d NUMERIC,
  correlation_90d NUMERIC,
  correlation_1y NUMERIC,

  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(asset1_slug, asset2_slug)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whale_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User profiles: users can see public profiles, manage own
CREATE POLICY "profiles_read_public" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_manage_own" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Watchlist: users manage own, can view public
CREATE POLICY "watchlist_manage_own" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "watchlist_view_public" ON public.watchlist
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Portfolio: users manage own
CREATE POLICY "portfolio_manage_own" ON public.portfolio_positions
  FOR ALL USING (auth.uid() = user_id);

-- Whale activity: public read
CREATE POLICY "whale_activity_public_read" ON public.whale_activity
  FOR SELECT USING (true);

-- Yield opportunities: public read
CREATE POLICY "yield_opportunities_public_read" ON public.yield_opportunities
  FOR SELECT USING (true);

-- Market snapshots: public read
CREATE POLICY "market_snapshots_public_read" ON public.market_snapshots
  FOR SELECT USING (true);

-- Asset correlations: public read
CREATE POLICY "asset_correlations_public_read" ON public.asset_correlations
  FOR SELECT USING (true);

-- Create Indexes for Performance
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_public ON public.watchlist(is_public);
CREATE INDEX idx_portfolio_user ON public.portfolio_positions(user_id);
CREATE INDEX idx_portfolio_protocol ON public.portfolio_positions(protocol_slug);
CREATE INDEX idx_whale_activity_protocol ON public.whale_activity(protocol_slug);
CREATE INDEX idx_whale_activity_chain ON public.whale_activity(chain);
CREATE INDEX idx_whale_activity_date ON public.whale_activity(tx_date);
CREATE INDEX idx_yield_protocol ON public.yield_opportunities(protocol_slug);
CREATE INDEX idx_yield_chain ON public.yield_opportunities(chain);
CREATE INDEX idx_market_snapshots_date ON public.market_snapshots(snapshot_date);
CREATE INDEX idx_correlations_assets ON public.asset_correlations(asset1_slug, asset2_slug);
