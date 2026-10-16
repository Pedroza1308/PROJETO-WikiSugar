import type { Meal } from '../types';

export const mockMeals: Meal[] = [
  { id: 'm-1', title: 'Café da manhã', time: '7h–8h', kcal: 386, foods: ['Pão integral · 2 fatias', 'Ovo mexido · 2 unidades'] },
  { id: 'm-2', title: 'Almoço', time: '12h–13h', kcal: 524, foods: ['Frango grelhado · 120 g', 'Feijão carioca · 1 concha'] },
  { id: 'm-3', title: 'Lanche / Pós-treino', time: '16h', kcal: 220, foods: ['Iogurte natural · 1 pote', 'Banana prata · 1 unidade'] },
  { id: 'm-4', title: 'Jantar', time: '19h–21h', kcal: 0, foods: [] },
  { id: 'm-5', title: 'Ceia', time: '22h', kcal: 0, foods: [] },
];

export const LUNCH_MEAL_ID = 'm-2';
