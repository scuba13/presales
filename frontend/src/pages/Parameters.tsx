import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterService } from '../services/api';
import { Parameter } from '../types';
import { Save, RefreshCw, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Parameters() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  // Fetch all parameters
  const { data: parameters, isLoading, error } = useQuery({
    queryKey: ['parameters'],
    queryFn: async () => {
      console.log('Fetching parameters...');
      try {
        const result = await parameterService.list();
        console.log('Parameters data:', result);
        return result;
      } catch (err) {
        console.error('Error fetching parameters:', err);
        throw err;
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      parameterService.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parameters'] });
      toast.success('Parâmetros atualizados com sucesso!');
      setEditedValues({});
    },
    onError: () => {
      toast.error('Erro ao atualizar parâmetros');
    },
  });

  const handleSave = async () => {
    const updates = Object.entries(editedValues);
    if (updates.length === 0) {
      toast.error('Nenhuma alteração para salvar');
      return;
    }

    try {
      for (const [key, value] of updates) {
        await updateMutation.mutateAsync({ key, value });
      }
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const handleReset = () => {
    setEditedValues({});
    toast.success('Alterações descartadas');
  };

  const getValue = (param: Parameter) => {
    return editedValues[param.key] !== undefined ? editedValues[param.key] : param.value;
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  const getParameterInfo = (key: string) => {
    switch (key) {
      case 'tax':
        return {
          label: 'Impostos (%)',
          description: 'Percentual de impostos aplicado sobre o custo',
          icon: '💰',
        };
      case 'sga':
        return {
          label: 'SG&A (%)',
          description: 'Selling, General & Administrative - Despesas administrativas',
          icon: '📊',
        };
      case 'margin':
        return {
          label: 'Margem de Lucro (%)',
          description: 'Margem de lucro desejada sobre o preço final',
          icon: '📈',
        };
      default:
        return {
          label: key,
          description: 'Parâmetro do sistema',
          icon: '⚙️',
        };
    }
  };

  // Calculate example impact
  const calculateImpact = () => {
    const baseCost = 1000; // Example base cost
    const tax = getValue(parameters?.find(p => p.key === 'tax')!) / 100;
    const sga = getValue(parameters?.find(p => p.key === 'sga')!) / 100;
    const margin = getValue(parameters?.find(p => p.key === 'margin')!) / 100;

    const costWithTax = baseCost * (1 + tax);
    const costWithSGA = costWithTax * (1 + sga);
    const finalPrice = costWithSGA / (1 - margin);

    return {
      baseCost,
      tax: baseCost * tax,
      sga: costWithTax * sga,
      margin: finalPrice * margin,
      finalPrice,
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando parâmetros...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold text-lg mb-2">Erro ao carregar parâmetros</h2>
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

  const impact = parameters && parameters.length > 0 ? calculateImpact() : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parâmetros do Sistema</h1>
        <p className="text-gray-600">
          Configure os percentuais de impostos, despesas administrativas e margem de lucro
        </p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Sobre os parâmetros</p>
          <p>
            Estes valores são aplicados automaticamente no cálculo de todas as propostas. Alterações
            afetarão apenas novas propostas geradas.
          </p>
        </div>
      </div>

      {/* Parameters Cards */}
      <div className="space-y-6 mb-8">
        {parameters?.map((param) => {
          const info = getParameterInfo(param.key);
          const currentValue = getValue(param);
          const hasChanged = editedValues[param.key] !== undefined;

          return (
            <div
              key={param.id}
              className={`bg-white rounded-lg shadow p-6 transition-all ${
                hasChanged ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{info.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  </div>
                </div>
                {hasChanged && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                    Modificado
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={currentValue}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setEditedValues({
                          ...editedValues,
                          [param.key]: value,
                        });
                      }}
                      className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                      %
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <div>Valor atual: {param.value}%</div>
                  {hasChanged && (
                    <div className="text-primary-600 font-medium">
                      Alteração: {currentValue > param.value ? '+' : ''}
                      {(currentValue - param.value).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact Preview */}
      {impact && (
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Simulação de Impacto (Custo Base: R$ {impact.baseCost.toLocaleString('pt-BR')})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">Custo Base</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {impact.baseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">+ Impostos</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {impact.tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">+ SG&A</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {impact.sga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600">= Preço Final</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {impact.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Margem de Lucro</span>
              <span className="text-lg font-bold text-primary-600">
                R$ {impact.margin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleReset}
          disabled={!hasChanges || updateMutation.isPending}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Descartar Alterações</span>
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </div>
  );
}
