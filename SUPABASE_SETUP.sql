-- ==================================================================================
-- SUPABASE SETUP — Profiles & Friends System
-- Run this in the Supabase SQL Editor to enable the full social system.
-- ==================================================================================

-- 1. PROFILES TABLE
-- Stores public user information and game statistics.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  stats JSONB DEFAULT '{
    "impostor": {"wins": 0, "games": 0},
    "spyfall": {"wins": 0, "games": 0},
    "coup": {"wins": 0, "games": 0},
    "chkobba": {"wins": 0, "games": 0}
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- 2. FRIEND REQUESTS TABLE
-- Handles the pending requests between users.
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Friend Requests Policies
CREATE POLICY "Users can view requests they sent or received" ON public.friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update request status" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);


-- 3. FRIENDSHIPS TABLE
-- Stores established mutual friendships.
CREATE TABLE IF NOT EXISTS public.friendships (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friendships Policies
CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);


-- 4. TRIGGER: Create or Update profile on Auth change
-- Automatically keeps the profiles table in sync with Supabase Auth users.
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on signup and metadata updates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_change();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE PROCEDURE public.handle_auth_user_change();


-- 5. FUNCTION: Accept Friend Request
-- Helper function to handle the atomic operation of accepting a request.
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id BIGINT)
RETURNS VOID AS $$
DECLARE
  req RECORD;
BEGIN
  SELECT * FROM public.friend_requests WHERE id = request_id INTO req;

  IF req.receiver_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the receiver can accept the request';
  END IF;

  -- Create bidirectional friendship
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (req.sender_id, req.receiver_id), (req.receiver_id, req.sender_id)
  ON CONFLICT DO NOTHING;

  -- Delete the request
  DELETE FROM public.friend_requests WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
