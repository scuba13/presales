import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalService } from '../services/api';
import { Professional } from '../types';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Professionals() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [filters, setFilters] = useState({ role: '', seniority: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch professionals
  const { data, isLoading, error } = useQuery({
    queryKey: ['professionals', filters],
    queryFn: async () => {
      console.log('Fetching professionals...', filters);
      try {
        const result = await professionalService.list(filters);
        console.log('Professionals data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching professionals:', err);
        throw err;
      }
    },
  });

  const professionals = data?.professionals || [];
  const total = data?.total || 0;

  // Filter by search term
  const filteredProfessionals = professionals.filter((prof) =>
    prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir profissional');
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProfessional(null);
    setIsModalOpen(true);
  };

  const getSeniorityColor = (seniority: string) => {
    switch (seniority) {
      case 'Junior':
        return 'bg-green-100 text-green-800';
      case 'Pleno':
        return 'bg-blue-100 text-blue-800';
      case 'Senior':
        return 'bg-purple-100 text-purple-800';
      case 'Especialista':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats
  const avgCost = professionals.length > 0
    ? professionals.reduce((sum, p) => sum + p.hourlyCost, 0) / professionals.length
    : 0;
  const uniqueRoles = new Set(professionals.map(p => p.role)).size;

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold text-lg mb-2">Erro ao carregar profissionais</h2>
          <p className="text-red-600">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Profissionais</h1>
        <p className="text-gray-600">Gerencie o catálogo de profissionais disponíveis</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total de Profissionais</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Custo Médio/Hora</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">
            R$ {avgCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Cargos Únicos</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{uniqueRoles}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos os Cargos</option>
            <option value="Desenvolvedor">Desenvolvedor</option>
            <option value="Arquiteto">Arquiteto</option>
            <option value="Designer">Designer</option>
            <option value="Gerente de Projetos">Gerente de Projetos</option>
            <option value="QA">QA</option>
          </select>

          {/* Seniority Filter */}
          <select
            value={filters.seniority}
            onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todas as Senioridades</option>
            <option value="Junior">Junior</option>
            <option value="Pleno">Pleno</option>
            <option value="Senior">Senior</option>
            <option value="Especialista">Especialista</option>
          </select>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Carregando profissionais...</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum profissional encontrado
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custo/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfessionals.map((professional) => (
                <tr key={professional.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {professional.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{professional.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeniorityColor(professional.seniority)}`}>
                      {professional.seniority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      R$ {professional.hourlyCost.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {professional.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {professional.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{professional.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(professional)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(professional.id, professional.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ProfessionalModal
          professional={editingProfessional}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['professionals'] });
          }}
        />
      )}
    </div>
  );
}

// Modal Component
interface ProfessionalModalProps {
  professional: Professional | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ProfessionalModal({ professional, onClose, onSuccess }: ProfessionalModalProps) {
  const [formData, setFormData] = useState({
    name: professional?.name || '',
    role: professional?.role || '',
    seniority: professional?.seniority || 'Junior',
    hourlyCost: professional?.hourlyCost || 0,
    skills: professional?.skills.join(', ') || '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (professional) {
        return professionalService.update(professional.id, payload);
      } else {
        return professionalService.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(professional ? 'Profissional atualizado!' : 'Profissional criado!');
      onSuccess();
    },
    onError: () => {
      toast.error('Erro ao salvar profissional');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {professional ? 'Editar Profissional' : 'Novo Profissional'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: João Silva"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo *
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Desenvolvedor Full Stack"
            />
          </div>

          {/* Seniority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senioridade *
            </label>
            <select
              required
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="Junior">Junior</option>
              <option value="Pleno">Pleno</option>
              <option value="Senior">Senior</option>
              <option value="Especialista">Especialista</option>
            </select>
          </div>

          {/* Hourly Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custo por Hora (R$) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.hourlyCost}
              onChange={(e) => setFormData({ ...formData, hourlyCost: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: 150.00"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (separadas por vírgula) *
            </label>
            <textarea
              required
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Ex: React, TypeScript, Node.js, MongoDB"
            />
            <p className="mt-1 text-sm text-gray-500">
              Digite as habilidades separadas por vírgula
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
