import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { proposalService } from '../services/api'
import { ArrowLeft, Download, Calendar, DollarSign, Clock, TrendingUp, Loader2, Sparkles, Brain } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProposalView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalService.getById(id!),
    enabled: !!id,
  })

  const handleDownload = async () => {
    if (!id || !proposal) return

    try {
      const blob = await proposalService.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposta-${proposal.clientName.toLowerCase().replace(/\s+/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Download iniciado!')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const getAIInfo = () => {
    const analysis = proposal?.claudeAnalysis as any
    if (analysis?.aiProvider === 'openai') {
      return { name: 'OpenAI GPT', icon: Brain, color: 'text-green-600' }
    }
    return { name: 'Anthropic Claude', icon: Sparkles, color: 'text-purple-600' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Proposta não encontrada</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  const aiInfo = getAIInfo()
  const AIIcon = aiInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.projectName}</h1>
              <p className="text-gray-600 mt-1">{proposal.clientName}</p>
              <div className="flex items-center gap-2 mt-2">
                <AIIcon className={`w-4 h-4 ${aiInfo.color}`} />
                <span className="text-sm text-gray-600">Gerado por {aiInfo.name}</span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumo Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Valor da Proposta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(proposal.totalPrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Custo Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(proposal.totalCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Duração</p>
                <p className="text-2xl font-bold text-gray-900">
                  {proposal.durationMonths} meses
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Data de Criação</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(proposal.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Projeto</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Status</dt>
                <dd className="mt-1">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {proposal.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Complexidade</dt>
                <dd className="mt-1">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      proposal.complexity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : proposal.complexity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {proposal.complexity}
                  </span>
                </dd>
              </div>
              {proposal.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-600">Descrição</dt>
                  <dd className="mt-1 text-sm text-gray-900">{proposal.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise Financeira</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">Custo Base</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {formatCurrency(proposal.totalCost)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">Imposto (21%)</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {formatCurrency(proposal.totalCost * 0.21)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-600">SG&A (10%)</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {formatCurrency(proposal.totalCost * 0.10)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <dt className="text-sm font-medium text-gray-600">Margem (25%)</dt>
                <dd className="text-sm font-semibold text-green-600">
                  {formatCurrency(proposal.totalPrice - proposal.totalCost)}
                </dd>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                <dt className="text-base font-bold text-gray-900">Preço Final</dt>
                <dd className="text-base font-bold text-blue-600">
                  {formatCurrency(proposal.totalPrice)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Recursos da Proposta */}
        {proposal.resources && proposal.resources.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recursos Alocados</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profissional
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposal.resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {resource.professional?.role || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resource.totalHours}h</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(resource.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(resource.price)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
