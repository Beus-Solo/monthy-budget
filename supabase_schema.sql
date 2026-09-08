-- Run this SQL in your Supabase SQL Editor to set up the tables

-- Create Transactions Table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    note TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Budget Configs Table
CREATE TABLE public.budget_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    starting_balance NUMERIC NOT NULL DEFAULT 0,
    user_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_configs ENABLE ROW LEVEL SECURITY;

-- Policies for Transactions
CREATE POLICY "Users can manage their own transactions" 
ON public.transactions
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policies for Budget Configs
CREATE POLICY "Users can manage their own budget config" 
ON public.budget_configs
FOR ALL 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
