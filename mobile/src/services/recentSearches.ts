/** Recent food searches, stored only on this device and per account. */
const MAX_RECENT = 5;
const keyFor = (userId: string) => `wikisugar:recent-searches:${userId}`;

export function getRecentSearches(userId: string): string[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(userId: string, term: string): string[] {
  const next = [term, ...getRecentSearches(userId).filter((t) => t !== term)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch {
    // storage unavailable: keep the list only in memory
  }
  return next;
}
