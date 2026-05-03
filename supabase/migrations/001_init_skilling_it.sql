-- Run in Supabase SQL Editor or via CLI migrations
-- SKILLING IT — core tables (backend uses service role only for writes)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Beginner',
  title TEXT NOT NULL,
  objective TEXT DEFAULT '',
  watch_segment TEXT DEFAULT '',
  expected_output TEXT DEFAULT '',
  description TEXT DEFAULT '',
  effort TEXT DEFAULT '~1 hr',
  yt_query TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  skill_domain TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  points INT NOT NULL DEFAULT 0,
  loop_started_at TIMESTAMPTZ,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.set_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.email_otps (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.signup_tokens (
  email TEXT NOT NULL,
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_cycle_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  cycle_start_iso TEXT NOT NULL,
  cycle_end_iso TEXT NOT NULL,
  selection_deadline_iso TEXT NOT NULL,
  locked_task_id UUID REFERENCES public.tasks(id),
  auto_assigned BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'accepted', 'rejected')),
  admin_feedback TEXT DEFAULT '',
  points_awarded INT NOT NULL DEFAULT 0,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, cycle_start_iso)
);

CREATE TABLE IF NOT EXISTS public.be_relevant_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  related_tasks TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cycle_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.be_relevant_posts ENABLE ROW LEVEL SECURITY;

-- Backend uses service_role key — deny direct anon access except read where needed:
CREATE POLICY "service_only_tasks" ON public.tasks FOR ALL USING (false);
CREATE POLICY "service_only_profiles" ON public.profiles FOR ALL USING (false);
CREATE POLICY "service_only_otps" ON public.email_otps FOR ALL USING (false);
CREATE POLICY "service_only_signup_tokens" ON public.signup_tokens FOR ALL USING (false);
CREATE POLICY "service_only_cycle" ON public.user_cycle_state FOR ALL USING (false);
CREATE POLICY "service_only_submissions" ON public.submission_bundles FOR ALL USING (false);

CREATE POLICY "deny_all_news" ON public.be_relevant_posts FOR ALL USING (false);

-- service_role JWT bypasses RLS — all reads/writes go through your Express API.
