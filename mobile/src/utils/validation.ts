export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/**
 * Minimum password requirements. Configure the same policy in Supabase
 * (Authentication › Providers › Email: minimum length 8 and "lowercase,
 * uppercase letters and digits") so the server enforces it too.
 */
export const PASSWORD_RULES: readonly { id: string; label: string; test: (password: string) => boolean }[] = [
  { id: 'length', label: 'Pelo menos 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'Um número', test: (p) => /\d/.test(p) },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
