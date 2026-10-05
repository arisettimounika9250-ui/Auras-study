import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { User, Subject, Topic, Task, StudySession, Quiz, VibeLog, Conversation } from './models.js';
import { generate, mockReply } from './ai.js';

const app = express();
const configuredJwtSecret = process.env.JWT_SECRET?.trim();
const jwtSecret = configuredJwtSecret || (process.env.NODE_ENV === 'production' ? '' : randomBytes(32).toString('hex'));
if (!jwtSecret || (process.env.NODE_ENV === 'production' && jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be configured as a random value of at least 32 characters in production.');
}
const allowedOrigins = new Set([process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean));
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json({ limit: '1mb' }));
const ok = (res, data, status=200) => res.status(status).json({ success:true, data });
const fail = (res, status, message, code) => res.status(status).json({ success:false, ...(code ? { code } : {}), message });
const databaseUnavailableMessage = 'Cannot reach MongoDB. Check that your Atlas cluster is running, your current public IP is allowed under Atlas Network Access, and MONGODB_URI in backend/.env has the correct credentials and database name.';
const databaseUnavailable = res => fail(res, 503, databaseUnavailableMessage, 'DATABASE_UNAVAILABLE');
const isDatabaseConnectivityError = error => {
  const visited = new Set();
  for (let current = error; current && !visited.has(current); current = current.cause) {
    visited.add(current);
    if (['MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError', 'MongoNotConnectedError', 'MongooseServerSelectionError'].includes(current.name)) return true;
  }
  return false;
};
const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const tokenFor = user => jwt.sign({ id:user._id, tokenVersion:user.tokenVersion || 0 }, jwtSecret, { expiresIn:'7d' });
const auth = asyncRoute(async (req,res,next) => { const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,''); if(!token) return fail(res,401,'Please log in to continue.'); try { const payload=jwt.verify(token,jwtSecret); req.user=await User.findById(payload.id); if(!req.user || (payload.tokenVersion || 0)!==(req.user.tokenVersion || 0)) return fail(res,401,'Session expired. Please log in again.'); next(); } catch { return fail(res,401,'Session expired. Please log in again.'); } });
const safeUser = user => ({ id:user._id, name:user.name, email:user.email, avatar:user.avatar, studyGoal:user.studyGoal, dailyStudyTarget:user.dailyStudyTarget, preferredStudyTime:user.preferredStudyTime, currentVibe:user.currentVibe, theme:user.theme, notifications:user.notifications, voiceEnabled:user.voiceEnabled });
const own = async (Model,id,userId) => Model.findOne({ _id:id, user:userId });
const authLimiter = rateLimit({ windowMs:15*60_000, limit:10, standardHeaders:true, legacyHeaders:false, message:{success:false,message:'Too many authentication attempts. Please wait 15 minutes and try again.'} });

