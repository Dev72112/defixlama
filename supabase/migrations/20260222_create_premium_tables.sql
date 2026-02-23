-- Premium Features: Risk Metrics Table
CREATE TABLE IF NOT EXISTS public.protocol_risk_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name TEXT NOT NULL,
  protocol_slug TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL,
  overall_risk_score NUMERIC DEFAULT 0, -- 0-100, higher = riskier
  
  -- Hack history
  hack_count INTEGER DEFAULT 0,
  hack_total_lost_usd NUMERIC DEFAULT 0,
  last_hack_date TIMESTAMP NULL,
  
  -- Audit info
  audit_status TEXT DEFAULT 'none', -- 'none', 'pending', 'passed', 'failed'
  audit_firms TEXT[] DEFAULT '{}', -- array of audit company names
  
  -- Governance risk
  governance_risk_score NUMERIC DEFAULT 0, -- 0-100
  governance_concentration_pct NUMERIC DEFAULT 0, -- % controlled by top voter
  
  -- Dependency & contract risks
  dependency_count INTEGER DEFAULT 0,
  contract_upgrade_risk TEXT DEFAULT 'low', -- 'high', 'medium', 'low'
  
  -- TVL concentration
  tvl_concentration_pct NUMERIC DEFAULT 0, -- % in top asset
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Alert Configuration
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_slug TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'tvl_drop', 'risk_increase', 'governance_vote', 'hack_detected'
  threshold NUMERIC,
  threshold_type TEXT, -- 'percentage', 'absolute', 'crossing'
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification preferences (JSON)
  email_enabled BOOLEAN DEFAULT TRUE,
  webhook_url TEXT,
  webhook_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Backtesting Strategies
CREATE TABLE IF NOT EXISTS public.backtest_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Strategy definition
  protocols JSONB, -- array: { slug, weight }
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_capital NUMERIC DEFAULT 10000,
  
  -- Results
  final_value NUMERIC,
  returns_pct NUMERIC,
  sharpe_ratio NUMERIC,
  max_drawdown NUMERIC,
  win_days INTEGER,
  total_days INTEGER,
  
  -- Historical data for chart
  daily_nav JSONB, -- array: { date, nav, returns_pct }
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Protocol Predictions/Forecasts
CREATE TABLE IF NOT EXISTS public.protocol_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_slug TEXT NOT NULL,
  chain TEXT NOT NULL,
  prediction_date DATE NOT NULL,
  
  predicted_tvl NUMERIC,
  predicted_apy NUMERIC,
  confidence_score NUMERIC, -- 0-100
  model_type TEXT, -- 'linear_regression', 'ensemble'
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(protocol_slug, prediction_date, model_type)
);

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL, -- first 8 chars visible
  key_hash TEXT NOT NULL UNIQUE, -- sha256 hash
  name TEXT NOT NULL,
  
  quota_daily INTEGER DEFAULT 10000,
  enabled BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Usage Tracking
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Governance Events
CREATE TABLE IF NOT EXISTS public.governance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_slug TEXT NOT NULL,
  chain TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'proposal', 'vote_started', 'vote_ended'
  event_title TEXT NOT NULL,
  description TEXT,
  
  -- Voting data
  voting_power_total NUMERIC,
  voting_power_for NUMERIC,
  voting_power_against NUMERIC,
  voting_power_abstain NUMERIC,
  
  external_url TEXT,
  event_date TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community Sentiment
CREATE TABLE IF NOT EXISTS public.community_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_slug TEXT NOT NULL,
  chain TEXT NOT NULL,
  source TEXT NOT NULL, -- 'twitter', 'discord', 'telegram'
  
  sentiment_score NUMERIC, -- -1.0 to 1.0
  mention_count INTEGER,
  volume_24h NUMERIC,
  
  top_keywords JSONB, -- array: { keyword, count }
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(protocol_slug, source, created_at::DATE)
);

-- Enable RLS
ALTER TABLE public.protocol_risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_sentiment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Risk metrics: public read
CREATE POLICY "risk_metrics_public_read" ON public.protocol_risk_metrics
  FOR SELECT USING (true);

-- User alerts: users can only manage their own
CREATE POLICY "user_alerts_own" ON public.user_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Backtest strategies: users can only see their own
CREATE POLICY "backtest_strategies_own" ON public.backtest_strategies
  FOR ALL USING (auth.uid() = user_id);

-- API keys: users can only see their own
CREATE POLICY "api_keys_own" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- API usage: read own usage
CREATE POLICY "api_usage_read_own" ON public.api_usage
  FOR SELECT USING (
    api_key_id IN (
      SELECT id FROM public.api_keys WHERE user_id = auth.uid()
    )
  );

-- Governance: public read
CREATE POLICY "governance_public_read" ON public.governance_events
  FOR SELECT USING (true);

-- Sentiment: public read
CREATE POLICY "sentiment_public_read" ON public.community_sentiment
  FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_risk_metrics_protocol ON public.protocol_risk_metrics(protocol_slug);
CREATE INDEX idx_risk_metrics_chain ON public.protocol_risk_metrics(chain);
CREATE INDEX idx_user_alerts_user ON public.user_alerts(user_id);
CREATE INDEX idx_user_alerts_protocol ON public.user_alerts(protocol_slug);
CREATE INDEX idx_backtest_user ON public.backtest_strategies(user_id);
CREATE INDEX idx_predictions_protocol ON public.protocol_predictions(protocol_slug);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_usage_key ON public.api_usage(api_key_id);
CREATE INDEX idx_api_usage_created ON public.api_usage(created_at);
CREATE INDEX idx_governance_protocol ON public.governance_events(protocol_slug);
CREATE INDEX idx_sentiment_protocol ON public.community_sentiment(protocol_slug);
