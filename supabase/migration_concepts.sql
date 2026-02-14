-- ============================================================
-- RecallStack — Concepts Learning Section
-- Run this in Supabase SQL Editor AFTER the initial migration
-- ============================================================

-- Concepts table
CREATE TABLE concepts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'OS',
  topic text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  next_review_date date DEFAULT (CURRENT_DATE + 4),
  interval_days integer DEFAULT 4,
  strength_status text CHECK (strength_status IN ('Weak', 'Medium', 'Strong')) DEFAULT 'Weak',
  review_count integer DEFAULT 0
);

-- Concept Reviews table
CREATE TABLE concept_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id uuid REFERENCES concepts(id) ON DELETE CASCADE NOT NULL,
  review_date date DEFAULT CURRENT_DATE,
  recall_quality text CHECK (recall_quality IN ('Strong', 'Medium', 'Weak')) NOT NULL,
  next_interval_days integer NOT NULL
);

-- Indexes
CREATE INDEX idx_concepts_user_id ON concepts(user_id);
CREATE INDEX idx_concepts_next_review ON concepts(next_review_date);
CREATE INDEX idx_concepts_strength ON concepts(strength_status);
CREATE INDEX idx_concepts_subject ON concepts(subject);
CREATE INDEX idx_concept_reviews_concept_id ON concept_reviews(concept_id);
CREATE INDEX idx_concept_reviews_date ON concept_reviews(review_date);

-- Row Level Security
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for concepts
CREATE POLICY "Users can view own concepts"
  ON concepts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts"
  ON concepts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concepts"
  ON concepts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own concepts"
  ON concepts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for concept_reviews
CREATE POLICY "Users can view own concept reviews"
  ON concept_reviews FOR SELECT
  USING (concept_id IN (SELECT id FROM concepts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own concept reviews"
  ON concept_reviews FOR INSERT
  WITH CHECK (concept_id IN (SELECT id FROM concepts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own concept reviews"
  ON concept_reviews FOR UPDATE
  USING (concept_id IN (SELECT id FROM concepts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own concept reviews"
  ON concept_reviews FOR DELETE
  USING (concept_id IN (SELECT id FROM concepts WHERE user_id = auth.uid()));
