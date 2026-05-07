-- Migration 003: Create submission_bundles table (if missing)
-- Run this in Supabase Dashboard → SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.submission_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_start_iso TEXT NOT NULL,
  task_id UUID REFERENCES public.tasks(id),
  github_url TEXT,
  live_url TEXT,
  demo_video_url TEXT,
  screenshot_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'accepted', 'rejected')),
  admin_feedback TEXT DEFAULT '',
  points_awarded INT NOT NULL DEFAULT 0,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, cycle_start_iso)
);

ALTER TABLE public.submission_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_only_submissions" ON public.submission_bundles;
CREATE POLICY "service_only_submissions"
  ON public.submission_bundles FOR ALL USING (false);
