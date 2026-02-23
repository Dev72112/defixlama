# defiXlama Premium Features - Complete Roadmap

## Overview
Building 10 premium features to differentiate from competitors and justify $20/mo subscription.

---

## Database Schema Required

### Core Tables
```sql
-- Risk data table
CREATE TABLE protocol_risk_metrics (
  id UUID PRIMARY KEY,
  protocol_name TEXT,
  protocol_slug TEXT,
  chain TEXT,
  overall_risk_score NUMERIC, -- 0-100, higher = riskier
  hack_history JSONB, -- { count, last_date, total_lost_usd }
  audit_status TEXT, -- 'none', 'pending', 'passed', 'failed'
  audit_firms TEXT[], -- array of audit company names
  governance_risk_score NUMERIC, -- concentration, voting power
  dependency_risk JSONB, -- protocols this depends on
  contract_upgrade_risk TEXT, -- 'high', 'medium', 'low'
  tvl_concentration NUMERIC, -- % in top asset
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User alerts/preferences
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  protocol_id TEXT,
  alert_type TEXT, -- 'tvl_drop', 'risk_increase', 'governance_vote', 'price', etc
  threshold NUMERIC,
  threshold_type TEXT, -- 'percentage', 'absolute', 'crossing'
  enabled BOOLEAN DEFAULT TRUE,
  notification_channels JSONB, -- { email, webhook, discord, telegram }
  webhook_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Backtesting results
CREATE TABLE backtest_strategies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  description TEXT,
  protocols JSONB, -- array of protocol slugs with weights
  start_date DATE,
  end_date DATE,
  initial_capital NUMERIC,
  final_value NUMERIC,
  returns_pct NUMERIC,
  sharpe_ratio NUMERIC,
  max_drawdown NUMERIC,
  results_data JSONB, -- daily nav, metrics over time
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Predictions/Forecasts
CREATE TABLE protocol_predictions (
  id UUID PRIMARY KEY,
  protocol_name TEXT,
  protocol_slug TEXT,
  chain TEXT,
  prediction_date DATE,
  forecast_tvl NUMERIC,
  forecast_apy_yield NUMERIC,
  confidence_score NUMERIC, -- 0-100
  model_type TEXT, -- 'linear_regression', 'lstm', 'ensemble'
  created_at TIMESTAMP
);

-- API Keys & Usage
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  key_hash TEXT UNIQUE,
  name TEXT,
  last_used TIMESTAMP,
  quota_daily INTEGER DEFAULT 10000,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys,
  endpoint TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP
);

-- Governance data
CREATE TABLE governance_events (
  id UUID PRIMARY KEY,
  protocol_name TEXT,
  protocol_slug TEXT,
  event_type TEXT, -- 'proposal', 'vote', 'execution'
  event_title TEXT,
  description TEXT,
  voting_power_total NUMERIC,
  voting_power_for NUMERIC,
  voting_power_against NUMERIC,
  voting_power_abstain NUMERIC,
  external_url TEXT,
  event_date TIMESTAMP,
  created_at TIMESTAMP
);

-- Community sentiment
CREATE TABLE community_sentiment (
  id UUID PRIMARY KEY,
  protocol_name TEXT,
  protocol_slug TEXT,
  source TEXT, -- 'twitter', 'discord', 'telegram'
  sentiment_score NUMERIC, -- -1 to 1
  mention_count INTEGER,
  volume_24h NUMERIC,
  top_keywords JSONB,
  created_at TIMESTAMP
);
```

---

## Features Implementation Schedule

### Phase 1: Risk Scoring (Week 1-2)
**Files to create:**
- `src/components/RiskScoreCard.tsx` - Reusable risk display component
- `src/pages/RiskDashboard.tsx` - Full risk analytics page
- `src/hooks/useRiskMetrics.ts` - Risk data fetching
- `supabase/migrations/xxx_create_risk_tables.sql` - Schema

**Key metrics:**
- Overall risk score (0-100)
- Hack history + impact
- Audit status/firms
- Governance concentration
- Dependency risks
- Contract upgrade risks

**Integration points:**
- Risk card on all detail pages (Protocol, Token, DEX, etc.)
- Risk dashboard as dedicated page
- Risk filter on main pages

---

### Phase 2: Portfolio Alerts & Webhooks (Week 2-3)
**Files to create:**
- `src/components/AlertManager.tsx` - Alert CRUD interface
- `src/pages/AlertsConfig.tsx` - Settings page
- `src/hooks/useAlerts.ts` - Alert management
- `supabase/functions/alert-trigger/` - Edge function for evaluation
- `supabase/functions/webhook-dispatch/` - Send alerts

