import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock3, Flame, Play, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, Empty, Spinner } from '../components/UI.jsx';
import { VibePicker } from './StudyTools.jsx';
import { vibeGuidance } from '../vibeGuidance.js';
function Stat({ icon: Icon, label, value, note, color }) { return <article className="stat-card"><span className={`stat-icon ${color}`}><Icon size={16} /></span><span>{label}</span><b>{value}</b><small>{note}</small></article> }
const vibes = ['Focused', 'Calm', 'Motivated', 'Energetic', 'Tired', 'Stressed', 'Distracted'];
function VibeControl({ vibe }) {
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState('');
  const saveVibe = useMutation({
    mutationFn: selectedVibe => api.post('/vibes', { vibe: selectedVibe }),
    onMutate: async selectedVibe => {
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });
      const previous = queryClient.getQueryData(['dashboard']);
      queryClient.setQueryData(['dashboard'], current => current ? { ...current, vibe: selectedVibe } : current);
      setSaveError('');
      return { previous, selectedVibe };
    },
    onError: (error, selectedVibe, context) => {
      if (context?.previous && queryClient.getQueryData(['dashboard'])?.vibe === selectedVibe) {
        queryClient.setQueryData(['dashboard'], context.previous);
      }
      setSaveError(error.message || 'Could not save your study vibe. Please try again.');
    },
    onSuccess: (result, selectedVibe) => {
      queryClient.setQueryData(['dashboard'], current => current?.vibe === selectedVibe ? { ...current, vibe: result.vibe } : current);
    },
  });
  return <>
    <div className="section-heading"><div><span className="eyebrow">CHECK IN WITH YOURSELF</span><h3>What’s your study vibe?</h3></div><span className="vibe-current" aria-live="polite">{vibe}</span></div>
    <VibePicker value={vibe} onChange={selectedVibe => saveVibe.mutate(selectedVibe)}/>
    <div className="vibe-save-status" aria-live="polite">{saveVibe.isPending && <span>Saving your vibe…</span>}{saveError && <span className="notice error">{saveError}</span>}</div>
  </>;
}
export default function Dashboard() { const { user } = useAuth(), { data: d, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/analytics/dashboard') }); if (isLoading) return <Spinner />; if (error) return <div className="notice error">{error.message}</div>; const hour = new Date().getHours(), greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; const guidance = vibeGuidance[d.vibe] || vibeGuidance.Calm; return <div className="dashboard-grid"><section className="welcome-banner"><div className="welcome-orb">✦</div><div><span className="eyebrow">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</span><h2>{greeting}, {user.name.split(' ')[0]}.</h2><p>A little steady progress goes a long way. What feels right to study today?</p></div><Link className="button soft-button" to="/focus"><Play size={15} fill="currentColor" /> Start a focus session</Link></section><Card className="vibe-card"><VibeControl vibe={d.vibe}/></Card><section className="stat-grid"><Stat icon={Clock3} label="Study time today" value={`${Math.floor(d.todayMinutes / 60)}h ${d.todayMinutes % 60}m`} note="Across your focus sessions" color="lavender" /><Stat icon={Check} label="Tasks completed" value={d.completedTasks} note={`${d.pendingTasks.length} up next`} color="mint" /><Stat icon={Flame} label="Study streak" value={`${d.streak} day${d.streak === 1 ? '' : 's'}`} note="Keep your rhythm going" color="peach" /><Stat icon={Target} label="Weekly goal" value={`${Math.min(100, Math.round(d.weekMinutes / (d.weeklyTarget || 1) * 100))}%`} note={`${Math.floor(d.weekMinutes / 60)}h studied this week`} color="blue" /></section><Card className="focus-card"><div className="section-heading"><div><span className="eyebrow">A GOOD NEXT STEP</span><h3>Today's focus</h3></div><Sparkles size={18} className="accent-icon" /></div>{d.pendingTasks.length ? <div className="focus-suggestion"><div className="focus-icon"><BookOpen size={20} /></div><div><b>{d.pendingTasks[0].title}</b><p>{d.pendingTasks[0].subject?.name || 'Your study plan'} · {d.pendingTasks[0].estimatedMinutes} min</p><small>For your {d.vibe.toLowerCase()} vibe: {guidance.short}</small></div><Link to="/focus" className="round-arrow" aria-label="Start focus session"><ArrowRight size={18} /></Link></div> : <Empty title="Your next step starts here">Add a study task and we’ll help you find a good place to begin.</Empty>}</Card><Card><div className="section-heading"><div><span className="eyebrow">YOUR LEARNING MAP</span><h3>Subjects</h3></div><Link to="/subjects" className="text-link">All subjects <ArrowRight size={14} /></Link></div>{d.subjects.length ? <div className="subject-list">{d.subjects.slice(0, 4).map(s => <Link className="subject-row" to={`/subjects/${s._id}`} key={s._id}><span className="subject-dot" style={{ background: s.color }} /><span className="subject-name"><b>{s.name}</b><small>{s.topicCount} topics · {s.priority} priority</small></span><div className="progress-track"><i style={{ width: `${s.progress}%`, background: s.color }} /></div><b className="percent">{s.progress}%</b></Link>)}</div> : <Empty title="Your subjects will live here">Add a subject to build your personal learning map.</Empty>}</Card><Card className="weekly-card"><div className="section-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h3>Your study rhythm</h3></div><Link to="/analytics" className="text-link">Details <ArrowRight size={14} /></Link></div><div className="mini-week">{d.daily.map(day => <div className="mini-day" key={day.date}><div className="mini-bar"><i style={{ height: `${Math.max(6, Math.min(100, day.minutes / Math.max(30, ...d.daily.map(x => x.minutes)) * 100))}%` }} /></div><span>{day.label.slice(0, 1)}</span></div>)}</div><div className="week-footer"><span>Weekly goal</span><b>{(d.weekMinutes / 60).toFixed(1)} / {(d.weeklyTarget / 60).toFixed(0)} hours</b></div><div className="progress-track wide"><i style={{ width: `${Math.min(100, d.weekMinutes / (d.weeklyTarget || 1) * 100)}%` }} /></div></Card><Card className="recent-card"><div className="section-heading"><div><span className="eyebrow">YOUR RECENT SESSIONS</span><h3>Recent study</h3></div><Link to="/history" className="text-link">History <ArrowRight size={14} /></Link></div>{d.recentSessions.length ? <div className="session-list">{d.recentSessions.map(s => <div className="session-row" key={s._id}><span className="session-icon"><Clock3 size={16} /></span><span><b>{s.subject?.name || 'Focus session'}</b><small>{new Date(s.startedAt).toLocaleDateString()}</small></span><strong>{s.duration} min</strong></div>)}</div> : <Empty title="A fresh start">Your completed focus sessions will appear here.</Empty>}</Card></div> }
