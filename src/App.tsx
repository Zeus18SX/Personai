import { useState, useEffect, ReactNode, InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  TrendingUp, 
  MessageSquare, 
  Settings as SettingsIcon,
  X,
  Send,
  Loader2,
  Sparkles,
  Scale,
  Activity,
  Calendar,
  Flame,
  Info,
  History,
  ArrowLeft
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { 
  UserProfile, 
  WorkoutPlan, 
  NutritionPlan, 
  WeightEntry, 
  DailyLog, 
  ChatMessage,
  WorkoutHistoryEntry,
  Goal,
  TrainingLevel,
  Equipment,
  Duration,
  Sex
} from './types';
import { 
  generateWorkoutPlan, 
  generateNutritionPlan, 
  chatWithAI, 
  getExerciseTip 
} from './services/gemini';
import { cn, calculateBMI, getBMICategory, formatDate } from './lib/utils';

// --- Components ---

const Badge = ({ children, className, variant = 'default' }: { 
  children: ReactNode, 
  className?: string,
  variant?: 'default' | 'outline'
}) => (
  <span className={cn(
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
    variant === 'default' ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-transparent border border-zinc-800 text-zinc-500",
    className
  )}>
    {children}
  </span>
);

const AIBadge = () => (
  <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-500/30 gap-1">
    <Sparkles size={10} /> Gerado por IA
  </Badge>
);

const Card = ({ children, className, onClick }: { children: ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl active:scale-[0.98] transition-transform",
      className,
      onClick && "cursor-pointer"
    )}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  onClick, 
  disabled,
  isLoading
}: { 
  children: ReactNode, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  className?: string,
  onClick?: () => void,
  disabled?: boolean,
  isLoading?: boolean
}) => {
  const variants = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400 active:bg-emerald-600",
    secondary: "bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600",
    outline: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:bg-zinc-900",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800 active:bg-zinc-900",
    danger: "bg-red-500 text-white hover:bg-red-400 active:bg-red-600"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]",
        variants[variant],
        className
      )}
    >
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
};

