import React from 'react';
import { BarChart, Activity, Award } from 'lucide-react';

interface StatsProps {
  totalHabits: number;
  completedToday: number;
  longestStreak: number;
  completionRate: number;
}

export function Stats({ totalHabits, completedToday, longestStreak, completionRate }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Total Habits</p>
            <p className="text-2xl font-bold text-white">{totalHabits}</p>
          </div>
          <BarChart className="w-8 h-8 text-white/70" />
        </div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Completed Today</p>
            <p className="text-2xl font-bold text-white">{completedToday}</p>
          </div>
          <Activity className="w-8 h-8 text-white/70" />
        </div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Longest Streak</p>
            <p className="text-2xl font-bold text-white">{longestStreak}</p>
          </div>
          <Award className="w-8 h-8 text-white/70" />
        </div>
      </div>
      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Completion Rate</p>
            <p className="text-2xl font-bold text-white">{completionRate}%</p>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-white/70 flex items-center justify-center">
            <span className="text-white/70 text-sm font-medium">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}