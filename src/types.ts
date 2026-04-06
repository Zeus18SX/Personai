export type Goal = 'Perder peso' | 'Ganhar músculo' | 'Ganhar massa' | 'Melhorar condicionamento' | 'Manter saúde';
export type TrainingLevel = 'Iniciante' | 'Intermediário' | 'Avançado';
export type Equipment = 'Sem equipamento' | 'Halteres' | 'Academia completa' | 'Academia em casa';
export type Duration = '30min' | '45min' | '60min' | '90min';
export type Sex = 'Masculino' | 'Feminino';

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  height: number;
  weight: number;
  goal: Goal;
  level: TrainingLevel;
  daysPerWeek: number;
  equipment: Equipment;
  duration: Duration;
  restrictions: string[];
  conditions: string;
  language: 'EN' | 'PT-BR';
  goalWeight?: number;
}

export interface Exercise {
  name: string;
  muscleGroup: string;
  sets: string;
  reps: string;
  rest: string;
  tips: string;
}

export interface WorkoutDay {
  dayName: string;
  split: string;
  exercises: Exercise[];
}

export interface WorkoutWeek {
  weekNumber: number;
  days: WorkoutDay[];
}

export interface WorkoutPlan {
  weeks: WorkoutWeek[];
  progressionLogic: string;
}

export interface Meal {
  name: string;
  time: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionPlan {
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: Meal[];
}

export interface WeightEntry {
  date: string;
  weight: number;
  note?: string;
}

export interface CalorieEntry {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timestamp: number;
}

export interface DailyLog {
  date: string;
  meals: CalorieEntry[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  weekNumber: number;
  dayName: string;
  split: string;
  exercises: Exercise[];
  duration: string;
}
