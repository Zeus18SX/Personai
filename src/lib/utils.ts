import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateBMI(weight: number, height: number) {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

export function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-400' };
  if (bmi < 25) return { label: 'Peso normal', color: 'text-green-400' };
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-400' };
  return { label: 'Obesidade', color: 'text-red-400' };
}

export function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}
