import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDefinition';

/**
 * Hook para acessar o contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
