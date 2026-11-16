import { mockJournalDefaults } from '../mocks/journal';
import type { JournalDraft, JournalEntry } from '../types';
import { toIsoDate } from '../utils/format';
import { clone, delay } from './mockClient';

/**
 * Wellbeing journal service (mocked).
 * Future: GET /journal/:date, PUT /journal/:date.
 */
const entries = new Map<string, JournalEntry>();

export async function getTodayEntry(): Promise<JournalDraft> {
  const saved = entries.get(toIsoDate());
  if (saved) {
    const { date: _date, ...draft } = saved;
    return delay(clone(draft), 0);
  }
  return delay(clone(mockJournalDefaults), 0);
}

export async function saveEntry(draft: JournalDraft): Promise<JournalEntry> {
  const entry: JournalEntry = { ...clone(draft), date: toIsoDate() };
  entries.set(entry.date, entry);
  return delay(clone(entry));
}
