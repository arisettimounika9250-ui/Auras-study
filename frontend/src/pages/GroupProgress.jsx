import { useQuery } from '@tanstack/react-query';
import { BookOpen, Layers3 } from 'lucide-react';
import api from '../services/api.js';
import { Card, Empty, Spinner } from '../components/UI.jsx';

export default function GroupProgress() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard'),
  });
  if (isLoading) return <Spinner/>;
  if (error) return <div className="notice error">{error.message}</div>;

  const groups = new Map();
  for (const subject of data.subjects || []) {
    const groupName = subject.group || 'Other';
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(subject);
  }

  return <section className="group-progress-section">
    <div className="page-intro">
      <div><span className="eyebrow">PROGRESS BY ACADEMIC GROUP</span><h2>Each group, its own progress.</h2><p>See topic completion separately for every group and subject.</p></div>
    </div>
    {groups.size
      ? <div className="group-progress-list">{[...groups].map(([name, subjects]) => {
        const topicCount = subjects.reduce((sum, subject) => sum + subject.topicCount, 0);
        const progress = topicCount
          ? Math.round(subjects.reduce((sum, subject) => sum + subject.progress * subject.topicCount, 0) / topicCount)
          : 0;
        return <Card className="group-progress-card" key={name}>
          <div className="group-progress-heading">
            <div><span className="eyebrow"><Layers3 size={13}/> ACADEMIC GROUP</span><h3>{name}</h3></div>
            <div className="group-progress-total"><b>{progress}%</b><span>overall progress</span></div>
          </div>
          <div className="group-progress-track" role="progressbar" aria-label={`${name} overall progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <i style={{ width: `${progress}%` }}/>
          </div>
          <p className="group-progress-caption">{subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} · {topicCount} {topicCount === 1 ? 'topic' : 'topics'}</p>
          <div className="group-progress-subjects">{subjects.map(subject => <div className="group-progress-subject" key={subject._id}>
            <span className="subject-dot" style={{ background: subject.color }}><BookOpen size={12}/></span>
            <span className="group-progress-subject-name">{subject.name}<small>{subject.topicCount} {subject.topicCount === 1 ? 'topic' : 'topics'}</small></span>
            <div className="progress-track"><i style={{ width: `${subject.progress}%`, background: subject.color }}/></div>
            <b>{subject.progress}%</b>
          </div>)}</div>
        </Card>;
      })}</div>
      : <Card><Empty title="No group progress yet">Add subjects and topics to your academic groups, then update topic status as you study.</Empty></Card>}
  </section>;
}
