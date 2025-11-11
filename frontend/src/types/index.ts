export interface Proposal {
  id: string;
  clientName: string;
  projectName: string;
  description?: string;
  status: 'generated' | 'under_review' | 'approved' | 'excel_generated' | 'sent' | 'rejected';
  totalCost: number;
  totalPrice: number;
  durationMonths: number;
  complexity: 'low' | 'medium' | 'high';
  excelFilePath?: string;
  claudeAnalysis?: any;
  createdAt: string;
  updatedAt: string;
  resources?: ProposalResource[];

  // Campos de aprendizado (Phase 1)
  originalAIAnalysis?: any;
  userModifications?: any;
  wasModified?: boolean;
  accuracyRating?: number;
  feedbackNotes?: string;
  approvedAt?: string;
}

export interface ProposalResource {
  id: string;
  proposalId: string;
  professionalId: string;
  hoursPerMonth: number[];
  totalHours: number;
  cost: number;
  price: number;
  professional?: Professional;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  seniority: 'Junior' | 'Pleno' | 'Senior' | 'Especialista';
  hourlyCost: number;
  skills: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Parameter {
  id: string;
  key: 'tax' | 'sga' | 'margin';
  value: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIProvider {
  id: 'claude' | 'openai';
  name: string;
  model: string;
  description: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface APIResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface GenerateProposalRequest {
  clientName: string;
  projectName: string;
  description?: string;
  aiProvider?: 'claude' | 'openai';
  aiModel?: string;
  files: File[];
  selectedProfessionals?: string[]; // IDs dos profissionais selecionados
}

export interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  user: User;
  token: string;
}
