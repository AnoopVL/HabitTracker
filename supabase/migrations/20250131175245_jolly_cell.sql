/*
  # Create habits schema

  1. New Tables
    - `habits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `frequency` (text)
      - `created_at` (timestamptz)
    - `habit_completions`
      - `id` (uuid, primary key)
      - `habit_id` (uuid, foreign key to habits)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create habits table
CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  created_at timestamptz DEFAULT now()
);

-- Create habit completions table
CREATE TABLE habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Policies for habits table
CREATE POLICY "Users can create their own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for habit_completions table
CREATE POLICY "Users can create completions for their habits"
  ON habit_completions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can view completions for their habits"
  ON habit_completions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_id
    AND habits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete completions for their habits"
  ON habit_completions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM habits
    WHERE habits.id = habit_id
    AND habits.user_id = auth.uid()
  ));