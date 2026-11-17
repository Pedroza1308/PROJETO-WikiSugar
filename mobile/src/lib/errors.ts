/** Error with a stable code raised by the app itself (validation, permissions…). */
export class AppError extends Error {
  readonly code: string;
  constructor(code: string, message?: string) {
    super(message ?? MESSAGES[code] ?? code);
    this.code = code;
    this.name = 'AppError';
  }
}

/** Messages for codes raised by our SQL functions, Supabase Auth and the app. */
const MESSAGES: Record<string, string> = {
  // App
  PERMISSION_DENIED: 'Permita o acesso nas configurações do aparelho para continuar.',
  EMAIL_TAKEN: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
  NOT_CONFIGURED: 'O app ainda não foi conectado ao Supabase (arquivo mobile/.env.local).',
  // SQL functions (supabase/migrations/*_functions.sql)
  NOT_AUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
  INVALID_GROUP_NAME: 'O nome do grupo precisa ter de 3 a 60 caracteres.',
  INVALID_DESCRIPTION: 'A descrição pode ter no máximo 280 caracteres.',
  INVALID_GROUP_PASSWORD: 'A senha do grupo precisa ter pelo menos 4 caracteres.',
  GROUP_FULL: 'Este grupo atingiu o limite de 10 participantes.',
  NO_GROUPS: 'Escolha pelo menos um grupo para publicar.',
  NOT_A_MEMBER: 'Você só pode publicar em grupos dos quais participa.',
  INVALID_CAPTION: 'A legenda pode ter no máximo 280 caracteres.',
  INVALID_PHOTO: 'Não foi possível usar esta foto. Tente outra.',
  PHOTO_NOT_FOUND: 'O envio da foto não terminou. Tente publicar de novo.',
  DUPLICATE_PHOTO: 'Esta foto já foi publicada.',
  // Supabase Auth (error.code)
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  user_already_exists: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
  email_exists: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.',
  weak_password: 'Senha fraca: use 8 ou mais caracteres com letras maiúsculas, minúsculas e números.',
  email_address_invalid: 'Este e-mail não é válido.',
  signup_disabled: 'Novos cadastros estão desativados no momento.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
};

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  status?: unknown;
}

/** Turns any thrown value (AppError, PostgrestError, AuthError, network) into a Portuguese message. */
export function messageFromError(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (!error) return fallback;
  if (error instanceof AppError) return error.message;
  const e = error as ErrorLike;
  const message = typeof e.message === 'string' ? e.message : '';
  const code = typeof e.code === 'string' ? e.code : '';

  // Our SQL functions raise the code as the exception message (e.g. "GROUP_FULL").
  if (message && MESSAGES[message]) return MESSAGES[message];
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (/network request failed|failed to fetch|fetch failed|networkerror|timed? ?out/i.test(message)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  if (code === 'PGRST202' || code === '42P01' || code === '42883') {
    return 'O banco de dados ainda não foi configurado. Rode os scripts da pasta supabase/migrations.';
  }
  if (code === '42501') return 'Você não tem permissão para esta ação.';
  return fallback;
}

export function errorCode(error: unknown): string {
  const e = error as ErrorLike | null;
  if (e && typeof e.message === 'string' && MESSAGES[e.message]) return e.message;
  if (e && typeof e.code === 'string') return e.code;
  return 'UNKNOWN';
}
