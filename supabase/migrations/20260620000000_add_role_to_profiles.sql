-- Migration: Add role column to profiles table for admin authorization logic
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
