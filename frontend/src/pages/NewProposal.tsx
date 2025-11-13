import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { aiService, proposalService, professionalService } from '../services/api'
import { Upload, FileText, X, Loader2, ArrowLeft, Sparkles, Brain, Users, ChevronRight, ChevronLeft, Plus } from 'lucide-react'
import { handleError, handleSuccess } from '../utils/errorHandler'
import type { Professional } from '../types'

export default function NewProposal() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAI, setSelectedAI] = useState<'claude' | 'openai'>('claude')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressSteps, setProgressSteps] = useState<string[]>([])

  const { data: providers } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiService.getProviders,
  })

  const { data: professionalsData } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => professionalService.list(),
  })

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      setShowProgressModal(true)
      setProgressSteps(['📤 Enviando documentos...'])

      setTimeout(() => setProgressSteps(prev => [...prev, '🤖 Analisando escopo do projeto...']), 500)
      setTimeout(() => setProgressSteps(prev => [...prev, '👥 Estimando equipe necessária...']), 2000)
      setTimeout(() => setProgressSteps(prev => [...prev, '📅 Gerando cronograma...']), 4000)
      setTimeout(() => setProgressSteps(prev => [...prev, '💰 Calculando custos...']), 6000)
      setTimeout(() => setProgressSteps(prev => [...prev, '💾 Salvando proposta...']), 8000)

      return await proposalService.generate(data)
    },
    onSuccess: (data) => {
      setProgressSteps(prev => [...prev, '✅ Proposta gerada com sucesso!'])
      setTimeout(() => {
        setShowProgressModal(false)
        handleSuccess('Proposta gerada com sucesso! Revise antes de aprovar.')
        navigate(`/proposals/${data.id}`)
      }, 1000)
    },
    onError: (error) => {
      setShowProgressModal(false)
      setProgressSteps([])
      handleError(error)
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles])
    },
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!clientName || !projectName || files.length === 0) {
        handleError(new Error('Preencha todos os campos obrigatórios e adicione pelo menos um arquivo'))
        return
      }
      setCurrentStep(2)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(1)
  }

  const toggleProfessional = (professionalId: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProfessionals.length === 0) {
      handleError(new Error('Selecione pelo menos um profissional'))
      return
    }

    generateMutation.mutate({
      clientName,
      projectName,
      description,
      aiProvider: selectedAI,
      aiModel: selectedModel || undefined,
      files,
      selectedProfessionals,
    })
  }

  const isLoading = generateMutation.isPending
  const professionals = professionalsData?.professionals || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nova Proposta</h1>
          <p className="text-gray-600 mt-1">Faça upload dos documentos e selecione a equipe</p>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Documentos</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Equipe</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-8">
          {/* STEP 1: Informações Básicas + Arquivos + IA */}
          {currentStep === 1 && (
            <>
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações do Projeto</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Acme Corporation"
                  required
                />
              </div>

              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Sistema de E-commerce"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Contexto Adicional (Opcional)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Adicione informações extras que a IA deve considerar na análise, como restrições técnicas,
                  prazos específicos, tecnologias obrigatórias, preferências do cliente, etc.
                </p>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Cliente prefere usar React e Node.js. Prazo máximo de 6 meses. Deve integrar com sistema SAP existente. Orçamento limitado a R$ 200.000..."
                />
              </div>
            </div>
          </div>

          {/* Seletor de IA */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecione a Inteligência Artificial</h2>
            <p className="text-sm text-gray-600 mb-6">Escolha qual IA irá analisar os documentos e gerar a proposta</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers?.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    setSelectedAI(provider.id)
                    setSelectedModel(provider.model) // Define modelo padrão ao selecionar provider
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedAI === provider.id
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      selectedAI === provider.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {provider.id === 'claude' ? (
                        <Sparkles className={`w-6 h-6 ${selectedAI === provider.id ? 'text-blue-600' : 'text-gray-600'}`} />
                      ) : (
                        <Brain className={`w-6 h-6 ${selectedAI === provider.id ? 'text-blue-600' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        {selectedAI === provider.id && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Selecionado</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Seletor de Modelo */}
            {selectedAI && providers?.find(p => p.id === selectedAI)?.models && (
              <div className="mt-6">
                <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Modelo
                </label>
                <select
                  id="aiModel"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {providers?.find(p => p.id === selectedAI)?.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Upload de Arquivos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Documentos *</h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-700 mb-2">
                {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-500">PDF, Word (DOC/DOCX), Excel (XLS/XLSX), Imagens ou TXT (máx. 10MB)</p>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Arquivos selecionados ({files.length})
                </h3>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões Step 1 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              Próximo: Selecionar Equipe
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          </>
          )}

          {/* STEP 2: Seleção de Profissionais */}
          {currentStep === 2 && (
            <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Selecione os Profissionais</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Escolha os profissionais que participarão do projeto. A IA distribuirá as horas entre eles.
                </p>
              </div>
            </div>

            {professionals.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum profissional cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Você precisa cadastrar profissionais antes de criar uma proposta
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/professionals')}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Cadastrar Profissionais
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map((professional) => (
                <button
                  key={professional.id}
                  type="button"
                  onClick={() => toggleProfessional(professional.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedProfessionals.includes(professional.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                        {selectedProfessionals.includes(professional.id) && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{professional.role} • {professional.seniority}</p>
                      <p className="text-sm font-medium text-blue-600 mb-2">
                        R$ {professional.hourlyCost.toFixed(2)}/hora
                      </p>
                      {professional.skills && professional.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {professional.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {professional.skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                              +{professional.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                ))}
              </div>
            )}

            {selectedProfessionals.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      {selectedProfessionals.length} profissional(is) selecionado(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfessionals.map((profId) => {
                        const prof = professionals.find(p => p.id === profId);
                        return prof ? (
                          <span
                            key={profId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-900 text-xs font-medium rounded-full border border-blue-200"
                          >
                            {prof.name} ({prof.role})
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  A IA irá distribuir as horas e calcular os custos automaticamente com base nos profissionais selecionados
                </p>
              </div>
            )}
          </div>

          {/* Botões Step 2 */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedProfessionals.length === 0}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Proposta...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Proposta
                </>
              )}
            </button>
          </div>
          </>
          )}

          {/* Status de Processamento */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Processando sua proposta...</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Analisando documentos com {providers?.find(p => p.id === selectedAI)?.name || 'IA'}...</li>
                    <li>• Extraindo escopo e complexidade...</li>
                    <li>• Estimando equipe e alocação...</li>
                    <li>• Gerando cronograma...</li>
                    <li>• Calculando custos e preços...</li>
                    <li>• Criando planilha Excel...</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-3">Isso pode levar alguns minutos, por favor aguarde...</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Modal de Progresso */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Gerando Proposta</h2>
              <p className="text-gray-600 mt-2">A IA está analisando seus documentos...</p>
            </div>

            <div className="space-y-3">
              {progressSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    step.includes('✅') ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {step.includes('✅') ? (
                      <span className="text-sm">✓</span>
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                  <p className={`text-sm ${
                    step.includes('✅') ? 'text-green-700 font-medium' : 'text-gray-700'
                  }`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              Este processo pode levar alguns minutos
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
