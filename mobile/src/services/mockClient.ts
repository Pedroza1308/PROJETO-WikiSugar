/** Simulated network latency for the mocked service layer. */
export const MOCK_LATENCY_MS = 400;

export function delay<T>(value: T, ms: number = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fail(message: string, ms: number = MOCK_LATENCY_MS): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

/** Deep-ish clone so screens never mutate mock data. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
