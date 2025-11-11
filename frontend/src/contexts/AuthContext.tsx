import { useState, useEffect, ReactNode } from 'react';
import type { User, AuthResponse, APIResponse } from '../types';
import api from '../services/api';
import { AuthContext } from './AuthContextDefinition';

/**
 * AuthProvider - Provedor de contexto de autenticação
 * Gerencia estado de autenticação e localStorage
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const { data } = await api.post<APIResponse<AuthResponse>>('/auth/login', credentials);

    if (data.data) {
      const { user, token } = data.data;

      // Salvar no state
      setUser(user);
      setToken(token);

      // Salvar no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      throw new Error(data.message || 'Erro ao fazer login');
    }
  };

  const register = async (registerData: RegisterRequest) => {
    const { data } = await api.post<APIResponse<AuthResponse>>('/auth/register', registerData);

    if (data.data) {
      const { user, token } = data.data;

      // Salvar no state
      setUser(user);
      setToken(token);

      // Salvar no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      throw new Error(data.message || 'Erro ao criar conta');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
