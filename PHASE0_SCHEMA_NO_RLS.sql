-- ======================================================
-- FamilyNest Phase 2 Locked Schema (RLS DISABLED)
-- NO RLS - Security enforced via allowlist only
-- ======================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- for uuid_generate_v4()

-- ======================================================
-- TABLES
-- ======================================================

-- app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email text NOT NULL
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY,
    email text NOT NULL,
    display_name text,
    avatar_url text,
    role text,
    dob date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- items
CREATE TABLE IF NOT EXISTS public.items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind text NOT NULL,
    author_id uuid,
    author_email text NOT NULL,
    visibility text DEFAULT 'all',
    body text,
    media_urls text[],
    parent_id uuid,
    start_at timestamptz,
    end_at timestamptz,
    data jsonb DEFAULT '{}'::jsonb,
    is_deleted boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- interactions
CREATE TABLE IF NOT EXISTS public.interactions (
    user_email text NOT NULL,
    item_id uuid NOT NULL,
    type text NOT NULL,
    answer_index integer,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_email, item_id, type)
);

-- quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text text NOT NULL,
    options text[] NOT NULL,
    order_index integer NOT NULL
);

-- quiz_answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    question_id uuid,
    answer_index integer NOT NULL,
    locked_at timestamptz
);

-- quiz_guesses
CREATE TABLE IF NOT EXISTS public.quiz_guesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guesser_id uuid NOT NULL,
    question_id uuid NOT NULL,
    target_user_id uuid NOT NULL,
    guessed_answer integer NOT NULL,
    is_correct boolean,
    created_at timestamptz DEFAULT now()
);

-- reflections
CREATE TABLE IF NOT EXISTS public.reflections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    mood_emoji text NOT NULL,
    reflection_text text,
    week_start date NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- scenario_questions
CREATE TABLE IF NOT EXISTS public.scenario_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text text NOT NULL,
    options text[] NOT NULL,
    correct_index integer NOT NULL,
    order_index integer NOT NULL
);

-- scenario_answers
CREATE TABLE IF NOT EXISTS public.scenario_answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    question_id uuid,
    chosen_index integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- islamic_questions (Phase 2)
CREATE TABLE IF NOT EXISTS public.islamic_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text text NOT NULL,
    options text[] NOT NULL,              -- e.g. {Yes,No}, {Good,Bad,Neutral}
    correct_index integer,                -- can be null if opinion-based
    explanation_correct text,             -- shown if correct
    explanation_incorrect text,           -- shown if incorrect
    order_index integer NOT NULL,         -- rotation order
    category text,                        -- Life, Faith, Creation, Respect, Behavior
    created_at timestamptz DEFAULT now()
);

-- ======================================================
-- RLS DISABLE (NO RLS SECURITY MODEL)
-- ======================================================
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_guesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.islamic_questions DISABLE ROW LEVEL SECURITY;

-- ======================================================
-- DROP ALL EXISTING POLICIES (NO POLICIES NEEDED)
-- ======================================================
-- Remove any existing policies
DROP POLICY IF EXISTS "profiles_self" ON public.profiles;
DROP POLICY IF EXISTS "items_self" ON public.items;
DROP POLICY IF EXISTS "interactions_self" ON public.interactions;
DROP POLICY IF EXISTS "quiz_answers_self" ON public.quiz_answers;
DROP POLICY IF EXISTS "quiz_guesses_self" ON public.quiz_guesses;
DROP POLICY IF EXISTS "reflections_self" ON public.reflections;
DROP POLICY IF EXISTS "scenario_answers_self" ON public.scenario_answers;
DROP POLICY IF EXISTS "islamic_questions_read" ON public.islamic_questions;

-- ======================================================
-- GRANTS - AUTHENTICATED ONLY
-- ======================================================

-- Revoke all from anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant full privileges to authenticated role only
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure new tables automatically grant privileges to authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- Ensure new tables do NOT grant to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

-- ======================================================
-- SECURITY SUMMARY
-- ======================================================
-- ❌ RLS is completely disabled for all tables
-- ✅ authenticated role = full privileges across all tables
-- ❌ anon role = no privileges  
-- ✅ Security enforced via Supabase Auth allowlist (4 hardcoded emails)
-- ✅ New tables automatically grant privileges to authenticated only
-- ❌ No row-level policies - full table access for authenticated users