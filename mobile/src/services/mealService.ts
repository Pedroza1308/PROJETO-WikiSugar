import { MEAL_SLOTS } from '../config/rules';
import { supabase } from '../lib/supabase';
import type { Meal, MealItem, MealSlot } from '../types';

interface MealItemRow {
  id: string;
  meal_slot: MealSlot;
  food_id: number | null;
  food_name: string;
  grams: number | string;
  kcal: number | string;
}

/** Groups the day's items into the fixed meal structure (empty meals included). */
export function buildMeals(items: MealItem[]): Meal[] {
  return MEAL_SLOTS.map((slot) => {
    const mine = items.filter((i) => i.slot === slot.id);
    return {
      id: slot.id,
      title: slot.title,
      time: slot.time,
      kcal: Math.round(mine.reduce((sum, i) => sum + i.kcal, 0)),
      items: mine,
    };
  });
}

export async function getMeals(userId: string, date: string): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meal_items')
    .select('id, meal_slot, food_id, food_name, grams, kcal')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('created_at');
  if (error) throw error;
  const items = ((data ?? []) as MealItemRow[]).map<MealItem>((r) => ({
    id: r.id,
    slot: r.meal_slot,
    foodId: r.food_id,
    name: r.food_name,
    grams: Number(r.grams),
    kcal: Number(r.kcal),
  }));
  return buildMeals(items);
}

/** Adds a TACO food to a meal. Name, kcal and carbs are computed by the database. */
export async function addFood(userId: string, date: string, slot: MealSlot, food: { id: number; name: string }, grams: number) {
  const { error } = await supabase.from('meal_items').insert({
    user_id: userId,
    entry_date: date,
    meal_slot: slot,
    food_id: food.id,
    food_name: food.name,
    grams,
  });
  if (error) throw error;
}

export async function removeItem(itemId: string) {
  const { error } = await supabase.from('meal_items').delete().eq('id', itemId);
  if (error) throw error;
}
