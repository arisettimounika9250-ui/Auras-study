import { Navigate,Route,Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/UI.jsx';
import { Landing,Login,Register } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DailyProgress from './pages/DailyProgress.jsx';
import GroupProgress from './pages/GroupProgress.jsx';
import QuizProgress from './pages/QuizProgress.jsx';
import Terms from './pages/Terms.jsx';
import Planner from './pages/Planner.jsx';
import Subjects,{SubjectDetail} from './pages/Subjects.jsx';
import { AIPlan,Companion,Focus } from './pages/StudyTools.jsx';
import { Analytics,History,Profile,Settings } from './pages/Insights.jsx';
function Guard({children}){const{user,loading}=useAuth();if(loading)return <Spinner/>;return user?children:<Navigate to="/login" replace/>;}
function StudyHub(){return <><p className="companion-language-hint">Ask AuraStudy in English. Request “explain this in simple English” whenever you want an easier explanation.</p><div className="hub-layout"><div><Companion/></div><div className="hub-tools"><AIPlan/></div></div></>}
export default function App(){return <Routes><Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/terms" element={<Terms/>}/><Route element={<Guard><Shell/></Guard>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/subjects" element={<Subjects/>}/><Route path="/subjects/:id" element={<SubjectDetail/>}/><Route path="/planner" element={<Planner/>}/><Route path="/focus" element={<Focus/>}/><Route path="/companion" element={<StudyHub/>}/><Route path="/quiz" element={<QuizProgress/>}/><Route path="/analytics" element={<><GroupProgress/><DailyProgress/><Analytics/></>}/><Route path="/history" element={<History/>}/><Route path="/profile" element={<Profile/>}/><Route path="/settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
