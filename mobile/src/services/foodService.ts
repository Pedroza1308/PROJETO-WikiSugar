import { supabase } from '../lib/supabase';
import type { Food } from '../types';

/** Row of public.foods (Tabela TACO, per 100 g). Postgres numeric may arrive as string. */
interface FoodRow {
  id: number;
  name: string;
  category: string;
  kcal: number | string | null;
  protein_g: number | string | null;
  fat_g: number | string | null;
  saturated_fat_g: number | string | null;
  carbs_g: number | string | null;
  fiber_g: number | string | null;
  sodium_mg: number | string | null;
}

const num = (v: number | string | null): number | null => (v === null || v === '' ? null : Number(v));

function toFood(r: FoodRow): Food {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    kcal: num(r.kcal),
    proteinG: num(r.protein_g),
    fatG: num(r.fat_g),
    saturatedFatG: num(r.saturated_fat_g),
    carbsG: num(r.carbs_g),
    fiberG: num(r.fiber_g),
    sodiumMg: num(r.sodium_mg),
  };
}

/** Accent/case-insensitive search; every word must appear in the name. */
export async function searchFoods(query: string): Promise<Food[]> {
  const { data, error } = await supabase.rpc('search_foods', { p_query: query.trim(), p_limit: 30 });
  if (error) throw error;
  return ((data ?? []) as FoodRow[]).map(toFood);
}

export async function getFoodById(id: number): Promise<Food> {
  const { data, error } = await supabase.from('foods').select('*').eq('id', id).single();
  if (error) throw error;
  return toFood(data as FoodRow);
}
