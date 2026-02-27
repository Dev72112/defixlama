-- Migration: Create user_profiles table with subscription tier support
-- This table stores user profile data and subscription information

CREATE TABLE IF NOT EXISTS user_profiles (
  -- Primary Key
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Info
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,

  -- Subscription Info
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'expired', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,

  -- Usage Limits
  api_key_quota INT DEFAULT 100,
  api_keys_used INT DEFAULT 0,
  alerts_count INT DEFAULT 1,
  alerts_used INT DEFAULT 0,

  -- Billing Info
  payment_method VARCHAR(50),
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT subscription_tier_valid CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  CONSTRAINT subscription_status_valid CHECK (subscription_status IN ('active', 'paused', 'expired', 'cancelled'))
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create index on stripe_customer_id for payment lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);

-- Create index on subscription_tier for analytics
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(subscription_tier);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile on signup
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role (for backend) can do everything
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access"
  ON user_profiles
  USING (auth.role() = 'service_role');

-- Create a function to get user tier for authorization checks
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT subscription_tier FROM user_profiles WHERE id = user_id),
    'free'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to check if user is premium (pro or enterprise)
CREATE OR REPLACE FUNCTION is_premium_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id
    AND subscription_tier IN ('pro', 'enterprise')
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to create default profile on auth.users signup
-- This will be called by a trigger on auth.users if you want auto-creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, subscription_tier, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment this trigger if you want auto-create profiles on signup:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
