-- Run this in Supabase SQL Editor

-- 1. Add payment columns to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL,            -- 'succeeded' | 'failed' | 'refunded'
  deposit_only BOOLEAN DEFAULT FALSE,
  receipt_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);

-- 4. Enable RLS on payments (service role writes via webhook)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (webhook uses anon key; adjust if using service key)
CREATE POLICY "Allow all on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);
