import axios from 'axios';
import type {
  AIProvider,
  Proposal,
  ProposalListResponse,
  GenerateProposalRequest,
  APIResponse,
  Parameter,
  User,
  Professional,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirecionar para login se não estiver nas rotas públicas
      const publicRoutes = ['/login', '/register'];
      if (!publicRoutes.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const aiService = {
  async getProviders(): Promise<AIProvider[]> {
    const { data } = await api.get<APIResponse<{ providers: AIProvider[]; default: string }>>(
      '/proposals/ai-providers'
    );
    return data.data?.providers || [];
  },
};

// Helper para normalizar dados de professional (converte hourlyCost de string para number)
const normalizeProfessional = (prof: any): Professional => ({
  ...prof,
  hourlyCost: typeof prof.hourlyCost === 'string' ? parseFloat(prof.hourlyCost) : prof.hourlyCost,
});

export const professionalService = {
  async list(filters?: { role?: string; seniority?: string }): Promise<{ professionals: Professional[]; total: number }> {
    const { data } = await api.get<APIResponse<{ professionals: any[]; total: number }>>('/professionals', {
      params: filters,
    });
    const result = data.data || { professionals: [], total: 0 };
    return {
      professionals: result.professionals.map(normalizeProfessional),
      total: result.total,
    };
  },

  async getById(id: string): Promise<Professional> {
    const { data } = await api.get<APIResponse<any>>(`/professionals/${id}`);
    if (!data.data) {
      throw new Error('Profissional não encontrado');
    }
    return normalizeProfessional(data.data);
  },

  async create(professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>): Promise<Professional> {
    const { data } = await api.post<APIResponse<any>>('/professionals', professional);
    if (!data.data) {
      throw new Error(data.message || 'Erro ao criar profissional');
    }
    return normalizeProfessional(data.data);
  },

  async update(id: string, professional: Partial<Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Professional> {
    const { data } = await api.put<APIResponse<any>>(`/professionals/${id}`, professional);
    if (!data.data) {
      throw new Error(data.message || 'Erro ao atualizar profissional');
    }
    return normalizeProfessional(data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/professionals/${id}`);
  },
};

export const parameterService = {
  async list(): Promise<Parameter[]> {
    const { data } = await api.get<APIResponse<{ raw: any[] }>>('/parameters');
    // Backend retorna array 'raw' com formato diferente, vamos mapear
    const rawParams = data.data?.raw || [];
    return rawParams.map(p => ({
      id: p.id,
      key: p.name as 'tax' | 'sga' | 'margin',
      value: parseFloat(p.value) * 100, // Backend retorna decimal (0.25), frontend espera percentual (25)
      description: p.description,
      createdAt: p.updatedAt,
      updatedAt: p.updatedAt,
    }));
  },

  async getByKey(key: string): Promise<Parameter> {
    const { data } = await api.get<APIResponse<any>>(`/parameters/${key}`);
    if (!data.data) {
      throw new Error('Parâmetro não encontrado');
    }
    const p = data.data;
    return {
      id: p.id,
      key: p.name as 'tax' | 'sga' | 'margin',
      value: parseFloat(p.value) * 100,
      description: p.description,
      createdAt: p.updatedAt,
      updatedAt: p.updatedAt,
    };
  },

  async update(key: string, value: number): Promise<Parameter> {
    // Frontend envia percentual (25), backend espera decimal (0.25)
    const { data } = await api.put<APIResponse<any>>(`/parameters/${key}`, { value: value / 100 });
    if (!data.data) {
      throw new Error(data.message || 'Erro ao atualizar parâmetro');
    }
    const p = data.data;
    return {
      id: p.id,
      key: p.name as 'tax' | 'sga' | 'margin',
      value: parseFloat(p.value) * 100,
      description: p.description,
      createdAt: p.updatedAt,
      updatedAt: p.updatedAt,
    };
  },
};

export const userService = {
  async list(): Promise<{ users: User[]; total: number }> {
    const { data } = await api.get<APIResponse<{ users: User[]; total: number }>>('/users');
    return data.data || { users: [], total: 0 };
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get<APIResponse<User>>(`/users/${id}`);
    if (!data.data) {
      throw new Error('Usuário não encontrado');
    }
    return data.data;
  },

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const { data } = await api.put<APIResponse<User>>(`/users/${id}`, userData);
    if (!data.data) {
      throw new Error(data.message || 'Erro ao atualizar usuário');
    }
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

export const proposalService = {
  async generate(request: GenerateProposalRequest): Promise<Proposal> {
    const formData = new FormData();
    formData.append('clientName', request.clientName);
    formData.append('projectName', request.projectName);
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.aiProvider) {
      formData.append('aiProvider', request.aiProvider);
    }
    if (request.aiModel) {
      formData.append('aiModel', request.aiModel);
    }
    // Adicionar profissionais selecionados
    if (request.selectedProfessionals && request.selectedProfessionals.length > 0) {
      formData.append('selectedProfessionals', JSON.stringify(request.selectedProfessionals));
    }
    request.files.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await api.post<APIResponse<Proposal>>('/proposals/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!data.data) {
      throw new Error(data.message || 'Erro ao gerar proposta');
    }

    return data.data;
  },

  async list(filters?: {
    status?: string;
    clientName?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProposalListResponse> {
    const { data } = await api.get<APIResponse<ProposalListResponse>>('/proposals', {
      params: filters,
    });
    return data.data || { proposals: [], total: 0, limit: 50, offset: 0 };
  },

  async getById(id: string): Promise<Proposal> {
    const { data } = await api.get<APIResponse<Proposal>>(`/proposals/${id}`);
    if (!data.data) {
      throw new Error('Proposta não encontrada');
    }
    return data.data;
  },

  async download(id: string): Promise<Blob> {
    const { data } = await api.get(`/proposals/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/proposals/${id}`);
  },

  async update(
    id: string,
    updates: {
      durationMonths?: number;
      totalCost?: number;
      totalPrice?: number;
      description?: string;
      claudeAnalysis?: any;
    }
  ): Promise<Proposal> {
    const { data } = await api.put<APIResponse<Proposal>>(`/proposals/${id}`, updates);
    if (!data.data) {
      throw new Error(data.message || 'Erro ao atualizar proposta');
    }
    return data.data;
  },

  async approve(
    id: string,
    feedback?: {
      rating?: number;
      notes?: string;
    }
  ): Promise<{ id: string; status: string; excelDownloadUrl: string; wasModified: boolean; accuracyRating?: number }> {
    const { data } = await api.post<
      APIResponse<{ id: string; status: string; excelDownloadUrl: string; wasModified: boolean; accuracyRating?: number }>
    >(`/proposals/${id}/approve`, feedback || {});
    if (!data.data) {
      throw new Error(data.message || 'Erro ao aprovar proposta');
    }
    return data.data;
  },

  async updateResources(
    id: string,
    resources: Array<{
      resourceId: string;
      hoursPerWeek: number[];
    }>
  ): Promise<void> {
    await api.put(`/proposals/${id}/resources`, { resources });
  },
};

export default api;