const Input = ({ ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={cn(
      "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner",
      props.className
    )}
  />
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'workout' | 'nutrition' | 'progress' | 'chat' | 'settings' | 'history'>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [calorieLogs, setCalorieLogs] = useState<DailyLog[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedWorkout = localStorage.getItem('workoutPlan');
    const savedNutrition = localStorage.getItem('nutritionPlan');
    const savedWeight = localStorage.getItem('weightLog');
    const savedCalories = localStorage.getItem('calorieLogs');
    const savedHistory = localStorage.getItem('workoutHistory');

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setView('dashboard');
    }
    if (savedWorkout) setWorkoutPlan(JSON.parse(savedWorkout));
    if (savedNutrition) setNutritionPlan(JSON.parse(savedNutrition));
    if (savedWeight) setWeightLog(JSON.parse(savedWeight));
    if (savedCalories) setCalorieLogs(JSON.parse(savedCalories));
    if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (userProfile) localStorage.setItem('userProfile', JSON.stringify(userProfile));
    if (workoutPlan) localStorage.setItem('workoutPlan', JSON.stringify(workoutPlan));
    if (nutritionPlan) localStorage.setItem('nutritionPlan', JSON.stringify(nutritionPlan));
    if (weightLog.length > 0) localStorage.setItem('weightLog', JSON.stringify(weightLog));
    if (calorieLogs.length > 0) localStorage.setItem('calorieLogs', JSON.stringify(calorieLogs));
    if (workoutHistory.length > 0) localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [userProfile, workoutPlan, nutritionPlan, weightLog, calorieLogs, workoutHistory]);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setIsLoading(true);
    try {
      const [workout, nutrition] = await Promise.all([
        generateWorkoutPlan(profile),
        generateNutritionPlan(profile)
      ]);
      setWorkoutPlan(workout);
      setNutritionPlan(nutrition);
      setView('dashboard');
    } catch (error) {
      console.error("Failed to generate plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.clear();
    setUserProfile(null);
    setWorkoutPlan(null);
    setNutritionPlan(null);
    setWeightLog([]);
    setCalorieLogs([]);
    setWorkoutHistory([]);
    setChatHistory([]);
    setView('onboarding');
  };

  const handleCompleteWorkout = (entry: WorkoutHistoryEntry) => {
    setWorkoutHistory(prev => [entry, ...prev]);
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-emerald-500/30 safe-top">
      <AnimatePresence mode="wait">
        {view === 'onboarding' ? (
          <OnboardingView onComplete={handleOnboardingComplete} isLoading={isLoading} />
        ) : (
          <div className="pb-32 max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              key={view}
              className="p-5 pt-10"
            >
              {view === 'dashboard' && (
                <DashboardView 
                  profile={userProfile!} 
                  workout={workoutPlan} 
                  nutrition={nutritionPlan} 
                  weightLog={weightLog}
                  calorieLogs={calorieLogs}
                  onNavigate={setView}
                  onLogWeight={(w) => setWeightLog([...weightLog, { date: formatDate(new Date()), weight: w }])}
                />
              )}
              {view === 'workout' && (
                <WorkoutView 
                  plan={workoutPlan} 
                  profile={userProfile!} 
                  onComplete={handleCompleteWorkout}
                  onRegenerate={async () => {
                    setIsLoading(true);
                    const newPlan = await generateWorkoutPlan(userProfile!);
                    setWorkoutPlan(newPlan);
                    setIsLoading(false);
                  }}
                />
              )}
              {view === 'history' && (
                <WorkoutHistoryView 
                  history={workoutHistory} 
                  onBack={() => setView('dashboard')}
                />
              )}
              {view === 'nutrition' && (
                <NutritionView 
                  plan={nutritionPlan} 
                  profile={userProfile!}
                  onRegenerate={async () => {
                    setIsLoading(true);
                    const newPlan = await generateNutritionPlan(userProfile!);
                    setNutritionPlan(newPlan);
                    setIsLoading(false);
                  }}
                />
              )}
              {view === 'progress' && (
                <ProgressView 
                  weightLog={weightLog} 
                  profile={userProfile!} 
                  onLogWeight={(w) => setWeightLog([...weightLog, { date: formatDate(new Date()), weight: w }])}
                />
              )}
              {view === 'chat' && (
                <ChatView 
                  profile={userProfile!} 
                  history={chatHistory} 
                  onSendMessage={(msg) => setChatHistory([...chatHistory, msg])}
                />
              )}
              {view === 'settings' && (
                <SettingsView 
                  profile={userProfile!} 
                  onUpdateProfile={setUserProfile} 
                  onReset={handleReset} 
                />
              )}
            </motion.div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-3xl border-t border-zinc-800/50 px-6 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center z-50 max-w-md mx-auto">
              <NavButton active={view === 'dashboard'} icon={<Home size={24} />} onClick={() => setView('dashboard')} />
              <NavButton active={view === 'workout'} icon={<Dumbbell size={24} />} onClick={() => setView('workout')} />
              <NavButton active={view === 'nutrition'} icon={<Utensils size={24} />} onClick={() => setView('nutrition')} />
              <NavButton active={view === 'progress'} icon={<TrendingUp size={24} />} onClick={() => setView('progress')} />
              <NavButton active={view === 'settings'} icon={<SettingsIcon size={24} />} onClick={() => setView('settings')} />
            </nav>

            {/* Floating Chat Button */}
            {view !== 'chat' && (
              <motion.button
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setView('chat')}
                className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-emerald-500 text-black rounded-full shadow-[0_8px_30px_rgb(0,255,135,0.3)] flex items-center justify-center z-50"
              >
                <MessageSquare size={24} />
              </motion.button>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, onClick }: { active: boolean, icon: ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative transition-all duration-300 p-2 rounded-xl flex flex-col items-center gap-1",
        active ? "text-emerald-500" : "text-zinc-500 active:text-zinc-300"
      )}
    >
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(0,255,135,0.8)]"
        />
      )}
    </button>
  );
}

// --- Views ---

