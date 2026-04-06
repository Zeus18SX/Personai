import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutPlan, NutritionPlan } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

export const generateWorkoutPlan = async (profile: UserProfile): Promise<WorkoutPlan> => {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere um plano de treino detalhado e periodizado para o seguinte usuário:
    Nome: ${profile.name}
    Idade: ${profile.age}
    Sexo: ${profile.sex}
    Altura: ${profile.height}cm
    Peso: ${profile.weight}kg
    Objetivo: ${profile.goal}
    Nível: ${profile.level}
    Dias por semana: ${profile.daysPerWeek}
    Equipamento: ${profile.equipment}
    Duração: ${profile.duration}
    Condições: ${profile.conditions}
    Idioma: Português (Brasil)

    A resposta deve ser um objeto JSON seguindo esta estrutura:
    {
      "weeks": [
        {
          "weekNumber": 1,
          "days": [
            {
              "dayName": "Segunda-feira",
              "split": "Peito e Tríceps",
              "exercises": [
                { "name": "Supino Reto", "muscleGroup": "Peito", "sets": "3", "reps": "10-12", "rest": "60s", "tips": "Mantenha as costas retas" }
              ]
            }
          ]
        }
      ],
      "progressionLogic": "Explicação de como progredir"
    }
    Forneça um plano de 4 semanas.`,
    config: {
      responseMimeType: "application/json",
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const generateNutritionPlan = async (profile: UserProfile): Promise<NutritionPlan> => {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Gere um plano de nutrição personalizado para o seguinte usuário:
    Nome: ${profile.name}
    Idade: ${profile.age}
    Sexo: ${profile.sex}
    Altura: ${profile.height}cm
    Peso: ${profile.weight}kg
    Objetivo: ${profile.goal}
    Restrições: ${profile.restrictions.join(", ")}
    Idioma: Português (Brasil)

    A resposta deve ser um objeto JSON seguindo esta estrutura:
    {
      "dailyCalories": 2500,
      "macros": { "protein": 180, "carbs": 250, "fat": 70 },
      "meals": [
        { "name": "Café da Manhã", "time": "08:00", "items": ["3 ovos", "100g aveia"], "calories": 500, "protein": 30, "carbs": 40, "fat": 15 }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const getExerciseTip = async (exerciseName: string, profile: UserProfile): Promise<string> => {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Dê uma dica profissional para o exercício "${exerciseName}" considerando um usuário de nível ${profile.level} e objetivo ${profile.goal}. Idioma: Português (Brasil). Seja curto e prático.`,
  });
  const response = await model;
  return response.text || "";
};

export const getAlternativeExercise = async (exerciseName: string, restriction: string, profile: UserProfile): Promise<any> => {
  const model = genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Sugira uma alternativa para "${exerciseName}" devido a esta restrição: "${restriction}". 
    Equipamento do usuário: ${profile.equipment}. 
    Idioma: Português (Brasil).
    Retorne um objeto JSON: { "name": "...", "muscleGroup": "...", "sets": "...", "reps": "...", "rest": "...", "tips": "..." }`,
    config: {
      responseMimeType: "application/json",
    }
  });
  const response = await model;
  return JSON.parse(response.text || "{}");
};

export const chatWithAI = async (messages: {role: string, text: string}[], profile: UserProfile): Promise<string> => {
  const chat = genAI.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `Você é o PersonAI, um personal trainer e nutricionista especialista. 
      Você conhece o perfil do usuário: ${JSON.stringify(profile)}. 
      Responda no idioma do usuário (${profile.language}). 
      Seja motivador, prático e preciso.`,
    }
  });

  // We only send the last message for simplicity in this helper, 
  // but the full history should be managed by the caller if needed.
  // Actually, let's just use the sendMessage API correctly.
  const lastMessage = messages[messages.length - 1].text;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text || "";
};
