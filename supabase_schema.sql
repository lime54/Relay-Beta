-- Onboarding Progress for Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all onboarded profiles" ON public.users FOR SELECT USING (onboarded = true OR auth.uid() = id);
CREATE POLICY "Users can update their own record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Expanded Athlete Profile Table
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Step 1: Basic Profile
    preferred_name TEXT,
    country TEXT DEFAULT 'United States',
    status TEXT, -- Current athletic/academic status
    linkedin_url TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    theme_gradient TEXT,

    -- Step 2: Athletic Background
    is_athlete BOOLEAN DEFAULT TRUE,
    school TEXT, -- Primary college/university
    secondary_college TEXT,
    sports JSONB DEFAULT '[]'::jsonb, -- Array of {name, division, role, start_year, end_year}
    high_level BOOLEAN, -- For non-athletes
    high_level_sports TEXT,
    high_level_details TEXT,

    -- Step 3: Academic Details
    year TEXT, -- Current school year
    majors TEXT,
    minors TEXT,
    grad_year TEXT,
    gpa TEXT,
    citizenship TEXT DEFAULT 'United States',
    work_auth TEXT,
    international_interest BOOLEAN DEFAULT FALSE,
    target_countries TEXT,

    -- Step 4: Career Interests
    career_goals TEXT[] DEFAULT '{}',
    career_sectors TEXT[] DEFAULT '{}',
    locations TEXT,
    hours TEXT,
    aspiration TEXT,

    -- Step 5: Verification
    verification_methods TEXT[] DEFAULT '{}',
    verification_status BOOLEAN DEFAULT FALSE,
    resume_url TEXT,
    scheduling_url TEXT, -- Link for Calendly, SavvyCal, etc.
    proof_details JSONB DEFAULT '{}'::jsonb -- Stores additional verification data
);

-- Enable RLS and Policies for athlete_profiles
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any athlete profile" 
ON public.athlete_profiles FOR SELECT 
USING (TRUE);

CREATE POLICY "Users can update their own athlete profile" 
ON public.athlete_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own athlete profile" 
ON public.athlete_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Migration: Create Messaging Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON public.messages(request_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);
