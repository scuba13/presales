import { toast } from 'react-hot-toast';
import axios, { AxiosError } from 'axios';

/**
 * Interface para resposta de erro da API
 */
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: any;
}

/**
 * Mensagens amigáveis para códigos de erro
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Erros de autenticação
  UNAUTHORIZED: 'Você precisa estar logado para acessar este recurso',
  FORBIDDEN: 'Você não tem permissão para realizar esta ação',
  INVALID_TOKEN: 'Sua sessão expirou. Por favor, faça login novamente',
  NO_TOKEN: 'Autenticação necessária. Por favor, faça login',

  // Erros de validação
  VALIDATION_ERROR: 'Os dados fornecidos são inválidos',
  NOT_FOUND: 'Recurso não encontrado',

  // Erros de API de IA
  QUOTA_EXCEEDED: 'Limite de uso da API de IA excedido. Tente novamente mais tarde',
  UNAUTHORIZED_API: 'Erro de autenticação com a API de IA. Verifique as configurações',
  CLAUDE_API_ERROR: 'Erro ao processar com Claude AI. Tente novamente',
  AI_API_ERROR: 'Erro ao processar com a IA. Tente novamente',

  // Erros de rede
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente',
  TIMEOUT: 'A requisição demorou muito. Tente novamente',

  // Erro genérico
  INTERNAL_ERROR: 'Erro interno do servidor. Nossa equipe foi notificada',
};

/**
 * Extrai mensagem de erro de uma resposta de erro
 */
export function getErrorMessage(error: unknown): string {
  // Se for AxiosError (erro HTTP)
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    // Erro de rede (sem resposta do servidor)
    if (!axiosError.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    const { data, status } = axiosError.response;

    // Se tem código de erro customizado
    if (data?.code && ERROR_MESSAGES[data.code]) {
      return ERROR_MESSAGES[data.code];
    }

    // Se tem mensagem da API
    if (data?.message) {
      return data.message;
    }

    // Mensagens por status HTTP
    switch (status) {
      case 400:
        return 'Requisição inválida. Verifique os dados e tente novamente';
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.QUOTA_EXCEEDED;
      case 500:
        return ERROR_MESSAGES.INTERNAL_ERROR;
      case 503:
        return 'Serviço temporariamente indisponível. Tente novamente em breve';
      default:
        return `Erro inesperado (${status}). Tente novamente`;
    }
  }

  // Se for Error nativo
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return 'Erro desconhecido. Tente novamente';
}

/**
 * Mostra toast de erro com mensagem amigável
 */
export function handleError(error: unknown, customMessage?: string): void {
  const message = customMessage || getErrorMessage(error);

  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });

  // Log detalhado para debug (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.error('Erro detalhado:', error);
  }
}

/**
 * Mostra toast de sucesso
 */
export function handleSuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
}

/**
 * Verifica se erro é de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Verifica se erro é de permissão (403)
 */
export function isForbiddenError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Verifica se erro é de quota da API de IA
 */
export function isQuotaError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    return code === 'QUOTA_EXCEEDED' || error.response?.status === 429;
  }
  return false;
}