app.use('/api',asyncRoute(async(req,res,next)=>{
  try {
    await ensureDatabaseConnected();
    next();
  } catch(err) {
    console.error('MongoDB connection failed:',err.name,err.message);
    return databaseUnavailable(res);
  }
}));
app.get('/api/health',(req,res)=>res.status(200).json({success:true,data:{status:'ok',database:'connected'}}));
app.post('/api/auth/register',authLimiter,asyncRoute(async(req,res)=>{ const {name,email,password,confirmPassword}=req.body; if(typeof name!=='string'||!name.trim()||typeof email!=='string'||!email.trim()||typeof password!=='string'||!password) return fail(res,400,'Name, email, and password are required.'); if(password.length<12) return fail(res,400,'Password must be at least 12 characters.'); if(confirmPassword!==undefined&&password!==confirmPassword) return fail(res,400,'Passwords do not match.'); if(await User.exists({email:email.toLowerCase().trim()})) return fail(res,409,'An account with this email already exists.'); const user=await User.create({name:name.trim(),email:email.toLowerCase().trim(),password:await bcrypt.hash(password,12)}); return ok(res,{user:safeUser(user),token:tokenFor(user)},201); }));
app.post('/api/auth/login',authLimiter,asyncRoute(async(req,res)=>{ if(typeof req.body.email!=='string'||typeof req.body.password!=='string') return fail(res,400,'Email and password are required.'); const user=await User.findOne({email:req.body.email.toLowerCase().trim()}).select('+password'); if(!user||!await bcrypt.compare(req.body.password,user.password)) return fail(res,401,'Email or password is incorrect.'); return ok(res,{user:safeUser(user),token:tokenFor(user)}); }));
app.get('/api/auth/me',auth,(req,res)=>ok(res,{user:safeUser(req.user)}));
app.put('/api/auth/password',auth,authLimiter,asyncRoute(async(req,res)=>{ const {currentPassword,newPassword,confirmPassword}=req.body; if(typeof currentPassword!=='string'||typeof newPassword!=='string'||typeof confirmPassword!=='string') return fail(res,400,'Current and new passwords are required.'); const user=await User.findById(req.user.id).select('+password'); if(!user||!await bcrypt.compare(currentPassword,user.password)) return fail(res,400,'Current password is incorrect.'); if(newPassword.length<12) return fail(res,400,'New password must be at least 12 characters.'); if(newPassword!==confirmPassword) return fail(res,400,'New passwords do not match.'); if(await bcrypt.compare(newPassword,user.password)) return fail(res,400,'Choose a new password you have not used for this account.'); user.password=await bcrypt.hash(newPassword,12); user.tokenVersion=(user.tokenVersion||0)+1; await user.save(); return ok(res,{token:tokenFor(user)}); }));
app.get('/api/users/profile',auth,(req,res)=>ok(res,{user:safeUser(req.user)}));
app.put('/api/users/profile',auth,asyncRoute(async(req,res)=>{ const allowed=['name','studyGoal','dailyStudyTarget','preferredStudyTime','theme','notifications','voiceEnabled']; for(const k of allowed) if(req.body[k]!==undefined) req.user[k]=req.body[k]; if(!req.user.name?.trim()) return fail(res,400,'Name cannot be empty.'); if(req.user.dailyStudyTarget<1||req.user.dailyStudyTarget>1440) return fail(res,400,'Daily target must be between 1 and 1440 minutes.'); await req.user.save(); ok(res,{user:safeUser(req.user)}); }));

app.get('/api/subjects',auth,asyncRoute(async(req,res)=>ok(res,await Subject.find({user:req.user.id}).sort({createdAt:-1}))));
app.post('/api/subjects',auth,asyncRoute(async(req,res)=>{ if(!req.body.name?.trim())return fail(res,400,'Subject name is required.'); ok(res,await Subject.create({...req.body,user:req.user.id}),201); }));
app.get('/api/subjects/:id',auth,asyncRoute(async(req,res)=>{ const subject=await own(Subject,req.params.id,req.user.id); if(!subject)return fail(res,404,'Subject not found.'); const [topics,tasks,sessions]=await Promise.all([Topic.find({user:req.user.id,subject:subject.id}),Task.find({user:req.user.id,subject:subject.id}),StudySession.find({user:req.user.id,subject:subject.id})]); ok(res,{subject,topics,tasks,sessions}); }));
app.put('/api/subjects/:id',auth,asyncRoute(async(req,res)=>{const subject=await own(Subject,req.params.id,req.user.id);if(!subject)return fail(res,404,'Subject not found.');for(const k of ['name','group','academicSemester','description','color','targetHours','priority'])if(req.body[k]!==undefined)subject[k]=req.body[k];await subject.save();ok(res,subject);}));
app.delete('/api/subjects/:id',auth,asyncRoute(async(req,res)=>{const subject=await own(Subject,req.params.id,req.user.id);if(!subject)return fail(res,404,'Subject not found.');await Promise.all([Topic.deleteMany({user:req.user.id,subject:subject.id}),Task.updateMany({user:req.user.id,subject:subject.id},{$unset:{subject:1,topic:1}})]);await subject.deleteOne();ok(res,{deleted:true});}));

