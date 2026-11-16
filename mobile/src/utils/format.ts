const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Formats a number using pt-BR conventions (1.300 / 7,5). */
export function formatNumber(value: number, maxFractionDigits = 0): string {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

/** Formats a decimal with a fixed number of fraction digits (25,8). */
export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

/** "TERÇA, 14 DE MAIO" */
export function formatLongDateUpper(date: Date = new Date()): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`.toUpperCase();
}

/** "14 de maio" */
export function formatDayMonth(date: Date = new Date()): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

/** "14 mai." */
export function formatShortDate(date: Date = new Date()): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}.`;
}

/** yyyy-mm-dd in local time */
export function toIsoDate(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** 7.35 -> "7h21", 8 -> "8h" */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (m === 60) return `${h + 1}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Parses "7h21", "7:21", "7,5" or "7" into decimal hours. Returns null if invalid. */
export function parseHours(text: string): number | null {
  const t = text.trim().toLowerCase();
  const hm = t.match(/^(\d{1,2})\s*[h:]\s*(\d{1,2})?\s*(min)?$/);
  if (hm) {
    const h = Number(hm[1]);
    const m = hm[2] ? Number(hm[2]) : 0;
    if (m >= 60) return null;
    return Math.round((h + m / 60) * 100) / 100;
  }
  const dec = Number(t.replace(',', '.'));
  return Number.isFinite(dec) && t.length > 0 ? dec : null;
}

/** Keeps only digits (and an optional decimal comma) and returns the numeric value. */
export function parseLocaleNumber(text: string): number {
  const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Lowercase, accent-insensitive string for search. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : parts[0][1] ?? '';
  return (first + last).toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
