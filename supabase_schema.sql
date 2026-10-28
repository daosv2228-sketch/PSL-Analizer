-- Supabase SQL Schema for PSL Analyzer & Telegram Bot
-- Run this in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS telegram_users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  timezone TEXT DEFAULT 'Europe/Moscow',
  is_pro BOOLEAN DEFAULT FALSE,
  has_30_day_plan BOOLEAN DEFAULT FALSE,
  plan_start_date TIMESTAMPTZ,
  stars_balance INTEGER DEFAULT 0,
  purchases JSONB DEFAULT '[]'::jsonb,
  scans_count INTEGER DEFAULT 0,
  referrals INTEGER DEFAULT 0,
  referred_by TEXT,
  scans JSONB DEFAULT '[]'::jsonb,
  completed_habits JSONB DEFAULT '{}'::jsonb,
  last_morning_notification_day_sent INTEGER,
  last_evening_notification_day_sent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_telegram_users_username ON telegram_users(username);
CREATE INDEX IF NOT EXISTS idx_telegram_users_has_plan ON telegram_users(has_30_day_plan);

-- Row Level Security (RLS)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Allow service_role key full unrestricted access (used safely on Render backend)
CREATE POLICY "Service Role Full Access"
  ON telegram_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