app.get('/api/topics',auth,asyncRoute(async(req,res)=>{const q={user:req.user.id};if(req.query.subject)q.subject=req.query.subject;ok(res,await Topic.find(q).populate('subject','name color').sort({createdAt:-1}));}));
app.post('/api/topics',auth,asyncRoute(async(req,res)=>{const subject=await own(Subject,req.body.subject,req.user.id);if(!subject)return fail(res,400,'Choose a valid subject.');if(!req.body.title?.trim())return fail(res,400,'Topic title is required.');ok(res,await Topic.create({...req.body,user:req.user.id,subject:subject.id}),201);}));
app.put('/api/topics/:id',auth,asyncRoute(async(req,res)=>{const topic=await own(Topic,req.params.id,req.user.id);if(!topic)return fail(res,404,'Topic not found.');for(const k of ['title','description','difficulty','status','estimatedMinutes','progress'])if(req.body[k]!==undefined)topic[k]=req.body[k];if(req.body.status!==undefined){const statusProgress={'Not Started':0,Learning:35,Revising:70,Completed:100};if(statusProgress[req.body.status]!==undefined)topic.progress=statusProgress[req.body.status];}if(req.body.subject){if(!await own(Subject,req.body.subject,req.user.id))return fail(res,400,'Choose a valid subject.');topic.subject=req.body.subject;}await topic.save();ok(res,topic);}));
app.delete('/api/topics/:id',auth,asyncRoute(async(req,res)=>{const t=await own(Topic,req.params.id,req.user.id);if(!t)return fail(res,404,'Topic not found.');await Task.updateMany({user:req.user.id,topic:t.id},{$unset:{topic:1}});await t.deleteOne();ok(res,{deleted:true});}));

app.get('/api/tasks',auth,asyncRoute(async(req,res)=>{const q={user:req.user.id};if(req.query.status)q.status=req.query.status;ok(res,await Task.find(q).populate('subject','name color').populate('topic','title').sort({position:1,createdAt:-1}));}));
app.post('/api/tasks',auth,asyncRoute(async(req,res)=>{if(!req.body.title?.trim())return fail(res,400,'Task title is required.');const subject=req.body.subject?await own(Subject,req.body.subject,req.user.id):null;if(req.body.subject&&!subject)return fail(res,400,'Choose a valid subject.');const topic=req.body.topic?await own(Topic,req.body.topic,req.user.id):null;if(req.body.topic&&!topic)return fail(res,400,'Choose a valid topic.');if(topic&&!subject)return fail(res,400,'Choose the subject for this topic.');if(topic&&String(topic.subject)!==String(subject.id))return fail(res,400,'Choose a topic from the selected subject.');const group=String(req.body.group||subject?.group||'Other').trim();if(subject&&group!==(subject.group||'Other'))return fail(res,400,'Choose a subject from the selected group.');ok(res,await Task.create({...req.body,group,user:req.user.id}),201);}));
app.put('/api/tasks/:id',auth,asyncRoute(async(req,res)=>{const t=await own(Task,req.params.id,req.user.id);if(!t)return fail(res,404,'Task not found.');for(const k of ['title','description','group','subject','topic','priority','deadline','estimatedMinutes','status','position'])if(req.body[k]!==undefined)t[k]=req.body[k];const subjectId=t.subject?._id||t.subject;const topicId=t.topic?._id||t.topic;const subject=subjectId?await own(Subject,subjectId,req.user.id):null;if(subjectId&&!subject)return fail(res,400,'Choose a valid subject.');if(topicId){const topic=await own(Topic,topicId,req.user.id);if(!topic)return fail(res,400,'Choose a valid topic.');if(!subject)return fail(res,400,'Choose the subject for this topic.');if(String(topic.subject)!==String(subject.id))return fail(res,400,'Choose a topic from the selected subject.');}if(subject&&(req.body.group!==undefined||req.body.subject!==undefined)){if((t.group||subject.group||'Other')!==(subject.group||'Other'))return fail(res,400,'Choose a subject from the selected group.');if(!t.group)t.group=subject.group||'Other';}await t.save();ok(res,await t.populate(['subject','topic']));}));
app.delete('/api/tasks/:id',auth,asyncRoute(async(req,res)=>{const t=await own(Task,req.params.id,req.user.id);if(!t)return fail(res,404,'Task not found.');await t.deleteOne();ok(res,{deleted:true});}));

