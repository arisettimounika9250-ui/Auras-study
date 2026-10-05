import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studyGroups } from '../studyGroups.js';
import api from '../services/api.js';
import { Button, Card, Empty, ErrorLine, Field, Modal, Select, Spinner } from '../components/UI.jsx';
import { useDraggable, useDroppable } from '@dnd-kit/core';

const statuses = ['To Do', 'In Progress', 'Completed'];
const initialForm = () => ({ title: '', description: '', group: 'CSE', customGroup: '', subject: '', topic: '', priority: 'Medium', estimatedMinutes: 25, status: 'To Do' });

function formatDeadlineInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function parseDeadline(value) {
  if (!value) return { value: undefined, error: '' };
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return { value: undefined, error: 'Enter the deadline as DD-MM-YYYY.' };
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { value: undefined, error: 'Enter a real calendar date in DD-MM-YYYY format.' };
  }
  return { value: `${yearText}-${monthText}-${dayText}`, error: '' };
}

function displayDeadline(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
}

export default function Planner() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [groupFilter, setGroupFilter] = useState('All groups');
  const [form, setForm] = useState(initialForm);
  const [deadlineError, setDeadlineError] = useState('');
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks') });
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects') });
  const { data: topics = [], isLoading: topicsLoading } = useQuery({ queryKey: ['topics'], queryFn: () => api.get('/topics') });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const groupName = form.group === 'Other' ? (form.customGroup.trim() || 'Other') : form.group;
  const groups = [...new Set([...studyGroups, ...subjects.map(subject => subject.group || 'Other'), ...tasks.map(task => task.group || task.subject?.group || 'Other')])];
  const availableSubjects = subjects.filter(subject => (subject.group || 'Other') === groupName);
  const availableTopics = topics.filter(topic => topic.subject?._id === form.subject || topic.subject === form.subject);
  const selectedTopic = availableTopics.find(topic => topic._id === form.topic);
  const titleWithoutSelectedTopic = current => {
    const currentTopic = topics.find(topic => topic._id === current.topic);
    return currentTopic && current.title === currentTopic.title ? '' : current.title;
  };

  const changeSubjectGroup = group => setForm(current => ({
    ...current,
    group,
    customGroup: '',
    subject: '',
    topic: '',
    title: titleWithoutSelectedTopic(current),
  }));
  const changeSubject = subject => setForm(current => ({
    ...current,
    subject,
    topic: '',
    title: titleWithoutSelectedTopic(current),
  }));
  const changeTopic = topicId => {
    const topic = availableTopics.find(item => item._id === topicId);
    setForm(current => ({
      ...current,
      topic: topicId,
      title: topic ? topic.title : (selectedTopic && current.title === selectedTopic.title ? '' : current.title),
    }));
  };

  const create = useMutation({
    mutationFn: () => {
      const deadline = parseDeadline(form.deadline || '');
      if (deadline.error) throw new Error(deadline.error);
      return api.post('/tasks', { ...form, deadline: deadline.value, group: groupName, subject: form.subject || undefined, topic: form.topic || undefined, customGroup: undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setModal(false);
      setForm(initialForm());
      setDeadlineError('');
    },
  });
  const openCreateModal = () => {
    create.reset();
    setForm(initialForm());
    setDeadlineError('');
    setModal(true);
  };
  const closeCreateModal = () => {
    create.reset();
    setForm(initialForm());
    setDeadlineError('');
    setModal(false);
  };
  const submitCreate = event => {
    event.preventDefault();
    const deadline = parseDeadline(form.deadline || '');
    setDeadlineError(deadline.error);
    if (!deadline.error) create.mutate();
  };
  const update = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tasks/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old => old?.map(task => task._id === id ? { ...task, status } : task));
      return { previous };
    },
    onError: (_, __, context) => queryClient.setQueryData(['tasks'], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const remove = useMutation({
    mutationFn: id => api.delete(`/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const onDragEnd = ({ active, over }) => {
    if (!over || !statuses.includes(over.id)) return;
    const task = tasks.find(item => item._id === active.id);
    if (task && task.status !== over.id) update.mutate({ id: task._id, status: over.id });
  };

  if (tasksLoading || subjectsLoading || topicsLoading) return <Spinner/>;
  const visibleTasks = task => groupFilter === 'All groups' || (task.group || task.subject?.group || 'Other') === groupFilter;

  return <>
    <div className="page-intro">
      <div><span className="eyebrow">MAKE A LITTLE SPACE</span><h2>Your study plan.</h2><p>Organize tasks by academic group, subject, and topic.</p></div>
      <Button onClick={openCreateModal}><Plus size={17}/> Add task</Button>
    </div>
    <div className="planner-toolbar">
      <Select label="Filter by group" value={groupFilter} onChange={event => setGroupFilter(event.target.value)}>
        <option>All groups</option>{groups.map(group => <option key={group}>{group}</option>)}
      </Select>
      <span className="planner-hint">↔ &nbsp; Drag a task to move it between stages</span>
    </div>
    {(create.error || update.error || remove.error) && <div className="notice error">{(create.error || update.error || remove.error).message}</div>}
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="kanban">{statuses.map((status, index) => <KanbanColumn key={status} status={status} number={String(index + 1).padStart(2, '0')} tasks={tasks.filter(task => task.status === status && visibleTasks(task))} onDelete={id => remove.mutate(id)}/>)}</div>
    </DndContext>
    {modal && <Modal title="Add a study task" onClose={closeCreateModal}>
      <form className="form-stack" onSubmit={submitCreate}>
        <ErrorLine error={create.error}/>
        <Select label="Academic group" value={form.group} onChange={event => changeSubjectGroup(event.target.value)}>
          {studyGroups.map(group => <option key={group}>{group}</option>)}
        </Select>
        {form.group === 'Other' && <Field label="Other group name (optional)" placeholder="e.g. BCA, Pharmacy" value={form.customGroup} onChange={event => setForm(current => ({ ...current, customGroup: event.target.value, subject: '', topic: '', title: titleWithoutSelectedTopic(current) }))}/>}
        <Field label="Task title (required)" placeholder="What would you like to work on?" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required/>
        <Select label="Subject" value={form.subject} onChange={event => changeSubject(event.target.value)}>
          <option value="">No subject</option>{availableSubjects.map(subject => <option key={subject._id} value={subject._id}>{subject.name}</option>)}
        </Select>
        <Select label="Topic" value={form.topic} onChange={event => changeTopic(event.target.value)} disabled={!form.subject}>
          <option value="">{form.subject && !availableTopics.length ? 'No topics yet' : 'No topic'}</option>{availableTopics.map(topic => <option key={topic._id} value={topic._id}>{topic.title} · {topic.difficulty || 'Medium'}</option>)}
        </Select>
        {selectedTopic && <p className="form-hint">Task title was filled from the selected topic. You can edit it below.</p>}
        <p className="planner-manage-link">{form.subject && !availableTopics.length ? 'This subject has no topics yet.' : 'Need to add a subject or topic?'} <Link to="/subjects" onClick={() => setModal(false)}>Manage subjects & topics</Link>.</p>
        <Field label="Notes (optional)" placeholder="A little context" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/>
        <div className="form-row">
          <Select label="Priority" value={form.priority} onChange={event => setForm({ ...form, priority: event.target.value })}>{['Low', 'Medium', 'High'].map(value => <option key={value}>{value}</option>)}</Select>
          <Field label="Estimated minutes" type="number" min="1" value={form.estimatedMinutes} onChange={event => setForm({ ...form, estimatedMinutes: Number(event.target.value) })}/>
        </div>
        <Field label="Deadline (DD-MM-YYYY)" type="text" placeholder="DD-MM-YYYY" inputMode="numeric" maxLength="10" aria-invalid={Boolean(deadlineError)} aria-describedby={deadlineError ? 'deadline-error' : 'deadline-format-hint'} value={form.deadline || ''} onChange={event => { setDeadlineError(''); setForm({ ...form, deadline: formatDeadlineInput(event.target.value) }); }}/>
        {deadlineError
          ? <p className="form-hint form-hint-error" id="deadline-error" role="alert">{deadlineError}</p>
          : <p className="form-hint" id="deadline-format-hint">Type the date as DD-MM-YYYY, for example 03-10-2026. The deadline is optional.</p>}
        {!form.title.trim() && <p className="form-hint">A task title is required. Deadline, subject, and topic are optional.</p>}
        <Button type="submit" className="full" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add to planner'}</Button>
      </form>
    </Modal>}
  </>;
}

function KanbanColumn({ status, number, tasks, onDelete }) {
  const { setNodeRef } = useDroppable({ id: status });
  return <div className="kanban-column" ref={setNodeRef}>
    <div className="column-head"><span className={`column-number n${number}`}>{number}</span><h3>{status}</h3><span className="count-badge">{tasks.length}</span></div>
    {tasks.length ? tasks.map(task => <DraggableTask key={task._id} task={task} onDelete={onDelete}/>) : <div className="column-empty"><Empty title={status === 'To Do' ? 'Nothing planned yet' : 'No tasks here'}>Add a task or move one here.</Empty></div>}
  </div>;
}

function DraggableTask({ task, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = { transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, opacity: isDragging ? 0.45 : 1 };
  return <article ref={setNodeRef} style={style} {...listeners} {...attributes} className="task-card">
    <div className="task-card-top"><span className={`priority-dot ${task.priority.toLowerCase()}`}/><span>{task.priority} priority</span><button className="task-delete" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onDelete(task._id); }} aria-label="Delete task">×</button></div>
    <b>{task.title}</b>{task.description && <p>{task.description}</p>}
    <div className="task-card-foot"><span>{task.group || task.subject?.group || 'Other'} · {task.subject?.name || 'No subject'}</span><span>{task.estimatedMinutes} min</span></div>
    {task.topic?.title && <small className="task-topic-label">{task.topic.title}</small>}
    {task.deadline && <small className="task-deadline">Deadline: {displayDeadline(task.deadline)}</small>}
  </article>;
}
