import React, { useState, useEffect } from 'react';
import { PlusCircle, Check, X, Trophy, Calendar, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Stats } from './components/Stats';

interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  completedDates: string[];
  streak: number;
}

function App() {
  const [session, setSession] = useState(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchHabits();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchHabits();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*');

      if (completionsError) throw completionsError;

      const processedHabits = habitsData.map(habit => ({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency,
        completedDates: completionsData
          .filter(completion => completion.habit_id === habit.id)
          .map(completion => new Date(completion.completed_at).toISOString().split('T')[0]),
        streak: calculateStreak(
          completionsData
            .filter(completion => completion.habit_id === habit.id)
            .map(completion => new Date(completion.completed_at).toISOString().split('T')[0]),
          habit.frequency
        ),
      }));

      setHabits(processedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
      alert('Error fetching habits');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: string[], frequency: string): number => {
    if (dates.length === 0) return 0;
    
    const sortedDates = [...dates].sort();
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const curr = new Date(sortedDates[i]);
      const prev = new Date(sortedDates[i - 1]);
      
      let isConsecutive = false;
      
      switch (frequency) {
        case 'daily':
          const diffDays = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          isConsecutive = diffDays === 1;
          break;
        case 'weekly':
          const diffWeeks = Math.ceil((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24 * 7));
          isConsecutive = diffWeeks === 1;
          break;
        case 'monthly':
          const monthDiff = (curr.getFullYear() - prev.getFullYear()) * 12 + 
                          (curr.getMonth() - prev.getMonth());
          isConsecutive = monthDiff === 1;
          break;
      }
      
      if (isConsecutive) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    
    return maxStreak;
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            name: newHabit,
            frequency: newFrequency,
            user_id: user.id // Add the user_id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setHabits([...habits, {
        id: data.id,
        name: data.name,
        frequency: data.frequency,
        completedDates: [],
        streak: 0,
      }]);
      
      setNewHabit('');
    } catch (error) {
      console.error('Error adding habit:', error);
      alert('Error adding habit');
    }
  };

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = habit.completedDates.includes(today);
    
    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .match({
            habit_id: habitId,
            completed_at: today
          });

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase
          .from('habit_completions')
          .insert([
            {
              habit_id: habitId,
              completed_at: new Date().toISOString()
            }
          ]);

        if (error) throw error;
      }

      await fetchHabits(); // Refresh habits to get updated streaks
    } catch (error) {
      console.error('Error toggling habit:', error);
      alert('Error updating habit completion');
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .match({ id: habitId });

      if (error) throw error;

      setHabits(habits.filter(habit => habit.id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Error deleting habit');
    }
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(habit => 
      habit.completedDates.includes(today)
    ).length;

    const longestStreak = Math.max(...habits.map(habit => habit.streak));

    const totalPossibleCompletions = habits.length;
    const completionRate = totalPossibleCompletions === 0 
      ? 0 
      : Math.round((completedToday / totalPossibleCompletions) * 100);

    return {
      totalHabits: habits.length,
      completedToday,
      longestStreak,
      completionRate,
    };
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">
              Habit Tracker
            </h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          <Stats {...calculateStats()} />

          <form onSubmit={addHabit} className="mb-8 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="Enter a new habit..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white"
              >
                <PlusCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
              >
                <option value="daily" className="bg-indigo-900">Every day</option>
                <option value="weekly" className="bg-indigo-900">Every week</option>
                <option value="monthly" className="bg-indigo-900">Every month</option>
              </select>
            </div>
          </form>

          {loading ? (
            <div className="text-center text-white/70">Loading habits...</div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => (
                <div
                  key={habit.id}
                  className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          habit.completedDates.includes(new Date().toISOString().split('T')[0])
                            ? 'bg-green-500'
                            : 'bg-white/20'
                        }`}
                      >
                        <Check className="w-5 h-5 text-white" />
                      </button>
                      <div>
                        <h3 className="text-white font-medium">{habit.name}</h3>
                        <div className="flex items-center gap-4 text-white/70 text-sm">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            <span>Streak: {habit.streak}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{habit.frequency}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {habits.length === 0 && (
                <div className="text-center text-white/70 mt-8">
                  No habits added yet. Start by adding a new habit above!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;