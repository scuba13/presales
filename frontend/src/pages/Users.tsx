import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/api';
import { useAuth } from '../hooks';
import { User } from '../types';
import { Shield, ShieldOff, Trash2, Edit, Search, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

export default function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Redirect if not admin
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list(),
  });

  const users = data?.users || [];
  const total = data?.total || 0;

  // Filter by search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) =>
      userService.update(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    },
  });

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Você não pode desativar sua própria conta');
      return;
    }
    updateMutation.mutate({
      id: user.id,
      userData: { isActive: !user.isActive },
    });
  };

  const handleToggleRole = async (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Você não pode alterar seu próprio papel');
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    updateMutation.mutate({
      id: user.id,
      userData: { role: newRole },
    });
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
        Usuário
      </span>
    );
  };

  // Calculate stats
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h1>
        <p className="text-gray-600">Gerencie permissões e status dos usuários do sistema</p>
      </div>

      {/* Admin Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Área Administrativa</p>
          <p>
            Esta página é visível apenas para administradores. Tenha cuidado ao modificar
            permissões de usuários.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total de Usuários</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Usuários Ativos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Administradores</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{adminUsers}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-gray-500">(Você)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                      {!isCurrentUser && (
                        <>
                          <button
                            onClick={() => handleToggleRole(user)}
                            className="text-purple-600 hover:text-purple-900 inline-flex items-center space-x-1"
                            title={user.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                          >
                            {user.role === 'admin' ? (
                              <ShieldOff className="w-5 h-5" />
                            ) : (
                              <Shield className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`${
                              user.isActive
                                ? 'text-orange-600 hover:text-orange-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isActive ? 'Desativar' : 'Ativar'}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
