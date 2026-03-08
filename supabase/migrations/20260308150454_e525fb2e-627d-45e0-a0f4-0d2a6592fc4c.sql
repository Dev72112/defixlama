-- Add pro_plus to subscription_tier enum
ALTER TYPE public.subscription_tier ADD VALUE 'pro_plus' AFTER 'pro';

-- Rename stripe columns to paddle
ALTER TABLE public.subscriptions RENAME COLUMN stripe_customer_id TO paddle_customer_id;
ALTER TABLE public.subscriptions RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;