app.post('/api/study-sessions',auth,asyncRoute(async(req,res)=>{const {duration,startedAt,endedAt,subject,task,completed}=req.body;if(!Number.isFinite(Number(duration))||Number(duration)<1||Number(duration)>1440)return fail(res,400,'Session duration must be between 1 and 1440 minutes.');for(const [id,Model] of [[subject,Subject],[task,Task]])if(id&&!await own(Model,id,req.user.id))return fail(res,400,'Session contains an invalid subject or task.');const session=await StudySession.create({user:req.user.id,duration:Number(duration),startedAt:startedAt||new Date(Date.now()-duration*60000),endedAt:endedAt||new Date(),subject,task,completed:completed!==false});ok(res,session,201);}));
app.get('/api/study-sessions',auth,asyncRoute(async(req,res)=>{const q={user:req.user.id};if(req.query.subject)q.subject=req.query.subject;if(req.query.from||req.query.to)q.startedAt={...(req.query.from?{$gte:new Date(req.query.from)}:{}),...(req.query.to?{$lte:new Date(req.query.to)}:{})};ok(res,await StudySession.find(q).populate('subject','name color').populate('task','title').sort({startedAt:-1}).limit(200));}));
app.post('/api/vibes',auth,asyncRoute(async(req,res)=>{const allowed=['Focused','Calm','Motivated','Energetic','Tired','Stressed','Distracted'];if(!allowed.includes(req.body.vibe))return fail(res,400,'Choose a valid study vibe.');req.user.currentVibe=req.body.vibe;await req.user.save();const log=await VibeLog.create({user:req.user.id,vibe:req.body.vibe});ok(res,{vibe:req.user.currentVibe,log},201);}));
app.get('/api/vibes',auth,asyncRoute(async(req,res)=>ok(res,await VibeLog.find({user:req.user.id}).sort({timestamp:-1}).limit(60))));

