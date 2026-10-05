import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import api from '../services/api.js';
import { Card, Empty, Spinner } from '../components/UI.jsx';

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function DailyProgress() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard'),
  });

  if (isLoading) return <Spinner/>;
  if (error) return <div className="notice error">{error.message}</div>;

  const days = data.daily || [];
  const dailyGoal = Math.round((data.weeklyTarget || 0) / 7);
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const totalGoal = dailyGoal * days.length;
  const weekProgress = totalGoal ? Math.min(100, Math.round(totalMinutes / totalGoal * 100)) : 0;

  return <Card className="daily-progress-card">
    <div className="section-heading">
      <div><span className="eyebrow">YOUR LAST SEVEN DAYS</span><h3>Daily study progress</h3></div>
      <span className="chart-unit"><CalendarDays size={14}/> 7 DAYS</span>
    </div>
    <div className="daily-progress-summary">
      <b>{(totalMinutes / 60).toFixed(1)} hours</b>
      <span>of {(totalGoal / 60).toFixed(1)} goal hours · {weekProgress}% of your weekly goal</span>
    </div>
    <div className="daily-progress-list">
      {days.map(day => {
        const percent = dailyGoal ? Math.min(100, Math.round(day.minutes / dailyGoal * 100)) : 0;
        return <div className="daily-progress-row" key={day.date}>
          <div className="daily-progress-date"><b>{day.label}</b><small>{formatDate(day.date)}</small></div>
          <div className="daily-progress-track" role="progressbar" aria-label={`${day.label} study goal`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
            <i style={{ width: `${percent}%` }}/>
          </div>
          <div className="daily-progress-value"><b>{day.minutes} min</b><small>{dailyGoal ? `${percent}% of daily goal` : 'No daily goal set'}</small></div>
        </div>;
      })}
    </div>
    {!totalMinutes && <Empty title="No study time logged this week">Start a focus session to see your progress for each day here.</Empty>}
  </Card>;
}
