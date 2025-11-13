import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { proposalService } from '../services/api'
import { FileText, Download, Trash2, Eye, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => proposalService.list({ limit: 50, offset: 0 }),
    retry: 2,
  })

  // Mostrar toast de erro se a query falhar
  if (error) {
    console.error('Erro ao carregar propostas:', error)
    toast.error('Erro ao carregar propostas. Tente recarregar a página.', { id: 'query-error' })
  }

  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a proposta para ${clientName}?`)) {
      return
    }

    try {
      await proposalService.delete(id)
      toast.success('Proposta deletada com sucesso!')
      refetch()
    } catch (error: any) {
      console.error('Erro ao deletar proposta:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao deletar proposta'
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  const handleDownload = async (id: string, clientName: string) => {
    try {
      const blob = await proposalService.download(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposta-${clientName.toLowerCase().replace(/\s+/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Download iniciado!')
    } catch (error: any) {
      console.error('Erro ao fazer download:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao fazer download do arquivo'
      toast.error(errorMessage, { duration: 5000 })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const totalProposals = data?.total || 0
  const totalValue = data?.proposals.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0) || 0
  const avgValue = totalProposals > 0 ? totalValue / totalProposals : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Presales AI</h1>
            <p className="text-gray-600 mt-1">Sistema de Pré-Venda com Inteligência Artificial</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total de Propostas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalProposals}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Média por Proposta</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(avgValue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Propostas Recentes</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : data?.proposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Nenhuma proposta encontrada</p>
              <p className="text-gray-500 mt-2">Clique em "Nova Proposta" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projeto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexidade</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.proposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{proposal.clientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          proposal.status === 'approved' || proposal.status === 'excel_generated'
                            ? 'bg-green-100 text-green-800'
                            : proposal.status === 'under_review' || proposal.status === 'generated'
                            ? 'bg-yellow-100 text-yellow-800'
                            : proposal.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {proposal.status === 'approved' ? 'Aprovada' :
                           proposal.status === 'excel_generated' ? 'Excel Gerado' :
                           proposal.status === 'under_review' ? 'Em Revisão' :
                           proposal.status === 'generated' ? 'Gerada' :
                           proposal.status === 'rejected' ? 'Rejeitada' :
                           proposal.status === 'draft' ? 'Rascunho' :
                           proposal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{proposal.projectName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(proposal.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proposal.durationMonths} meses</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(proposal.totalPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          proposal.complexity === 'high'
                            ? 'bg-red-100 text-red-800'
                            : proposal.complexity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {proposal.complexity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/proposals/${proposal.id}`} className="text-blue-600 hover:text-blue-900" title="Visualizar">
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleDownload(proposal.id, proposal.clientName)} className="text-green-600 hover:text-green-900" title="Download Excel">
                            <Download className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(proposal.id, proposal.clientName)} className="text-red-600 hover:text-red-900" title="Deletar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
