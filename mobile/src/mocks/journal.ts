import type { JournalDraft } from '../types';

export const mockJournalDefaults: JournalDraft = {
  waterMl: 1800,
  sleep: '7h21',
  tookMedication: true,
  medicationTime: '08:00',
  activityType: '',
  activityMinutes: '',
  notes: '',
};

export const mockRecentSearches: string[] = ['Arroz integral', 'Banana'];
