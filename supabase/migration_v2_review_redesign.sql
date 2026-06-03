-- ============================================================
-- RecallStack V2 — Review System Redesign Migration
-- Run this in Supabase SQL Editor AFTER the initial migrations
-- ============================================================

-- ============================================================
-- 1. ALTER problems TABLE
-- ============================================================

-- Add archive flag
ALTER TABLE problems ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add review stage tracker (0-4, determines interval tier)
ALTER TABLE problems ADD COLUMN IF NOT EXISTS review_stage integer DEFAULT 0;

-- Index for archive filtering
CREATE INDEX IF NOT EXISTS idx_problems_archived ON problems(is_archived);

-- Drop old constraint before updating values
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_strength_status_check;

-- Migrate strength_status values: Strong → Easy Recall, Medium → Hard Recall, Weak → Forgot Completely
UPDATE problems SET strength_status = 'Easy Recall' WHERE strength_status = 'Strong';
UPDATE problems SET strength_status = 'Hard Recall' WHERE strength_status = 'Medium';
UPDATE problems SET strength_status = 'Forgot Completely' WHERE strength_status = 'Weak';

-- Set review_stage from existing review_count (capped at 4)
UPDATE problems SET review_stage = LEAST(review_count, 4);

-- Add new constraint for strength_status
ALTER TABLE problems ADD CONSTRAINT problems_strength_status_check
  CHECK (strength_status IN ('Easy Recall', 'Hard Recall', 'Forgot Completely'));

-- ============================================================
-- 2. ALTER reviews TABLE
-- ============================================================

-- Drop old constraint before updating values
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_recall_quality_check;

-- Migrate recall_quality values
UPDATE reviews SET recall_quality = 'Easy Recall' WHERE recall_quality = 'Strong';
UPDATE reviews SET recall_quality = 'Hard Recall' WHERE recall_quality = 'Medium';
UPDATE reviews SET recall_quality = 'Forgot Completely' WHERE recall_quality = 'Weak';

-- Add new constraint for recall_quality
ALTER TABLE reviews ADD CONSTRAINT reviews_recall_quality_check
  CHECK (recall_quality IN ('Easy Recall', 'Hard Recall', 'Forgot Completely'));

-- ============================================================
-- 3. CREATE user_settings TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_review_limit integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. CREATE patterns TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  confidence integer DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence);

-- RLS for patterns
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns"
  ON patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON patterns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON patterns FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. CREATE problem_patterns JUNCTION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS problem_patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  pattern_id uuid REFERENCES patterns(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(problem_id, pattern_id)
);

CREATE INDEX IF NOT EXISTS idx_problem_patterns_problem ON problem_patterns(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_patterns_pattern ON problem_patterns(pattern_id);

-- RLS for problem_patterns
ALTER TABLE problem_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own problem_patterns"
  ON problem_patterns FOR SELECT
  USING (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own problem_patterns"
  ON problem_patterns FOR INSERT
  WITH CHECK (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own problem_patterns"
  ON problem_patterns FOR DELETE
  USING (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));