**Alert types:**
- TVL drop alerts
- Risk score increase
- Governance voting alerts
- Price movement
- Dependency alerts

**Notification channels:**
- Email
- Webhooks (user-defined)
- Discord/Telegram integration

---

### Phase 3: API Access Tier (Week 3)
**Files to create:**
- `src/pages/APIKeys.tsx` - Key management page
- `src/components/APIDocsPanel.tsx` - Documentation
- `src/hooks/useAPIManagement.ts`
- `supabase/functions/validate-api-key/` - Key validation

**Endpoints:**
- `/api/v1/protocols` - List with filters
- `/api/v1/risk/{protocol_slug}` - Risk metrics
- `/api/v1/predictions/{protocol_slug}` - Forecasts
- Rate limited to 10k/day for Pro tier

---

### Phase 4: Backtesting Simulator (Week 4)
**Files to create:**
- `src/pages/Backtester.tsx` - Full backtesting UI
- `src/components/BacktestBuilder.tsx` - Strategy builder
- `src/components/BacktestResults.tsx` - Results visualization
- `src/hooks/useBacktesting.ts`
- `src/lib/backtesting/engine.ts` - Core algorithm

**Features:**
- Select protocols + weights
- Choose date range
- Historical data simulation
- Calculate: returns, Sharpe ratio, max drawdown
- Save/load strategies

---

### Phase 5: Predictions/Forecasting (Week 4-5)
**Files to create:**
- `src/pages/Predictions.tsx` - Forecast dashboard
- `src/components/ForecastChart.tsx` - Visualization
- `src/hooks/usePredictions.ts`
- `scripts/forecast-model.py` - ML script (optional)

**Predicts:**
- TVL trends (30/60/90 day)
- APY changes
- Risk score evolution

*Note: Can start simple with linear regression, improve with ML later*

---

### Phase 6: Competition Intelligence (Week 5)
**Files to create:**
- `src/pages/ProtocolComparison.tsx` - Compare page
- `src/components/ComparisonMatrix.tsx`
- `src/hooks/useComparison.ts`

**Comparison matrix:**
- Side-by-side metrics
- Fee comparison
- TVL efficiency (TVL per user, per transaction)
- Audit history
- Risk scores
- Historical performance

---

### Phase 7: Governance Tracker (Week 5-6)
**Files to create:**
- `src/pages/Governance.tsx` - Governance dashboard
- `src/components/GovernanceVoting.tsx`
- `src/hooks/useGovernance.ts`

**Features:**
- Active proposals across chains
- Voting power breakdown
- Historical votes
- Governance risk per protocol

---

### Phase 8: Community Sentiment (Week 6)
**Files to create:**
- `src/pages/Sentiment.tsx` - Sentiment dashboard
- `src/components/SentimentChart.tsx`
- `src/hooks/useSentiment.ts`

**Data sources:**
- Twitter mentions + sentiment
- Discord activity
- Community keywords/themes

---

### Phase 9: Watchlist Export (Week 6)
**Files to create:**
- Export buttons on WatchlistPanel
- `src/lib/export.ts` - CSV/JSON/API format

**Formats:**
- CSV (Excel-compatible)
- JSON (API-ready)
- Portfolio tracker format

---

### Phase 10: Advanced Dashboard (Week 7)
**Create:**
- `src/pages/ProDashboard.tsx` - Unified Pro page
- Aggregates all premium features
- Custom widgets
- Real-time alerts

---

## Data Sources

| Feature | Primary Source | Secondary |
|---------|---|---|
| Risk Metrics | DefiLlama API + curated database | GitHub security repos |
| Predictions | Historical data + simple ML | Community forecasts |
| Governance | On-chain data aggregators | Protocol APIs |
| Sentiment | Twitter API | Discord/Telegram APIs |
| API Usage | Custom tracking | Supabase logs |

---

## Monetization

- **Free tier:** Basic features, view-only risk scores
- **Pro tier ($20/mo):** All features, 10k API calls/day, advanced alerts, backtesting
- **Free trial:** 3 months (hardcoded date check)

---

## Success Metrics

- Weekly active users using alerts
- API call volume
- Backtest strategy saves (engagement)
- Risk page visits
- Subscription conversion rate

---

## Notes

- Build incrementally, test each phase
- Prioritize UX over feature completeness
- Start with mock data where real data unavailable
- Plan for data pipeline improvements later