async function studyContext(user){const [subjects,tasks,sessions]=await Promise.all([Subject.find({user:user.id}).select('name color priority'),Task.find({user:user.id}).populate('subject','name').sort({deadline:1}).limit(40),StudySession.find({user:user.id}).sort({startedAt:-1}).limit(10).select('duration startedAt completed')]);return {name:user.name,vibe:user.currentVibe,subjects,tasks,sessions,studyGoal:user.studyGoal};}
const aiLimiter=rateLimit({windowMs:60_000,limit:30,standardHeaders:true,legacyHeaders:false,message:{success:false,message:'Please wait a moment before sending another AI request.'}});
app.post('/api/ai/chat',auth,aiLimiter,asyncRoute(async(req,res)=>{if(!req.body.message?.trim())return fail(res,400,'Write a message first.');const context=await studyContext(req.user);const result=await generate('chat',{message:req.body.message},context);let conversation=await Conversation.findOne({user:req.user.id}).sort({updatedAt:-1});if(!conversation)conversation=await Conversation.create({user:req.user.id});conversation.messages.push({role:'user',content:req.body.message,at:new Date()},{role:'assistant',content:result.reply||String(result),at:new Date()});conversation.context={vibe:req.user.currentVibe};await conversation.save();ok(res,{reply:result.reply||String(result),conversationId:conversation.id});}));
app.get('/api/ai/chat',auth,asyncRoute(async(req,res)=>{const conversation=await Conversation.findOne({user:req.user.id}).sort({updatedAt:-1});ok(res,conversation||{messages:[]});}));
app.delete('/api/ai/chat',auth,asyncRoute(async(req,res)=>{await Conversation.deleteMany({user:req.user.id});ok(res,{cleared:true});}));
app.post('/api/ai/plan',auth,aiLimiter,asyncRoute(async(req,res)=>ok(res,await generate('plan',{availableMinutes:Math.min(1440,Number(req.body.availableMinutes)||120)},await studyContext(req.user)))));
app.post('/api/ai/explain',auth,aiLimiter,asyncRoute(async(req,res)=>{if(!req.body.topic?.trim())return fail(res,400,'Choose a topic to explain.');ok(res,await generate('explain',req.body,await studyContext(req.user)));}));
app.post('/api/ai/topics',auth,aiLimiter,asyncRoute(async(req,res)=>{const subject=await own(Subject,req.body.subject,req.user.id);if(!subject)return fail(res,400,'Choose a valid subject.');const prompt=String(req.body.prompt||'').trim();if(prompt.length>500)return fail(res,400,'Topic suggestion requests must be 500 characters or fewer.');const existing=await Topic.find({user:req.user.id,subject:subject.id}).select('title');const result=await generate('topics',{subject:subject.name,group:subject.group||'Other',description:subject.description||'',prompt,existingTopics:existing.map(topic=>topic.title),instructions:`Follow the student's request when suggesting up to 18 useful, distinct study topics for this subject. Student request: ${prompt||'Suggest useful topics across Easy, Medium, and Hard levels.'} Return JSON with a topics array. Every item must have title, difficulty (Easy, Medium, or Hard), description, and estimatedMinutes. Keep suggestions relevant to the subject and request; include all three difficulty levels unless the request asks for a specific level.`},await studyContext(req.user));if(!Array.isArray(result.topics))return fail(res,502,'The AI did not return a valid topic list. Please try again.');const existingTitles=new Set(existing.map(topic=>topic.title.trim().toLowerCase()));const topics=result.topics.filter(topic=>topic&&typeof topic.title==='string'&&topic.title.trim()&&!existingTitles.has(topic.title.trim().toLowerCase())&&['Easy','Medium','Hard'].includes(topic.difficulty)).slice(0,18).map(topic=>({title:topic.title.trim(),difficulty:topic.difficulty,description:typeof topic.description==='string'?topic.description.trim():'AI-suggested study topic.',estimatedMinutes:Math.max(5,Math.min(240,Number(topic.estimatedMinutes)||30))}));ok(res,{topics,subject:subject.name});}));
app.post('/api/ai/quiz',auth,aiLimiter,asyncRoute(async(req,res)=>{const {topic,subject}=req.body;if(!topic)return fail(res,400,'Choose a topic for your quiz.');const [context,topicDoc]=await Promise.all([studyContext(req.user),own(Topic,topic,req.user.id)]);if(!topicDoc)return fail(res,400,'Choose a valid topic.');if(subject&&String(topicDoc.subject)!==String(subject))return fail(res,400,'The selected topic does not belong to this subject.');const result=await generate('quiz',{...req.body,topic:topicDoc.title},context);ok(res,{...result,subject:subject||topicDoc.subject,topic});}));
app.post('/api/ai/quiz/submit',auth,asyncRoute(async(req,res)=>{const {questions,answers,subject,topic}=req.body;if(!Array.isArray(questions)||!Array.isArray(answers)||questions.length<1||questions.length>10)return fail(res,400,'Invalid quiz submission.');if(subject&&!await own(Subject,subject,req.user.id))return fail(res,400,'Invalid subject.');const topicDoc=topic?await own(Topic,topic,req.user.id):null;if(topic&&!topicDoc)return fail(res,400,'Invalid topic.');if(topicDoc&&subject&&String(topicDoc.subject)!==String(subject))return fail(res,400,'The selected topic does not belong to this subject.');const normalize=x=>String(x??'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();let score=0;const reviewed=questions.map((q,i)=>{const correct=normalize(answers[i])===normalize(q.answer);if(correct)score++;return {...q,userAnswer:answers[i],correct};});const quiz=await Quiz.create({user:req.user.id,subject:subject||topicDoc?.subject,topic,questions:reviewed,answers,score,totalQuestions:questions.length});ok(res,{quiz,score,total:questions.length,reviewed});}));

function dayKey(d){return new Date(d).toISOString().slice(0,10);} 
async function dashboard(user){const now=new Date(),todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()),weekStart=new Date(todayStart);weekStart.setDate(todayStart.getDate()-6);const yearStart=new Date(todayStart);yearStart.setDate(yearStart.getDate()-365);const [subjects,tasks,todaySessions,weekSessions,recentSessions,streakSessions,logs]=await Promise.all([Subject.find({user:user.id}),Task.find({user:user.id}).populate('subject','name color'),StudySession.find({user:user.id,startedAt:{$gte:todayStart}}),StudySession.find({user:user.id,startedAt:{$gte:weekStart}}),StudySession.find({user:user.id}).populate('subject','name color').sort({startedAt:-1}).limit(5),StudySession.find({user:user.id,startedAt:{$gte:yearStart}}).select('startedAt'),VibeLog.find({user:user.id}).sort({timestamp:-1}).limit(1)]);const completed=tasks.filter(t=>t.status==='Completed').length;const pending=tasks.filter(t=>t.status!=='Completed');const daily=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return {date:dayKey(d),label:d.toLocaleDateString('en',{weekday:'short'}),minutes:weekSessions.filter(s=>dayKey(s.startedAt)===dayKey(d)).reduce((sum,s)=>sum+s.duration,0)}});const activeDays=new Set(streakSessions.map(s=>dayKey(s.startedAt)));let streak=0;let cursor=new Date(todayStart);if(!activeDays.has(dayKey(cursor)))cursor.setDate(cursor.getDate()-1);while(activeDays.has(dayKey(cursor))&&streak<366){streak++;cursor.setDate(cursor.getDate()-1)}const subjectsWithProgress=await Promise.all(subjects.map(async s=>{const ts=await Topic.find({user:user.id,subject:s.id});return {...s.toObject(),progress:ts.length?Math.round(ts.reduce((a,t)=>a+t.progress,0)/ts.length):0,topicCount:ts.length}}));return {user:safeUser(user),vibe:logs[0]?.vibe||user.currentVibe,todayMinutes:todaySessions.reduce((a,s)=>a+s.duration,0),weekMinutes:weekSessions.reduce((a,s)=>a+s.duration,0),completedTasks:completed,pendingTaskCount:pending.length,pendingTasks:pending.slice(0,5),taskCount:tasks.length,streak,daily,subjects:subjectsWithProgress,recentSessions,weeklyTarget:user.dailyStudyTarget*7};}
app.get('/api/analytics/dashboard',auth,asyncRoute(async(req,res)=>ok(res,await dashboard(req.user))));
app.get('/api/analytics/weekly',auth,asyncRoute(async(req,res)=>{const d=await dashboard(req.user);ok(res,{daily:d.daily,weekMinutes:d.weekMinutes,weeklyTarget:d.weeklyTarget});}));
app.get('/api/analytics/subjects',auth,asyncRoute(async(req,res)=>{const d=await dashboard(req.user);ok(res,d.subjects.map(s=>({id:s._id,name:s.name,color:s.color,progress:s.progress,topicCount:s.topicCount})));}));
app.get('/api/analytics/quizzes',auth,asyncRoute(async(req,res)=>{const [subjects,quizzes]=await Promise.all([Subject.find({user:req.user.id}).select('group'),Quiz.find({user:req.user.id}).populate('subject','group').sort({createdAt:-1})]);const groups=new Map();for(const subject of subjects){const name=subject.group||'Other';if(!groups.has(name))groups.set(name,{group:name,attempts:0,questions:0,correct:0,latestAt:null});}for(const quiz of quizzes){const name=quiz.subject?.group||'Unassigned';if(!groups.has(name))groups.set(name,{group:name,attempts:0,questions:0,correct:0,latestAt:null});const stats=groups.get(name);stats.attempts++;stats.questions+=quiz.totalQuestions;stats.correct+=quiz.score;if(!stats.latestAt)stats.latestAt=quiz.createdAt;}ok(res,[...groups.values()].map(stats=>({...stats,averageScore:stats.questions?Math.round(stats.correct/stats.questions*100):0})));}));
app.get('/api/history',auth,asyncRoute(async(req,res)=>{const {activity,subject,from,to}=req.query;const range={user:req.user.id,...(subject?{subject}:{}),...((from||to)?{startedAt:{...(from?{$gte:new Date(from)}:{}),...(to?{$lte:new Date(to)}:{})}}:{})};const [sessions,quizzes,tasks]=await Promise.all([activity&&activity!=='session'?[]:StudySession.find(range).populate('subject','name').sort({startedAt:-1}).limit(200),activity&&activity!=='quiz'?[]:Quiz.find({user:req.user.id,...(subject?{subject}:{}),...((from||to)?{createdAt:{...(from?{$gte:new Date(from)}:{}),...(to?{$lte:new Date(to)}:{})}}:{})}).populate('subject','name').sort({createdAt:-1}).limit(200),activity&&activity!=='task'?[]:Task.find({user:req.user.id,status:'Completed',...(subject?{subject}:{}),...((from||to)?{updatedAt:{...(from?{$gte:new Date(from)}:{}),...(to?{$lte:new Date(to)}:{})}}:{})}).populate('subject','name').sort({updatedAt:-1}).limit(200)]);ok(res,{sessions,quizzes,tasks});}));
app.use((req,res)=>fail(res,404,'That endpoint does not exist.'));
app.use((err,req,res,next)=>{console.error('API request failed:',err.name,err.message);if(err.code===11000)return fail(res,409,'An account with this email already exists.');if(err.name==='ValidationError')return fail(res,400,'Please check the information you entered.');if(err.name==='CastError')return fail(res,400,'Invalid resource identifier.');if(isDatabaseConnectivityError(err)||mongoose.connection.readyState!==1)return databaseUnavailable(res);return fail(res,500,'Something went wrong. Please try again.');});
const mongoUri=process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/aurastudy';
let databaseConnection;
let reconnectDelay=5000;
async function ensureDatabaseConnected() {
  if (mongoose.connection.readyState===1) return;
  if (!databaseConnection) {
    databaseConnection=mongoose.connect(mongoUri,{dbName:'aurastudy'}).catch(err=>{
      databaseConnection=null;
      throw err;
    });
  }
  await databaseConnection;
}
async function connectToDatabase() {
  try {
    await ensureDatabaseConnected();
    reconnectDelay=5000;
    console.log('MongoDB connected.');
  } catch(err) {
    console.error('MongoDB connection failed:',err.name,err.message);
    console.error('For Atlas, verify the cluster is running, allowlist this machine public IP in Network Access, and check the database user and MONGODB_URI in backend/.env. The API will retry automatically.');
    const retryAfter=reconnectDelay;
    reconnectDelay=Math.min(reconnectDelay*2,60000);
    setTimeout(connectToDatabase,retryAfter).unref();
  }
}
if (process.env.VERCEL !== '1') {
  const port=Number(process.env.PORT)||4000;
  app.listen(port,()=>console.log(`AuraStudy API listening on ${port}`));
  connectToDatabase();
}

export default app;
