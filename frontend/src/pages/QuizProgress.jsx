import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';
import api from '../services/api.js';
import { Card, Empty, Spinner } from '../components/UI.jsx';
import { QuizTool } from './StudyTools.jsx';

export default function QuizProgress() {
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['quiz-progress-by-group'],
    queryFn: () => api.get('/analytics/quizzes'),
  });

  return <>
    <div className="page-intro">
      <div><span className="eyebrow">PRACTICE MAKES IT STICK</span><h2>Your quizzes.</h2><p>Choose a subject and topic to make a quiz. Review your results by academic group below.</p></div>
    </div>
    <QuizTool/>
    <section className="quiz-results-section">
      <div className="page-intro">
        <div><span className="eyebrow">YOUR SAVED RESULTS</span><h2>Quiz progress by group.</h2><p>Each group shows attempts, average score, and correct answers.</p></div>
      </div>
      {error
        ? <div className="notice error">{error.message}</div>
        : isLoading
          ? <Spinner/>
          : groups.length
            ? <div className="group-quiz-list">{groups.map(group => <Card className="group-quiz-card" key={group.group}>
              <div className="group-quiz-heading">
                <div><span className="eyebrow"><Award size={13}/> QUIZ RESULTS</span><h3>{group.group}</h3></div>
                <div className="group-progress-total"><b>{group.attempts ? `${group.averageScore}%` : '—'}</b><span>{group.attempts ? 'average score' : 'no attempts yet'}</span></div>
              </div>
              <div className="group-progress-track" role="progressbar" aria-label={`${group.group} average quiz score`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={group.averageScore}>
                <i style={{ width: `${group.averageScore}%` }}/>
              </div>
              <p className="group-progress-caption">{group.attempts} {group.attempts === 1 ? 'quiz' : 'quizzes'} · {group.correct} correct out of {group.questions} questions</p>
            </Card>)}</div>
            : <Card><Empty title="No quiz results yet">Complete a quiz to see attempts and average scores for your groups.</Empty></Card>}
    </section>
  </>;
}
