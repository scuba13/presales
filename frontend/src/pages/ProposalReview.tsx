import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proposalService, parameterService } from '../services/api'
import { ArrowLeft, Save, Check, Star, Loader2, Sparkles, Brain, Download, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ProposalReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [durationMonths, setDurationMonths] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [description, setDescription] = useState<string>('')
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isEdited, setIsEdited] = useState(false)
  const [resourceAllocations, setResourceAllocations] = useState<any[]>([])
  const [parameters, setParameters] = useState({ tax: 0.21, sga: 0.10, margin: 0.25 })
  const [isEditMode, setIsEditMode] = useState(false)
  const [proposalMargin, setProposalMargin] = useState<number>(25) // Margem da proposta em %
  const [showAddProfessionalModal, setShowAddProfessionalModal] = useState(false)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('')
  const [scheduleData, setScheduleData] = useState<{
    sprints: Array<{ number: number; deliverables: string[]; startWeek: number; durationWeeks: number }>
    milestones: Array<{ name: string; date: string; weekIndex: number }>
    dependencies: Array<{ task: string; dependsOn: string[] }>
    riskBuffer: number
  }>({
    sprints: [],
    milestones: [],
    dependencies: [],
    riskBuffer: 15
  })

  // Calcular número total de semanas baseado na duração do projeto
  const totalWeeks = durationMonths * 4

  // Converter horas de mês para semana (cada mês = 4 semanas)
  const convertMonthsToWeeks = (hoursPerMonth: number[]) => {
    const weeks: number[] = []
    hoursPerMonth.forEach(monthHours => {
      const weeklyHours = monthHours / 4
      weeks.push(weeklyHours, weeklyHours, weeklyHours, weeklyHours)
    })
    return weeks
  }

  // Converter horas de semana para mês
  const convertWeeksToMonths = (hoursPerWeek: number[]) => {
    const months: number[] = []
    for (let i = 0; i < hoursPerWeek.length; i += 4) {
      const monthTotal = hoursPerWeek.slice(i, i + 4).reduce((sum, h) => sum + h, 0)
      months.push(monthTotal)
    }
    return months
  }

  // Calcular custo e preço de um recurso
  const calculateResourceCostAndPrice = (totalHours: number, hourlyCost: number) => {
    const baseCost = totalHours * hourlyCost
    const costWithTax = baseCost * (1 + parameters.tax)
    const finalCost = costWithTax * (1 + parameters.sga)
    const finalPrice = finalCost / (1 - parameters.margin)
    return { cost: finalCost, price: finalPrice }
  }

  // Recalcular totais da proposta
  const recalculateTotals = (allocations: any[]) => {
    let newTotalCost = 0
    let newTotalPrice = 0

    allocations.forEach(alloc => {
      const totalHours = alloc.hoursPerWeek.slice(0, totalWeeks).reduce((sum: number, h: number) => sum + h, 0)
      const { cost, price } = calculateResourceCostAndPrice(totalHours, alloc.hourlyCost)
      newTotalCost += cost
      newTotalPrice += price
    })

    setTotalCost(newTotalCost)
    setTotalPrice(newTotalPrice)
  }

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalService.getById(id!),
    enabled: !!id,
  })

  // Carregar parâmetros (tax, sga, margin)
  const { data: parametersData } = useQuery({
    queryKey: ['parameters'],
    queryFn: () => parameterService.list(),
  })

  // Carregar profissionais disponíveis
  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await api.get('/professionals')
      return response.data.data
    },
  })

  // Atualizar parâmetros quando carregados
  useEffect(() => {
    if (parametersData) {
      const tax = parametersData.find(p => p.key === 'tax')?.value || 21
      const sga = parametersData.find(p => p.key === 'sga')?.value || 10
      const margin = parametersData.find(p => p.key === 'margin')?.value || 25
      setParameters({
        tax: tax / 100,
        sga: sga / 100,
        margin: margin / 100,
      })
      setProposalMargin(margin) // Inicializar margem da proposta
    }
  }, [parametersData])

  // Determinar modo de visualização baseado no status
  useEffect(() => {
    if (proposal) {
      // Se status é 'approved' ou 'excel_generated', mostrar modo visualização
      // Senão, mostrar modo edição
      const isApproved = proposal.status === 'approved' || proposal.status === 'excel_generated'
      console.log('🔍 DEBUG - Status da proposta:', proposal.status)
      console.log('🔍 DEBUG - isApproved:', isApproved)
      console.log('🔍 DEBUG - isEditMode será:', !isApproved)
      setIsEditMode(!isApproved)
    }
  }, [proposal])

  // Initialize form fields when proposal loads
  useEffect(() => {
    if (proposal) {
      setDurationMonths(proposal.durationMonths)
      setTotalCost(proposal.totalCost)
      setTotalPrice(proposal.totalPrice)

      // Usar o scope da análise da IA como descrição
      const analysis = proposal.claudeAnalysis as any
      const aiGeneratedDescription = analysis?.analysis?.scope || proposal.description || ''
      setDescription(aiGeneratedDescription)

      // Inicializar alocações por semana
      if (proposal.resources) {
        const allocations = proposal.resources.map(resource => ({
          resourceId: resource.id,
          professionalName: resource.professional?.name || 'N/A',
          professionalRole: resource.professional?.role || 'N/A',
          hourlyCost: resource.professional?.hourlyCost || 0,
          hoursPerWeek: convertMonthsToWeeks(resource.hoursPerMonth),
        }))
        setResourceAllocations(allocations)
      }

      // Inicializar cronograma
      if (analysis?.schedule) {
        const schedule = analysis.schedule
        // Processar sprints: calcular startWeek baseado no número do sprint (assumindo 2 semanas cada)
        const sprints = (schedule.sprints || []).map((sprint: any) => ({
          number: sprint.number,
          deliverables: Array.isArray(sprint.deliverables) ? sprint.deliverables : [sprint.deliverables],
          startWeek: (sprint.number - 1) * 2, // Sprints de 2 semanas
          durationWeeks: 2
        }))

        // Processar milestones: calcular weekIndex baseado no date (ex: "M3" = mês 3)
        const milestones = (schedule.milestones || []).map((milestone: any) => {
          const monthMatch = milestone.date.match(/M(\d+)/)
          const weekIndex = monthMatch ? (parseInt(monthMatch[1]) - 1) * 4 : 0
          return {
            name: milestone.name,
            date: milestone.date,
            weekIndex
          }
        })

        setScheduleData({
          sprints,
          milestones,
          dependencies: schedule.dependencies || [],
          riskBuffer: schedule.riskBuffer || 15
        })
      }
    }
  }, [proposal])

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Preparar claudeAnalysis atualizado com o schedule editado
      const updatedAnalysis = {
        ...(proposal?.claudeAnalysis || {}),
        schedule: {
          sprints: scheduleData.sprints.map(s => ({
            number: s.number,
            deliverables: s.deliverables
          })),
          milestones: scheduleData.milestones.map(m => ({
            name: m.name,
            date: m.date
          })),
          dependencies: scheduleData.dependencies,
          riskBuffer: scheduleData.riskBuffer
        }
      }

      // Atualizar campos da proposta (incluindo cronograma)
      await proposalService.update(id!, {
        durationMonths,
        totalCost,
        totalPrice,
        description,
        claudeAnalysis: updatedAnalysis,
      })

      // Atualizar alocações de recursos
      const resources = resourceAllocations.map(alloc => ({
        resourceId: alloc.resourceId,
        hoursPerWeek: alloc.hoursPerWeek,
      }))
      await proposalService.updateResources(id!, resources)
    },
    onSuccess: () => {
      toast.success('Proposta atualizada com sucesso!')
      setIsEdited(false)
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
    },
    onError: () => {
      toast.error('Erro ao atualizar proposta')
    },
  })

  const approveMutation = useMutation({
    mutationFn: () =>
      proposalService.approve(id!, {
        rating: rating > 0 ? rating : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Proposta aprovada! Excel gerado com sucesso.')
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      // Pequeno delay para garantir que o modo de visualização seja ativado
      setTimeout(() => {
        setIsEditMode(false)
      }, 100)
    },
    onError: () => {
      toast.error('Erro ao aprovar proposta')
    },
  })

  const handleSaveChanges = () => {
    updateMutation.mutate()
  }

  const handleApprove = () => {
    // Se houve edições, salvar primeiro
    if (isEdited) {
      toast.error('Salve as alterações antes de aprovar')
      return
    }
    approveMutation.mutate()
  }

  const handleDownloadExcel = async () => {
    if (!proposal?.id) {
      toast.error('Proposta não encontrada')
      return
    }

    try {
      const loadingToast = toast.loading('Gerando Excel...')
      const blob = await proposalService.download(proposal.id)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `proposta-${proposal.clientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.dismiss(loadingToast)
      toast.success('Download iniciado!')
    } catch (error) {
      console.error('❌ Erro ao baixar Excel:', error)
      toast.error('Erro ao gerar Excel')
    }
  }

  const handleAddProfessional = () => {
    if (!selectedProfessionalId) {
      toast.error('Selecione um profissional')
      return
    }

    const professional = professionals?.find((p: any) => p.id === selectedProfessionalId)
    if (!professional) {
      toast.error('Profissional não encontrado')
      return
    }

    // Verificar se já existe
    const exists = resourceAllocations.find(r => r.professionalName === professional.name)
    if (exists) {
      toast.error('Profissional já adicionado')
      return
    }

    // Criar nova alocação com 0 horas em todas as semanas
    const newAllocation = {
      resourceId: `temp-${Date.now()}`, // ID temporário
      professionalName: professional.name,
      professionalRole: professional.role,
      hourlyCost: professional.hourlyCost,
      hoursPerWeek: Array(totalWeeks).fill(0),
    }

    setResourceAllocations([...resourceAllocations, newAllocation])
    setShowAddProfessionalModal(false)
    setSelectedProfessionalId('')
    setIsEdited(true)
    handleFieldChange()
    toast.success('Profissional adicionado! Lembre-se de salvar.')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getAIInfo = () => {
    const analysis = proposal?.claudeAnalysis as any
    if (analysis?.aiProvider === 'openai') {
      return { name: 'OpenAI GPT', icon: Brain, color: 'text-green-600' }
    }
    return { name: 'Anthropic Claude', icon: Sparkles, color: 'text-purple-600' }
  }

  const handleFieldChange = () => {
    setIsEdited(true)
  }

  const handleWeekHoursChange = (resourceIndex: number, weekIndex: number, hours: number) => {
    const updated = [...resourceAllocations]
    updated[resourceIndex].hoursPerWeek[weekIndex] = hours
    setResourceAllocations(updated)
    recalculateTotals(updated)
    setIsEdited(true)
  }

  const handleProposalMarginChange = (margin: number) => {
    setProposalMargin(margin)
    recalculateTotals(resourceAllocations)
    setIsEdited(true)
  }

  const calculateWeeklyTotal = (weekIndex: number) => {
    return resourceAllocations.reduce((sum, alloc) => sum + (alloc.hoursPerWeek[weekIndex] || 0), 0)
  }

  const calculateResourceTotal = (resourceIndex: number) => {
    // Somar apenas as semanas válidas (até totalWeeks)
    return resourceAllocations[resourceIndex].hoursPerWeek
      .slice(0, totalWeeks)
      .reduce((sum: number, h: number) => sum + h, 0)
  }

  // Calcular valores individuais por profissional
  const calculateResourceValues = (resourceIndex: number) => {
    const alloc = resourceAllocations[resourceIndex]
    const totalHours = calculateResourceTotal(resourceIndex)
    const baseCost = totalHours * alloc.hourlyCost
    const taxAmount = baseCost * parameters.tax
    const costWithTax = baseCost + taxAmount
    const sgaAmount = costWithTax * parameters.sga
    const costWithSGA = costWithTax + sgaAmount

    // Usar margem da proposta
    const marginRate = proposalMargin / 100
    const marginAmount = costWithSGA / (1 - marginRate) - costWithSGA
    const finalPrice = costWithSGA + marginAmount

    return {
      totalHours,
      baseCost,
      taxAmount,
      sgaAmount,
      marginAmount,
      finalCost: costWithSGA,
      finalPrice,
    }
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

  console.log('🎨 RENDER - isEditMode:', isEditMode)
  console.log('🎨 RENDER - proposal.status:', proposal?.status)

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
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? 'Revisar Proposta [MODO EDIÇÃO]' : 'Proposta Aprovada [MODO VISUALIZAÇÃO]'}
              </h1>
              <p className="text-gray-600 mt-1">{proposal.projectName} - {proposal.clientName}</p>
              <div className="flex items-center gap-2 mt-2">
                <AIIcon className={`w-4 h-4 ${aiInfo.color}`} />
                <span className="text-sm text-gray-600">Gerado por {aiInfo.name}</span>
                {!isEditMode && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Aprovada
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {isEditMode ? (
                <>
                  {isEdited && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Salvar Alterações
                    </button>
                  )}
                  <button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || isEdited}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Aprovar & Gerar Excel
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Download Excel
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    <Save className="w-5 h-5" />
                    Editar Proposta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campos Editáveis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações da Proposta (Editável)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (meses)
              </label>
              <input
                type="number"
                min="1"
                value={durationMonths}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 1
                  setDurationMonths(newDuration)

                  // Ajustar hoursPerWeek de cada recurso
                  const newWeeks = newDuration * 4
                  const updated = resourceAllocations.map(alloc => {
                    const currentWeeks = alloc.hoursPerWeek.length
                    if (newWeeks > currentWeeks) {
                      // Adicionar semanas com 0 horas
                      return {
                        ...alloc,
                        hoursPerWeek: [...alloc.hoursPerWeek, ...Array(newWeeks - currentWeeks).fill(0)]
                      }
                    } else if (newWeeks < currentWeeks) {
                      // Remover semanas extras
                      return {
                        ...alloc,
                        hoursPerWeek: alloc.hoursPerWeek.slice(0, newWeeks)
                      }
                    }
                    return alloc
                  })
                  setResourceAllocations(updated)
                  recalculateTotals(updated)
                  handleFieldChange()
                }}
                disabled={!isEditMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">{durationMonths * 4} semanas</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo Total (Calculado Automaticamente)
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalCost)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Atualiza ao editar horas dos profissionais</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Final (Calculado Automaticamente)
              </label>
              <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPrice)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Atualiza ao editar horas dos profissionais</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Projeto
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                handleFieldChange()
              }}
              rows={4}
              disabled={!isEditMode}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Alocação Semanal de Recursos (Editável) */}
        {resourceAllocations.length > 0 && totalWeeks > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Alocação Semanal de Recursos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Edite as horas por semana para cada profissional ({totalWeeks} semanas = {durationMonths} meses)
                </p>
              </div>
              {isEditMode && (
                <button
                  onClick={() => setShowAddProfessionalModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Profissional
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r">
                      Profissional
                    </th>
                    {Array.from({ length: totalWeeks }, (_, i) => (
                      <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                        S{i + 1}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-blue-50">
                      Total Horas
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px] bg-blue-50">
                      Custo/Hora
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-yellow-50">
                      Imposto (21%)
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-yellow-50">
                      SG&A (10%)
                    </th>
                    <th className="px-3 py-3 text-center bg-yellow-50 min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Margem</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={proposalMargin}
                            onChange={(e) => handleProposalMarginChange(parseFloat(e.target.value) || 0)}
                            disabled={!isEditMode}
                            className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <span className="text-xs font-medium text-gray-700">%</span>
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px] bg-green-50">
                      Custo Total
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px] bg-green-50 sticky right-0 z-10 border-l">
                      Preço Final
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resourceAllocations.map((allocation, resourceIdx) => {
                    const values = calculateResourceValues(resourceIdx)
                    return (
                      <tr key={resourceIdx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white border-r z-10">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{allocation.professionalName}</div>
                              <div className="text-xs text-gray-500">{allocation.professionalRole}</div>
                            </div>
                            {isEditMode && (
                              <button
                                onClick={() => {
                                  if (confirm(`Remover ${allocation.professionalName} da proposta?`)) {
                                    const updated = resourceAllocations.filter((_, idx) => idx !== resourceIdx)
                                    setResourceAllocations(updated)
                                    recalculateTotals(updated)
                                    handleFieldChange()
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remover profissional"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        {allocation.hoursPerWeek.slice(0, totalWeeks).map((hours: number, weekIdx: number) => (
                          <td key={weekIdx} className="px-1 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={hours}
                              onChange={(e) => handleWeekHoursChange(resourceIdx, weekIdx, parseFloat(e.target.value) || 0)}
                              disabled={!isEditMode}
                              className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center font-semibold text-sm bg-blue-50">
                          {values.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-center text-sm bg-blue-50">
                          {formatCurrency(allocation.hourlyCost)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm bg-yellow-50">
                          {formatCurrency(values.taxAmount)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm bg-yellow-50">
                          {formatCurrency(values.sgaAmount)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm bg-yellow-50">
                          {formatCurrency(values.marginAmount)}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-sm bg-green-50">
                          {formatCurrency(values.finalCost)}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-sm bg-green-50 sticky right-0 z-10 border-l">
                          {formatCurrency(values.finalPrice)}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Linha de totais */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-gray-100 border-r z-10">
                      Total por Semana
                    </td>
                    {Array.from({ length: totalWeeks }, (_, weekIdx) => (
                      <td key={weekIdx} className="px-2 py-3 text-sm text-center text-gray-900">
                        {calculateWeeklyTotal(weekIdx).toFixed(1)}h
                      </td>
                    ))}
                    {(() => {
                      const totalHours = resourceAllocations.reduce((sum, _, idx) => sum + calculateResourceTotal(idx), 0)
                      const allValues = resourceAllocations.map((_, idx) => calculateResourceValues(idx))
                      const totalTax = allValues.reduce((sum, v) => sum + v.taxAmount, 0)
                      const totalSGA = allValues.reduce((sum, v) => sum + v.sgaAmount, 0)
                      const totalMargin = allValues.reduce((sum, v) => sum + v.marginAmount, 0)
                      const totalFinalCost = allValues.reduce((sum, v) => sum + v.finalCost, 0)
                      const totalFinalPrice = allValues.reduce((sum, v) => sum + v.finalPrice, 0)

                      return (
                        <>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-blue-50">
                            {totalHours.toFixed(1)}h
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-blue-50">
                            -
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-yellow-50">
                            {formatCurrency(totalTax)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-yellow-50">
                            {formatCurrency(totalSGA)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-yellow-50">
                            {formatCurrency(totalMargin)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-green-50">
                            {formatCurrency(totalFinalCost)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-gray-900 bg-green-50 sticky right-0 z-10 border-l">
                            {formatCurrency(totalFinalPrice)}
                          </td>
                        </>
                      )
                    })()}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grade de Cronograma */}
        {!isLoading && proposal && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Cronograma do Projeto</h2>

            {/* Gantt Chart Simplificado */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r min-w-[120px]">
                      Sprint
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                      Entregas
                    </th>
                    {Array.from({ length: totalWeeks }, (_, i) => (
                      <th key={i} className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                        S{i + 1}
                      </th>
                    ))}
                    {isEditMode && (
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduleData.sprints.map((sprint, sprintIdx) => (
                    <tr key={sprintIdx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                        Sprint {sprint.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={sprint.deliverables.join(', ')}
                            onChange={(e) => {
                              const newSprints = [...scheduleData.sprints]
                              newSprints[sprintIdx].deliverables = e.target.value.split(',').map(s => s.trim())
                              setScheduleData({ ...scheduleData, sprints: newSprints })
                              setIsEdited(true)
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Separar entregas por vírgula"
                          />
                        ) : (
                          <span>{sprint.deliverables.join(', ')}</span>
                        )}
                      </td>
                      {Array.from({ length: totalWeeks }, (_, weekIdx) => {
                        const isInSprint = weekIdx >= sprint.startWeek && weekIdx < sprint.startWeek + sprint.durationWeeks
                        return (
                          <td
                            key={weekIdx}
                            className={`px-1 py-3 text-center cursor-pointer border ${
                              isInSprint ? 'bg-blue-500' : 'bg-white hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              if (isEditMode) {
                                const newSprints = [...scheduleData.sprints]
                                // Toggle: se clicou em uma semana do sprint, ajustar
                                if (isInSprint) {
                                  // Reduzir duração
                                  newSprints[sprintIdx].durationWeeks = Math.max(1, newSprints[sprintIdx].durationWeeks - 1)
                                } else {
                                  // Expandir ou mover sprint
                                  if (weekIdx < sprint.startWeek) {
                                    newSprints[sprintIdx].startWeek = weekIdx
                                  } else {
                                    newSprints[sprintIdx].durationWeeks = weekIdx - sprint.startWeek + 1
                                  }
                                }
                                setScheduleData({ ...scheduleData, sprints: newSprints })
                                setIsEdited(true)
                              }
                            }}
                          >
                            {isInSprint && <div className="w-full h-4 bg-blue-500 rounded"></div>}
                          </td>
                        )
                      })}
                      {isEditMode && (
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => {
                              const newSprints = scheduleData.sprints.filter((_, idx) => idx !== sprintIdx)
                              setScheduleData({ ...scheduleData, sprints: newSprints })
                              setIsEdited(true)
                            }}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remover
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Adicionar Sprint */}
            {isEditMode && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    const newSprintNumber = scheduleData.sprints.length + 1
                    const newSprint = {
                      number: newSprintNumber,
                      deliverables: ['Nova entrega'],
                      startWeek: (newSprintNumber - 1) * 2,
                      durationWeeks: 2
                    }
                    setScheduleData({
                      ...scheduleData,
                      sprints: [...scheduleData.sprints, newSprint]
                    })
                    setIsEdited(true)
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Sprint
                </button>
              </div>
            )}

            {/* Milestones */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Marcos Principais</h3>
              <div className="space-y-3">
                {scheduleData.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data (ex: M3)</label>
                        <input
                          type="text"
                          value={milestone.date}
                          onChange={(e) => {
                            const newMilestones = [...scheduleData.milestones]
                            newMilestones[idx].date = e.target.value
                            // Recalcular weekIndex
                            const monthMatch = e.target.value.match(/M(\d+)/)
                            newMilestones[idx].weekIndex = monthMatch ? (parseInt(monthMatch[1]) - 1) * 4 : 0
                            setScheduleData({ ...scheduleData, milestones: newMilestones })
                            setIsEdited(true)
                          }}
                          disabled={!isEditMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => {
                            const newMilestones = [...scheduleData.milestones]
                            newMilestones[idx].name = e.target.value
                            setScheduleData({ ...scheduleData, milestones: newMilestones })
                            setIsEdited(true)
                          }}
                          disabled={!isEditMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    {isEditMode && (
                      <button
                        onClick={() => {
                          const newMilestones = scheduleData.milestones.filter((_, i) => i !== idx)
                          setScheduleData({ ...scheduleData, milestones: newMilestones })
                          setIsEdited(true)
                        }}
                        className="text-red-600 hover:text-red-900 text-sm px-3 py-2"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditMode && (
                <button
                  onClick={() => {
                    const newMilestone = {
                      name: 'Novo marco',
                      date: 'M1',
                      weekIndex: 0
                    }
                    setScheduleData({
                      ...scheduleData,
                      milestones: [...scheduleData.milestones, newMilestone]
                    })
                    setIsEdited(true)
                  }}
                  className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Marco
                </button>
              )}
            </div>

            {/* Buffer de Risco */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Buffer de Risco (%):</label>
              <input
                type="number"
                min="0"
                max="50"
                step="5"
                value={scheduleData.riskBuffer}
                onChange={(e) => {
                  setScheduleData({ ...scheduleData, riskBuffer: parseFloat(e.target.value) || 0 })
                  setIsEdited(true)
                }}
                disabled={!isEditMode}
                className="w-20 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-500">Tempo adicional para contingências</span>
            </div>
          </div>
        )}

        {/* Feedback da IA */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback sobre a Previsão da IA</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Qual a precisão da estimativa inicial? (Opcional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {rating === 0 && 'Clique nas estrelas para avaliar'}
              {rating === 1 && 'Muito impreciso'}
              {rating === 2 && 'Impreciso'}
              {rating === 3 && 'Razoável'}
              {rating === 4 && 'Preciso'}
              {rating === 5 && 'Muito preciso'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentários adicionais (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Descreva quais ajustes foram necessários e por quê..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </main>

      {/* Modal Adicionar Profissional */}
      {showAddProfessionalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Profissional</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Profissional
              </label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Selecione --</option>
                {professionals?.map((prof: any) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} - {prof.role} (R$ {prof.hourlyCost}/h)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddProfessionalModal(false)
                  setSelectedProfessionalId('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProfessional}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
