-- Migration: Paystack Billing Integration Schema updates
-- Adds subscription-related tracking fields to profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_replenishment_date TIMESTAMPTZ DEFAULT now();

-- Indices for optimized lookups on webhook queries
CREATE INDEX IF NOT EXISTS idx_profiles_paystack_customer ON public.profiles(paystack_customer_code);
CREATE INDEX IF NOT EXISTS idx_profiles_paystack_subscription ON public.profiles(paystack_subscription_code);