function OnboardingView({ onComplete, isLoading }: { onComplete: (p: UserProfile) => void, isLoading: boolean }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({
    language: 'PT-BR',
    restrictions: [],
    daysPerWeek: 3,
    duration: '60min',
    level: 'Iniciante',
    equipment: 'Academia completa',
    goal: 'Manter saúde'
  });

  const steps = [
    { title: "Qual o seu nome?", field: 'name', type: 'text', placeholder: 'ex: João Silva' },
    { title: "Qual a sua idade?", field: 'age', type: 'number', placeholder: 'ex: 25' },
    { title: "Sexo biológico", field: 'sex', type: 'select', options: ['Masculino', 'Feminino'] },
    { title: "Altura (cm)", field: 'height', type: 'number', placeholder: 'ex: 180' },
    { title: "Peso atual (kg)", field: 'weight', type: 'number', placeholder: 'ex: 80' },
    { title: "Qual o seu objetivo?", field: 'goal', type: 'select', options: ['Perder peso', 'Ganhar músculo', 'Ganhar massa', 'Melhorar condicionamento', 'Manter saúde'] },
    { title: "Nível de treino", field: 'level', type: 'select', options: ['Iniciante', 'Intermediário', 'Avançado'] },
    { title: "Dias por semana", field: 'daysPerWeek', type: 'select', options: ['2', '3', '4', '5', '6'] },
    { title: "Equipamento disponível", field: 'equipment', type: 'select', options: ['Sem equipamento', 'Halteres', 'Academia completa', 'Academia em casa'] },
    { title: "Duração da sessão", field: 'duration', type: 'select', options: ['30min', '45min', '60min', '90min'] },
    { title: "Restrições alimentares", field: 'restrictions', type: 'multi', options: ['Nenhuma', 'Intolerante à lactose', 'Sem glúten', 'Vegetariano', 'Vegano', 'Sem porco', 'Sem frutos do mar'] },
    { title: "Condições de saúde?", field: 'conditions', type: 'text', placeholder: 'Lesões, asma, etc.' },
  ];

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(data as UserProfile);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto safe-bottom">
      <div className="mt-8 mb-12">
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald-500"
          />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-500">PersonAI</h1>
          <span className="text-zinc-500 text-sm font-medium">Passo {step + 1} de {steps.length}</span>
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1"
      >
        <h2 className="text-3xl font-bold mb-8 leading-tight">{currentStep.title}</h2>
        
        {currentStep.type === 'text' || currentStep.type === 'number' ? (
          <Input 
            type={currentStep.type}
            placeholder={currentStep.placeholder}
            value={data[currentStep.field as keyof UserProfile] as string || ''}
            onChange={(e) => setData({ ...data, [currentStep.field]: e.target.value })}
            autoFocus
            className="text-lg py-4"
          />
        ) : currentStep.type === 'select' ? (
          <div className="grid grid-cols-1 gap-3">
            {currentStep.options?.map(opt => (
              <button
                key={opt}
                onClick={() => setData({ ...data, [currentStep.field]: currentStep.field === 'daysPerWeek' ? parseInt(opt) : opt })}
                className={cn(
                  "w-full p-5 rounded-2xl text-left font-bold border transition-all active:scale-[0.98] min-h-[64px]",
                  data[currentStep.field as keyof UserProfile] === (currentStep.field === 'daysPerWeek' ? parseInt(opt) : opt)
                    ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(0,255,135,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {currentStep.options?.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  const current = data.restrictions || [];
                  if (opt === 'Nenhuma') {
                    setData({ ...data, restrictions: ['Nenhuma'] });
                  } else {
                    const filtered = current.filter(r => r !== 'Nenhuma');
                    if (filtered.includes(opt)) {
                      setData({ ...data, restrictions: filtered.filter(r => r !== opt) });
                    } else {
                      setData({ ...data, restrictions: [...filtered, opt] });
                    }
                  }
                }}
                className={cn(
                  "w-full p-5 rounded-2xl text-left font-bold border transition-all active:scale-[0.98] min-h-[64px]",
                  data.restrictions?.includes(opt)
                    ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(0,255,135,0.2)]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex gap-4 pb-4">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={handleBack}>Voltar</Button>
        )}
        <Button 
          className="flex-[2]" 
          onClick={handleNext}
          isLoading={isLoading}
          disabled={!data[currentStep.field as keyof UserProfile] && currentStep.field !== 'conditions'}
        >
          {step === steps.length - 1 ? "Gerar Meu Plano" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}

function DashboardView({ profile, workout, nutrition, weightLog, calorieLogs, onNavigate, onLogWeight }: { 
  profile: UserProfile, 
  workout: WorkoutPlan | null, 
  nutrition: NutritionPlan | null, 
  weightLog: WeightEntry[],
  calorieLogs: DailyLog[],
  onNavigate: (v: any) => void,
  onLogWeight: (w: number) => void
}) {
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCat = getBMICategory(bmi);
  
  const today = formatDate(new Date());
  const todayLog = calorieLogs.find(l => l.date === today);
  const consumed = todayLog?.meals.reduce((acc, m) => acc + m.calories, 0) || 0;
  const calorieGoal = nutrition?.dailyCalories || 2000;

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile.weight.toString());

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Olá, {profile.name.split(' ')[0]}!</h1>
        <p className="text-zinc-500">Vamos com tudo hoje 💪</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Scale size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">IMC</span>
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">{bmi.toFixed(1)}</div>
            <div className={cn("text-[10px] font-bold mt-1", bmiCat.color)}>{bmiCat.label}</div>
          </div>
        </Card>
        <Card className="flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Flame size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Calorias</span>
          </div>
          <div>
            <div className="text-2xl font-bold leading-none">{consumed} <span className="text-[10px] text-zinc-500 font-normal">/ {calorieGoal}</span></div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min((consumed / calorieGoal) * 100, 100)}%` }} />
            </div>
          </div>
        </Card>
      </div>

      {workout && workout.weeks && workout.weeks.length > 0 && (
        <Card onClick={() => onNavigate('workout')} className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Dumbbell size={80} />
          </div>
          <div className="flex justify-between items-start mb-4">
            <Badge>Treino de Hoje</Badge>
            <AIBadge />
          </div>
          <h3 className="text-xl font-bold mb-1">{workout.weeks[0].days[0].split}</h3>
          <p className="text-zinc-500 text-sm mb-4">{workout.weeks[0].days[0].exercises.length} Exercícios • {profile.duration}</p>
          <Button className="w-full" variant="secondary">Começar Treino</Button>
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Progresso de Peso</span>
          </div>
          <button onClick={() => setShowWeightModal(true)} className="text-emerald-500 text-xs font-bold">+ Registrar Peso</button>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightLog.slice(-7)}>
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-24 flex-col gap-1" onClick={() => onNavigate('progress')}>
          <Scale size={20} />
          <span className="text-xs">Registrar Peso</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-1" onClick={() => onNavigate('history')}>
          <History size={20} />
          <span className="text-xs">Histórico</span>
        </Button>
      </div>

      {showWeightModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 w-full max-w-xs rounded-3xl p-6 border border-zinc-800">
            <h3 className="text-xl font-bold mb-4">Registrar Peso</h3>
            <Input 
              type="number" 
              value={newWeight} 
              onChange={(e) => setNewWeight(e.target.value)} 
              placeholder="Peso em kg"
              className="mb-6"
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowWeightModal(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => { onLogWeight(parseFloat(newWeight)); setShowWeightModal(false); }}>Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function WorkoutView({ plan, profile, onRegenerate, onComplete }: { 
  plan: WorkoutPlan | null, 
  profile: UserProfile, 
  onRegenerate: () => void,
  onComplete: (entry: WorkoutHistoryEntry) => void 
}) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [isLoadingTip, setIsLoadingTip] = useState<string | null>(null);
  const [tipModal, setTipModal] = useState<{ name: string, tip: string } | null>(null);

  if (!plan) return <div className="flex flex-col items-center justify-center h-64 gap-4"><Loader2 className="animate-spin text-emerald-500" /> <p>Gerando seu plano...</p></div>;

  const currentWeek = plan.weeks[activeWeek];
  const currentDay = currentWeek.days[activeDay];

  const handleGetTip = async (exerciseName: string) => {
    setIsLoadingTip(exerciseName);
    try {
      const tip = await getExerciseTip(exerciseName, profile);
      setTipModal({ name: exerciseName, tip });
    } finally {
      setIsLoadingTip(null);
    }
  };

  const handleComplete = () => {
    onComplete({
      id: Math.random().toString(36).substr(2, 9),
      date: formatDate(new Date()),
      weekNumber: activeWeek + 1,
      dayName: currentDay.dayName,
      split: currentDay.split,
      exercises: currentDay.exercises,
      duration: profile.duration
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plano de Treino</h1>
          <AIBadge />
        </div>
        <Button variant="ghost" onClick={onRegenerate} className="p-2"><Activity size={20} /></Button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
        {plan.weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => { setActiveWeek(i); setActiveDay(0); }}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all active:scale-95 min-w-[100px] snap-center",
              activeWeek === i ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            )}
          >
            Semana {w.weekNumber}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
        {currentWeek.days.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all active:scale-95 min-w-[120px] snap-center",
              activeDay === i ? "bg-zinc-800 border-emerald-500 text-emerald-400 shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-500"
            )}
          >
            {d.dayName}
          </button>
        ))}
      </div>

      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <h3 className="text-emerald-400 font-bold mb-1">{currentDay.split}</h3>
        <p className="text-zinc-500 text-xs">{currentDay.exercises.length} exercícios planejados para hoje</p>
      </Card>

      <div className="space-y-4">
        {currentDay.exercises.map((ex, i) => (
          <div key={i}>
            <Card className="group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{ex.name}</h4>
                <Badge>{ex.muscleGroup}</Badge>
              </div>
              <div className="flex gap-4 text-zinc-400 text-sm mb-4">
                <div className="flex items-center gap-1"><Activity size={14} /> {ex.sets} x {ex.reps}</div>
                <div className="flex items-center gap-1"><Calendar size={14} /> {ex.rest} descanso</div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 py-2 text-xs" 
                  onClick={() => handleGetTip(ex.name)}
                  isLoading={isLoadingTip === ex.name}
                >
                  Dica IA
                </Button>
                <Button variant="ghost" className="flex-1 py-2 text-xs">Substituir</Button>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={handleComplete}>Finalizar Treino</Button>

      <Card className="bg-zinc-900/50 border-dashed border-zinc-700">
        <h4 className="text-sm font-bold text-zinc-400 mb-2 flex items-center gap-2"><Info size={14} /> Lógica de Progressão</h4>
        <p className="text-xs text-zinc-500 leading-relaxed">{plan.progressionLogic}</p>
      </Card>

      {tipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 w-full max-sm rounded-3xl p-6 border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Dica: {tipModal.name}</h3>
              <button onClick={() => setTipModal(null)}><X size={20} /></button>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-6">{tipModal.tip}</p>
            <Button className="w-full" onClick={() => setTipModal(null)}>Entendi!</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function NutritionView({ plan, profile, onRegenerate }: { plan: NutritionPlan | null, profile: UserProfile, onRegenerate: () => void }) {
  if (!plan) return <div className="flex flex-col items-center justify-center h-64 gap-4"><Loader2 className="animate-spin text-emerald-500" /> <p>Calculando seus macros...</p></div>;

  const macroData = [
    { name: 'Proteína', value: plan.macros.protein * 4, color: '#10b981' },
    { name: 'Carbos', value: plan.macros.carbs * 4, color: '#3b82f6' },
    { name: 'Gordura', value: plan.macros.fat * 9, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nutrição</h1>
          <AIBadge />
        </div>
        <Button variant="ghost" onClick={onRegenerate} className="p-2"><Activity size={20} /></Button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="h-24 w-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroData} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                  {macroData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold leading-none mb-3">{plan.dailyCalories} <span className="text-xs text-zinc-500 font-normal">kcal / dia</span></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-800/50 p-2 rounded-xl text-center">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Prot</div>
                <div className="text-sm font-bold text-emerald-400">{plan.macros.protein}g</div>
              </div>
              <div className="bg-zinc-800/50 p-2 rounded-xl text-center">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Carb</div>
                <div className="text-sm font-bold text-blue-400">{plan.macros.carbs}g</div>
              </div>
              <div className="bg-zinc-800/50 p-2 rounded-xl text-center">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Gord</div>
                <div className="text-sm font-bold text-yellow-400">{plan.macros.fat}g</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Refeições Diárias</h3>
        {plan.meals.map((meal, i) => (
          <div key={i}>
            <Card className="flex gap-4">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500">
                <span className="text-xs font-bold">{meal.time}</span>
                <Utensils size={20} className="mt-1" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold">{meal.name}</h4>
                  <span className="text-xs text-zinc-500 font-medium">{meal.calories} kcal</span>
                </div>
                <ul className="text-xs text-zinc-400 space-y-1">
                  {meal.items.map((item, j) => <li key={j}>• {item}</li>)}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Badge className="text-[10px] py-0 px-1.5">P: {meal.protein}g</Badge>
                  <Badge className="text-[10px] py-0 px-1.5">C: {meal.carbs}g</Badge>
                  <Badge className="text-[10px] py-0 px-1.5">G: {meal.fat}g</Badge>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressView({ weightLog, profile, onLogWeight }: { weightLog: WeightEntry[], profile: UserProfile, onLogWeight: (w: number) => void }) {
  const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : profile.weight;
  const startWeight = weightLog.length > 0 ? weightLog[0].weight : profile.weight;
  const diff = currentWeight - startWeight;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Progresso</h1>
        <p className="text-zinc-500">Sua jornada até agora</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Início</div>
          <div className="text-lg font-bold">{startWeight}kg</div>
        </Card>
        <Card className="p-3 text-center border-emerald-500/30 bg-emerald-500/5">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Atual</div>
          <div className="text-lg font-bold text-emerald-400">{currentWeight}kg</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Dif</div>
          <div className={cn("text-lg font-bold", diff <= 0 ? "text-emerald-400" : "text-red-400")}>
            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}kg
          </div>
        </Card>
      </div>

      <Card className="h-64">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Evolução do Peso</h3>
          <Badge>Últimas {weightLog.length} entradas</Badge>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={weightLog}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#0D0D0D' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-bold mb-4">Linha do Tempo</h3>
        <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
          <TimelineItem title="Fase 1: Adaptação" date="Semana 1-2" active />
          <TimelineItem title="Fase 2: Hipertrofia" date="Semana 3-8" />
          <TimelineItem title="Fase 3: Força" date="Semana 9-12" />
        </div>
      </Card>
    </div>
  );
}

function TimelineItem({ title, date, active }: { title: string, date: string, active?: boolean }) {
  return (
    <div className="relative group active:scale-[0.98] transition-transform">
      <div className={cn(
        "absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-[#0D0D0D] z-10 transition-colors",
        active ? "bg-emerald-500 shadow-[0_0_10px_rgba(0,255,135,0.4)]" : "bg-zinc-800"
      )} />
      <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
        <h4 className={cn("font-bold text-sm", active ? "text-white" : "text-zinc-500")}>{title}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">{date}</p>
      </div>
    </div>
  );
}

function ChatView({ profile, history, onSendMessage }: { profile: UserProfile, history: ChatMessage[], onSendMessage: (m: ChatMessage) => void }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    onSendMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatWithAI([...history, userMsg], profile);
      onSendMessage({ role: 'model', text: response });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Assistente IA</h1>
        <p className="text-zinc-500 text-sm">Pergunte qualquer coisa sobre fitness</p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 no-scrollbar">
        {history.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={32} />
            </div>
            <p className="text-zinc-500 text-sm max-w-[200px] mx-auto">
              "Como posso melhorar minha forma no agachamento?" ou "Qual um bom lanche pós-treino?"
            </p>
          </div>
        )}
        {history.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-emerald-500 text-black font-medium rounded-tr-none" 
                : "bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-zinc-800">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-auto">
        <Input 
          placeholder="Digite sua mensagem..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="pr-14 py-4 text-base"
        />
        <button 
          onClick={handleSend}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-emerald-500 text-black rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

function WorkoutHistoryView({ history, onBack }: { history: WorkoutHistoryEntry[], onBack: () => void }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl active:scale-95 transition-transform"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">Histórico de Treino</h1>
          <p className="text-zinc-500 text-sm">Seus treinos concluídos</p>
        </div>
      </header>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            Nenhum treino concluído ainda.
          </div>
        ) : (
          history.map((entry) => (
            <div key={entry.id}>
              <Card className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-emerald-400">{entry.split}</h3>
                    <p className="text-xs text-zinc-500">{entry.date} • Semana {entry.weekNumber} - {entry.dayName}</p>
                  </div>
                  <Badge variant="outline">{entry.duration}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.exercises.map((ex, i) => (
                    <span key={i} className="text-[10px] bg-zinc-800 px-2 py-1 rounded-md text-zinc-400">
                      {ex.name}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsView({ profile, onUpdateProfile, onReset }: { profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, onReset: () => void }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-zinc-500">Gerencie seu perfil</p>
      </header>

      <div className="space-y-4">
        <Card>
          <h3 className="font-bold mb-4">Idioma</h3>
          <div className="flex gap-2">
            <Button 
              variant={profile.language === 'EN' ? 'primary' : 'outline'} 
              className="flex-1" 
              onClick={() => onUpdateProfile({ ...profile, language: 'EN' })}
            >
              English
            </Button>
            <Button 
              variant={profile.language === 'PT-BR' ? 'primary' : 'outline'} 
              className="flex-1" 
              onClick={() => onUpdateProfile({ ...profile, language: 'PT-BR' })}
            >
              Português
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-bold">Informações do Perfil</h3>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase">Nome</label>
            <Input value={profile.name} onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase">Peso (kg)</label>
              <Input type="number" value={profile.weight} onChange={(e) => onUpdateProfile({ ...profile, weight: parseFloat(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-bold uppercase">Altura (cm)</label>
              <Input type="number" value={profile.height} onChange={(e) => onUpdateProfile({ ...profile, height: parseFloat(e.target.value) })} />
            </div>
          </div>
        </Card>

        <Button variant="danger" className="w-full" onClick={onReset}>Resetar Todos os Dados</Button>
      </div>
    </div>
  );
}
