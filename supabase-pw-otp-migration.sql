-- Password Change OTP Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS password_change_otps (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        VARCHAR(6)  NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_pw_otps_user ON password_change_otps(user_id);

-- Auto-delete expired codes after 1 hour (optional cleanup)
-- You can run this as a cron or just leave it -- expired codes are rejected anyway.

-- RLS: only service role can read/write (API routes use service role key)
ALTER TABLE password_change_otps ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS needed — all access via service role API routes only
