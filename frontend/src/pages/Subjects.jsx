import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import { Button, Card, Empty, ErrorLine, Field, Modal, Select, Spinner } from '../components/UI.jsx';
import { studyGroups } from '../studyGroups.js';
import { academicSemesters, cseCurriculum, semesterForSubject } from '../cseCurriculum.js';

const colors = ['#a78bfa', '#6ee7c8', '#fbbf77', '#7dd3fc', '#fb90bd'];
const difficulties = ['Easy', 'Medium', 'Hard'];

export default function Subjects() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', group: 'CSE', academicSemester: '1-1', customGroup: '', color: colors[0], priority: 'Medium', targetHours: 2 });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: subjects = [], isLoading, error } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });

  const createSubject = useMutation({
    mutationFn: () => api.post('/subjects', {
      ...form,
      group: form.group === 'Other' ? (form.customGroup.trim() || 'Other') : form.group,
      academicSemester: form.group === 'CSE' ? form.academicSemester : undefined,
      customGroup: undefined,
    }),
    onSuccess: subject => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setModal(false);
      navigate(`/subjects/${subject._id}`);
    },
    onError: mutationError => setForm(current => ({ ...current, _error: mutationError.message })),
  });

  const createSuggestedSubject = useMutation({
    mutationFn: ({ name, academicSemester }) => api.post('/subjects', {
      name,
      group: 'CSE',
      academicSemester,
      description: `Suggested CSE subject for semester ${academicSemester}. Customize it to match your course syllabus.`,
      color: colors[academicSemesters.indexOf(academicSemester) % colors.length],
      priority: 'Medium',
      targetHours: 2,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
  const createSemesterSubjects = useMutation({
    mutationFn: ({ semester, names }) => Promise.all(names.map(name => api.post('/subjects', {
      name,
      group: 'CSE',
      academicSemester: semester,
      description: `Suggested CSE subject for semester ${semester}. Customize it to match your course syllabus.`,
      color: colors[academicSemesters.indexOf(semester) % colors.length],
      priority: 'Medium',
      targetHours: 2,
    }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
  if (isLoading) return <Spinner/>;

  const selectedGroupData = {
    name: 'CSE',
    subjects: subjects.filter(subject => (subject.group || 'Other') === 'CSE'),
  };
  const semesterGroups = academicSemesters.map(semester => ({
    semester,
    subjects: selectedGroupData.subjects.filter(subject => semesterForSubject(subject) === semester)
      .sort((a, b) => cseCurriculum[semester].indexOf(a.name) - cseCurriculum[semester].indexOf(b.name)),
    suggestions: cseCurriculum[semester].filter(name => !selectedGroupData.subjects.some(subject => subject.name.trim().toLowerCase() === name.toLowerCase())),
  }));
  const unassignedSubjects = selectedGroupData.subjects.filter(subject => !semesterForSubject(subject));

  return <>
    <div className="page-intro">
      <div><span className="eyebrow">YOUR LEARNING MAP</span><h2>Subjects to explore.</h2><p>Explore CSE subjects by academic year and semester. Open a subject to see its topics.</p></div>
      <Button onClick={() => setModal(true)}><Plus size={17}/> Add subject</Button>
    </div>
    <ErrorLine error={error}/>
    {selectedGroupData
      ? <section className="subject-group">
        <ErrorLine error={createSuggestedSubject.error || createSemesterSubjects.error}/>
        <div className="semester-list">{semesterGroups.map(({ semester, subjects: semesterSubjects, suggestions }) => <section className="semester-section" key={semester}>
          <div className="subject-group-heading">
            <div><span className="eyebrow">CSE · ACADEMIC SEMESTER</span><h3>{semester}</h3></div>
            {suggestions.length > 1 && <Button variant="ghost" disabled={createSemesterSubjects.isPending} onClick={() => createSemesterSubjects.mutate({ semester, names: suggestions })}>Add all {suggestions.length} subjects</Button>}
            <span className="count-badge">{semesterSubjects.length} {semesterSubjects.length === 1 ? 'subject' : 'subjects'}</span>
          </div>
          {semesterSubjects.length
            ? <div className="subject-cards">{semesterSubjects.map((subject, index) => <SubjectCard key={subject._id} subject={subject} index={index}/>)}</div>
            : <p className="helper-text">No subjects added for this semester yet.</p>}
          {suggestions.length > 0 && <details className="semester-suggestions">
            <summary>Add suggested CSE subjects ({suggestions.length})</summary>
            <div className="semester-suggestion-list">{suggestions.map(name => <div className="semester-suggestion" key={name}>
              <span>{name}</span>
              <Button variant="ghost" disabled={createSuggestedSubject.isPending} onClick={() => createSuggestedSubject.mutate({ name, academicSemester: semester })}>Add subject</Button>
            </div>)}</div>
          </details>}
        </section>)}
        </div>
        {unassignedSubjects.length > 0 && <section className="semester-section">
          <div className="subject-group-heading"><div><span className="eyebrow">CSE · NEEDS A SEMESTER</span><h3>Unassigned subjects</h3></div><span className="count-badge">{unassignedSubjects.length}</span></div>
          <div className="subject-cards">{unassignedSubjects.map((subject, index) => <SubjectCard key={subject._id} subject={subject} index={index}/>)}</div>
        </section>}
      </section>
      : <Card><Empty title="Start with a learning path">Create a subject or add starter subjects and topics for your group.</Empty></Card>}
    {modal && <Modal title="Add a subject" onClose={() => setModal(false)}>
      <form className="form-stack" onSubmit={event => { event.preventDefault(); createSubject.mutate(); }}>
        <ErrorLine error={form._error}/>
        <Select label="Academic group" value={form.group} onChange={event => setForm({ ...form, group: event.target.value, customGroup: '' })}>
          {studyGroups.map(group => <option key={group}>{group}</option>)}
        </Select>
        {form.group === 'CSE' && <Select label="Academic semester" value={form.academicSemester} onChange={event => setForm({ ...form, academicSemester: event.target.value })}>
          {academicSemesters.map(semester => <option key={semester} value={semester}>{semester}</option>)}
        </Select>}
        {form.group === 'Other' && <Field label="Other group name (optional)" placeholder="e.g. BCA, Pharmacy" value={form.customGroup} onChange={event => setForm({ ...form, customGroup: event.target.value })}/>}
        <Field label="Subject name" placeholder="e.g. Data Structures" value={form.name} onChange={event => setForm({ ...form, name: event.target.value, _error: '' })} required/>
        <Field label="Description" placeholder="What are you learning?" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/>
        <div className="form-row">
          <Select label="Priority" value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{['Low', 'Medium', 'High'].map(value => <option key={value}>{value}</option>)}</Select>
          <Field label="Target hours" type="number" min="0" value={form.targetHours} onChange={event => setForm({ ...form, targetHours: Number(event.target.value) })}/>
        </div>
        <label className="field"><span>Color</span><div className="color-options">{colors.map(color => <button type="button" key={color} onClick={() => setForm({ ...form, color })} className={`color-choice ${form.color === color ? 'selected' : ''}`} style={{ background: color }} aria-label={`Choose ${color}`}/>)}</div></label>
        <Button className="full" disabled={createSubject.isPending}>{createSubject.isPending ? 'Creating…' : 'Create subject'}</Button>
      </form>
    </Modal>}
  </>;
}

function SubjectCard({ subject, index }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => api.delete(`/subjects/${subject._id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
  return <Card className="subject-card" style={{ '--subject-color': subject.color }}>
    <div className="subject-card-head">
      <span className="subject-symbol"><BookOpen size={20}/></span>
      <button className="icon-button delete" title="Delete subject" onClick={() => { if (confirm(`Delete ${subject.name} and its topics?`)) remove.mutate(); }}><Trash2 size={16}/></button>
    </div>
    <span className="eyebrow">{semesterForSubject(subject) ? `${semesterForSubject(subject)} · ` : ''}{subject.group || 'Other'} · {String(index + 1).padStart(2, '0')}</span>
    <h3>{subject.name}</h3>
    <p>{subject.description || 'A space for your notes, topics, and focused study.'}</p>
    <div className="subject-meta"><span>{subject.priority} priority</span><span>{subject.targetHours}h target</span></div>
    <Link to={`/subjects/${subject._id}`} className="subject-open">Explore subject <ArrowRight size={16}/></Link>
  </Card>;
}

export function SubjectDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState({ title: '', description: '', difficulty: 'Medium', estimatedMinutes: 30 });
  const [addModal, setAddModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestionPrompt, setSuggestionPrompt] = useState('');
  const [message, setMessage] = useState(null);
  const { data, isLoading, error } = useQuery({ queryKey: ['subject', id], queryFn: () => api.get(`/subjects/${id}`) });

  const createTopic = useMutation({
    mutationFn: () => api.post('/topics', { ...topic, subject: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-subjects'] });
      setTopic({ title: '', description: '', difficulty: 'Medium', estimatedMinutes: 30 });
      setAddModal(false);
    },
  });
  const updateTopic = useMutation({
    mutationFn: ({ id: topicId, ...changes }) => api.put(`/topics/${topicId}`, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-subjects'] });
    },
  });
  const deleteTopic = useMutation({
    mutationFn: topicId => api.delete(`/topics/${topicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-subjects'] });
    },
  });
  const explain = useMutation({
    mutationFn: selectedTopic => api.post('/ai/explain', { topic: selectedTopic.title }),
    onSuccess: result => setMessage(result),
  });
  const suggest = useMutation({
    mutationFn: prompt => api.post('/ai/topics', { subject: id, prompt }),
    onSuccess: result => {
      setSuggestions(result.topics);
      setSelectedSuggestions(result.topics.map((_, index) => index));
      setSuggestionModal(true);
    },
  });
  const askForSuggestions = event => {
    event.preventDefault();
    const prompt = suggestionPrompt.trim();
    if (prompt) suggest.mutate(prompt);
  };
  const addSuggestions = useMutation({
    mutationFn: async () => Promise.all(selectedSuggestions.map(index => {
      const suggestion = suggestions[index];
      return api.post('/topics', { ...suggestion, subject: id });
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-subjects'] });
      setSuggestionModal(false);
      setSuggestions([]);
    },
  });

  if (isLoading) return <Spinner/>;
  if (error) return <div className="notice error">{error.message}</div>;
  const progress = data.topics.length ? Math.round(data.topics.reduce((sum, item) => sum + item.progress, 0) / data.topics.length) : 0;

  return <>
    <Link to="/subjects" className="back-link"><ArrowLeft size={15}/> All subjects</Link>
    <div className="detail-hero" style={{ '--subject-color': data.subject.color }}>
      <span className="subject-symbol"><BookOpen size={22}/></span><span className="eyebrow">SUBJECT OVERVIEW · {data.subject.group || 'Other'}</span>
      <h2>{data.subject.name}</h2><p>{data.subject.description || 'Your personal learning path.'}</p>
      <div className="detail-progress"><span>Topic progress</span><b>{progress}%</b><div className="progress-track"><i style={{ width: `${progress}%` }}/></div></div>
    </div>
    <Card className="topic-ask-card">
      <div><span className="eyebrow">ASK FOR WHAT YOU NEED</span><h3>What topics should you study?</h3><p>Ask AI for up to 18 useful topics for {data.subject.name}, across different difficulty levels.</p></div>
      <form className="topic-ask-form" onSubmit={askForSuggestions}>
        <label className="field"><span>Your request</span><textarea aria-label="Ask for topic suggestions" placeholder="e.g. Suggest beginner topics for Unit 2, with practice questions" value={suggestionPrompt} onChange={event => setSuggestionPrompt(event.target.value)} maxLength={500} rows={3}/></label>
        <Button type="submit" disabled={!suggestionPrompt.trim() || suggest.isPending}><Send size={15}/>{suggest.isPending ? 'Thinking…' : 'Ask for suggestions'}</Button>
      </form>
      {suggest.error && <div className="notice error">{suggest.error.message}</div>}
    </Card>
    <div className="section-heading detail-heading">
      <div><span className="eyebrow">LEARNING PATH</span><h3>Topics <span className="count-badge">{data.topics.length}</span></h3></div>
      <div className="topic-header-actions">
        <Button variant="soft-button" disabled={suggest.isPending} onClick={() => { setSuggestionPrompt('Suggest useful topics across Easy, Medium, and Hard levels.'); suggest.mutate('Suggest useful topics across Easy, Medium, and Hard levels.'); }}><Sparkles size={15}/>{suggest.isPending ? 'Thinking…' : 'Quick suggestions'}</Button>
        <Button onClick={() => setAddModal(true)}><Plus size={16}/> Add topic</Button>
      </div>
    </div>
    {updateTopic.error && <div className="notice error">{updateTopic.error.message}</div>}
    {deleteTopic.error && <div className="notice error">{deleteTopic.error.message}</div>}
    {data.topics.length
      ? difficulties.map(level => {
        const levelTopics = data.topics.filter(item => (difficulties.includes(item.difficulty) ? item.difficulty : 'Medium') === level);
        if (!levelTopics.length) return null;
        return <section className="difficulty-section" key={level}>
          <div className="difficulty-heading"><h3>{level}</h3><span>{levelTopics.length} {levelTopics.length === 1 ? 'topic' : 'topics'}</span></div>
          <div className="topic-list">{levelTopics.map(item => <TopicRow key={item._id} topic={item} onExplain={() => explain.mutate(item)} explaining={explain.isPending} onStatus={status => updateTopic.mutate({ id: item._id, status })} onDelete={() => deleteTopic.mutate(item._id)}/>)}</div>
        </section>;
      })
      : <Card><Empty title="A path begins with a topic">Add a topic, use the starter curriculum, or ask AI to suggest topics for {data.subject.name}.</Empty></Card>}
    {message && <Modal title={`A little clarity: ${message.topic}`} onClose={() => setMessage(null)}><Explanation data={message}/></Modal>}
    {addModal && <Modal title="Add a topic" onClose={() => setAddModal(false)}>
      <form className="form-stack" onSubmit={event => { event.preventDefault(); createTopic.mutate(); }}>
        <ErrorLine error={createTopic.error}/>
        <Field label="Topic title" placeholder="e.g. Binary trees" value={topic.title} onChange={event => setTopic({ ...topic, title: event.target.value })} required/>
        <Field label="Description" placeholder="What will you explore?" value={topic.description} onChange={event => setTopic({ ...topic, description: event.target.value })}/>
        <div className="form-row">
          <Select label="Difficulty" value={topic.difficulty} onChange={event => setTopic({ ...topic, difficulty: event.target.value })}>{difficulties.map(level => <option key={level}>{level}</option>)}</Select>
          <Field label="Estimated minutes" type="number" min="1" value={topic.estimatedMinutes} onChange={event => setTopic({ ...topic, estimatedMinutes: Number(event.target.value) })}/>
        </div>
        <Button className="full" disabled={createTopic.isPending}>Add topic</Button>
      </form>
    </Modal>}
    {suggestionModal && <Modal title={`AI topic suggestions for ${data.subject.name}`} onClose={() => setSuggestionModal(false)}>
      <div className="ai-suggestion-list">
        <p><b>Your request:</b> {suggestionPrompt || 'Suggest useful topics across Easy, Medium, and Hard levels.'} Choose any suggestions to add. Review them against your course syllabus before studying.</p>
        {suggestions.length
          ? suggestions.map((suggestion, index) => <label className="ai-suggestion" key={`${suggestion.title}-${index}`}>
            <input type="checkbox" checked={selectedSuggestions.includes(index)} onChange={event => setSelectedSuggestions(current => event.target.checked ? [...current, index] : current.filter(item => item !== index))}/>
            <span><b>{suggestion.title}</b><small>{suggestion.description}</small></span>
            <em className={`difficulty-tag ${suggestion.difficulty.toLowerCase()}`}>{suggestion.difficulty}</em>
          </label>)
          : <Empty title="No new suggestions">All suggested topics may already be in this subject. Try again later.</Empty>}
        {addSuggestions.error && <div className="notice error">{addSuggestions.error.message}</div>}
        <Button className="full" disabled={!selectedSuggestions.length || addSuggestions.isPending} onClick={() => addSuggestions.mutate()}>
          {addSuggestions.isPending ? 'Adding selected topics…' : `Add ${selectedSuggestions.length} selected topic${selectedSuggestions.length === 1 ? '' : 's'}`}
        </Button>
      </div>
    </Modal>}
  </>;
}

function TopicRow({ topic, onExplain, explaining, onStatus, onDelete }) {
  return <Card className="topic-row">
    <div className="topic-status">{topic.status === 'Completed' ? '✓' : '◦'}</div>
    <div className="topic-main">
      <div><b>{topic.title}</b><span className={`difficulty-tag ${(topic.difficulty || 'Medium').toLowerCase()}`}>{topic.difficulty || 'Medium'}</span></div>
      <p>{topic.description || 'Keep moving forward, one concept at a time.'}</p>
      <div className="topic-progress"><div className="progress-track"><i style={{ width: `${topic.progress}%` }}/></div><small>{topic.progress}% · {topic.estimatedMinutes} min</small></div>
    </div>
    <div className="topic-actions">
      <button className="text-button" onClick={onExplain}>{explaining ? 'Thinking…' : 'Explain with AI'}</button>
      <select aria-label={`Status for ${topic.title}`} value={topic.status} onChange={event => onStatus(event.target.value)}>{['Not Started', 'Learning', 'Revising', 'Completed'].map(status => <option key={status}>{status}</option>)}</select>
      <button className="icon-button delete" onClick={onDelete} aria-label={`Delete ${topic.title}`}><Trash2 size={15}/></button>
    </div>
  </Card>;
}

export function Explanation({ data }) {
  return <div className="explanation">
    <p>{data.simpleExplanation}</p><h4>Key concepts</h4><ul>{data.keyConcepts?.map(item => <li key={item}>{item}</li>)}</ul>
    <h4>Example</h4><p>{data.example}</p>
    {data.learningSteps?.length > 0 && <><h4>How to learn it</h4><ol>{data.learningSteps.map(item => <li key={item}>{item}</li>)}</ol></>}
    {data.applications?.length > 0 && <><h4>Where it is used</h4><ul>{data.applications.map(item => <li key={item}>{item}</li>)}</ul></>}
    <h4>Common mistakes</h4><ul>{data.commonMistakes?.map(item => <li key={item}>{item}</li>)}</ul>
    <h4>Quick summary</h4><p>{data.summary}</p><h4>Practice questions</h4><ol>{data.practiceQuestions?.map(item => <li key={item}>{item}</li>)}</ol>
  </div>;
}
