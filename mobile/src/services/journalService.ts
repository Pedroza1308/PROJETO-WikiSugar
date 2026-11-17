import { supabase } from '../lib/supabase';
import type { JournalDraft } from '../types';
import { formatHours, parseHours } from '../utils/format';

interface JournalRow {
  entry_date: string;
  water_ml: number;
  sleep_hours: number | string | null;
  took_medication: boolean;
  medication_time: string | null;
  activity_type: string | null;
  activity_minutes: number | null;
  notes: string | null;
}

export const EMPTY_JOURNAL: JournalDraft = {
  waterMl: 0,
  sleep: '',
  tookMedication: false,
  medicationTime: '',
  activityType: '',
  activityMinutes: '',
  notes: '',
};

function toDraft(r: JournalRow): JournalDraft {
  const sleep = r.sleep_hours === null ? null : Number(r.sleep_hours);
  return {
    waterMl: r.water_ml ?? 0,
    sleep: sleep === null ? '' : formatHours(sleep),
    tookMedication: r.took_medication,
    medicationTime: r.medication_time ?? '',
    activityType: r.activity_type ?? '',
    activityMinutes: r.activity_minutes === null ? '' : String(r.activity_minutes),
    notes: r.notes ?? '',
  };
}

/** Journal of the given day (yyyy-mm-dd), or an empty draft when nothing was saved. */
export async function getEntry(userId: string, date: string): Promise<JournalDraft> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date, water_ml, sleep_hours, took_medication, medication_time, activity_type, activity_minutes, notes')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? toDraft(data as JournalRow) : { ...EMPTY_JOURNAL };
}

export async function saveEntry(userId: string, date: string, draft: JournalDraft): Promise<JournalDraft> {
  const minutes = draft.activityMinutes.trim() ? Number(draft.activityMinutes) : null;
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      {
        user_id: userId,
        entry_date: date,
        water_ml: Math.max(0, Math.round(draft.waterMl)),
        sleep_hours: draft.sleep.trim() ? parseHours(draft.sleep) : null,
        took_medication: draft.tookMedication,
        medication_time: draft.tookMedication && draft.medicationTime.trim() ? draft.medicationTime.trim() : null,
        activity_type: draft.activityType.trim() || null,
        activity_minutes: Number.isFinite(minutes) ? minutes : null,
        notes: draft.notes.trim() || null,
      },
      { onConflict: 'user_id,entry_date' },
    )
    .select('entry_date, water_ml, sleep_hours, took_medication, medication_time, activity_type, activity_minutes, notes')
    .single();
  if (error) throw error;
  return toDraft(data as JournalRow);
}

/** Updates only the water of the day (keeps the other journal fields). */
export async function setWater(userId: string, date: string, waterMl: number): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .upsert({ user_id: userId, entry_date: date, water_ml: Math.round(waterMl) }, { onConflict: 'user_id,entry_date' });
  if (error) throw error;
}
