/**
 * Tipos compartilhados para respostas da API
 * Estes tipos devem ser consistentes com os tipos do frontend
 */

// Resposta padrão da API
export interface APIResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Códigos de erro customizados
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNAUTHORIZED_API = 'UNAUTHORIZED_API',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Resposta de erro detalhada
export interface ErrorResponse {
  status: 'error';
  message: string;
  code?: ErrorCode | string;
  details?: any;
}

// Tipos de usuário
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de profissional
export interface ProfessionalDTO {
  id: string;
  name: string;
  role: string;
  seniority: 'Junior' | 'Pleno' | 'Senior' | 'Especialista';
  hourlyCost: number;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de parâmetro
export interface ParameterDTO {
  id: string;
  name: 'tax' | 'sga' | 'margin';
  value: number;
  type: string;
  description: string;
  updatedAt: Date;
}

// Tipos de proposta
export interface ProposalDTO {
  id: string;
  clientName: string;
  projectName: string;
  description?: string;
  status: 'draft' | 'generated' | 'sent' | 'approved' | 'rejected';
  totalCost: number;
  totalPrice: number;
  durationMonths: number;
  complexity?: 'low' | 'medium' | 'high';
  aiProvider?: string;
  excelFilePath?: string;
  createdAt: Date;
  updatedAt: Date;
  resources?: ProposalResourceDTO[];
}

export interface ProposalResourceDTO {
  id: string;
  proposalId: string;
  professionalId: string;
  hoursPerMonth: number[];
  totalHours: number;
  cost: number;
  price: number;
  professional?: ProfessionalDTO;
}

// Tipos de autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}

// Tipos de listagem paginada
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Tipos de filtros
export interface ProposalFilters {
  status?: string;
  clientName?: string;
  limit?: number;
  offset?: number;
}

export interface ProfessionalFilters {
  role?: string;
  seniority?: string;
}
