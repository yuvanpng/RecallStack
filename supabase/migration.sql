-- ============================================================
-- RecallStack Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Problems table
CREATE TABLE problems (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  platform text NOT NULL DEFAULT 'LeetCode',
  difficulty text CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL DEFAULT 'Medium',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  next_review_date date DEFAULT (CURRENT_DATE + 4),
  interval_days integer DEFAULT 4,
  strength_status text CHECK (strength_status IN ('Weak', 'Medium', 'Strong')) DEFAULT 'Weak',
  review_count integer DEFAULT 0
);

-- Reviews table
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  review_date date DEFAULT CURRENT_DATE,
  recall_quality text CHECK (recall_quality IN ('Strong', 'Medium', 'Weak')) NOT NULL,
  next_interval_days integer NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_problems_next_review ON problems(next_review_date);
CREATE INDEX idx_problems_strength ON problems(strength_status);
CREATE INDEX idx_reviews_problem_id ON reviews(problem_id);
CREATE INDEX idx_reviews_review_date ON reviews(review_date);

-- Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for problems: users can only CRUD their own rows
CREATE POLICY "Users can view own problems"
  ON problems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
  ON problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
  ON problems FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
  ON problems FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for reviews: users can only CRUD reviews for their own problems
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (problem_id IN (SELECT id FROM problems WHERE user_id = auth.uid()));
