# Feature: Suporte a Múltiplas IAs

**Data de Implementação**: 2025-11-08
**Status**: ✅ Completa e Testada

## Visão Geral

O sistema agora suporta múltiplos provedores de IA para análise de documentos e geração de propostas. O usuário pode escolher entre **Claude (Anthropic)** ou **ChatGPT (OpenAI)** ao gerar uma proposta.

## Provedores Disponíveis

### 1. Claude (Anthropic) - **PADRÃO**
- **Modelo**: claude-3-5-sonnet-20241022
- **Vantagens**:
  - Excelente para análise de documentos complexos
  - Suporte nativo para PDFs, imagens e documentos
  - Análise de contexto longo
  - Resposta JSON estruturada

### 2. OpenAI GPT
- **Modelo**: gpt-4-turbo-preview
- **Vantagens**:
  - Alta capacidade analítica
  - Suporte para imagens (Vision)
  - Resposta JSON estruturada
  - Modelo amplamente testado

## Arquitetura Implementada

### Arquivos Criados

1. **`backend/src/services/OpenAIService.ts`**
   - Serviço de integração com OpenAI GPT
   - 3 métodos especializados (análise de escopo, estimativa de equipe, cronograma)
   - Método orquestrador `analyzeComplete()`

2. **`backend/src/services/AIServiceFactory.ts`**
   - Factory Pattern para gerenciar múltiplos provedores
   - Interface comum `IAIService`
   - Singleton para cada provedor
   - Validação de provedores
   - Informações sobre cada provedor

### Arquivos Modificados

1. **`backend/src/services/ProposalService.ts`**
   - Aceita parâmetro `aiProvider` opcional
   - Usa `AIServiceFactory` para obter o serviço correto
   - Salva informações da IA usada no banco

2. **`backend/src/controllers/ProposalController.ts`**
   - Validação do parâmetro `aiProvider`
   - Novo endpoint: `GET /api/proposals/ai-providers`
   - Retorna `aiProvider` na resposta da geração

3. **`backend/src/routes/proposals.ts`**
   - Nova rota para listar provedores disponíveis

4. **`backend/.env`**
   - Adicionada variável `OPENAI_API_KEY`

5. **`backend/package.json`**
   - Dependência `openai` instalada

## Como Usar

### 1. Configurar API Keys

Edite o arquivo `backend/.env`:

```env
# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

**Importante**:
- Claude: https://console.anthropic.com/
- OpenAI: https://platform.openai.com/api-keys

### 2. Listar Provedores Disponíveis

```bash
GET http://localhost:3001/api/proposals/ai-providers
```

**Resposta**:
```json
{
  "status": "success",
  "data": {
    "providers": [
      {
        "id": "claude",
        "name": "Anthropic Claude",
        "model": "claude-3-5-sonnet-20241022",
        "description": "Claude 3.5 Sonnet - Excelente para análise de documentos complexos"
      },
      {
        "id": "openai",
        "name": "OpenAI GPT",
        "model": "gpt-4-turbo-preview",
        "description": "GPT-4 Turbo - Modelo avançado da OpenAI com alta capacidade analítica"
      }
    ],
    "default": "claude"
  }
}
```

### 3. Gerar Proposta com Claude (Padrão)

```bash
POST http://localhost:3001/api/proposals/generate
Content-Type: multipart/form-data

{
  "clientName": "Empresa XYZ",
  "projectName": "Sistema de Gestão",
  "description": "Sistema completo de gestão empresarial",
  "files": [arquivo1.pdf, arquivo2.png]
  # aiProvider não especificado = usa Claude (padrão)
}
```

### 4. Gerar Proposta com OpenAI

```bash
POST http://localhost:3001/api/proposals/generate
Content-Type: multipart/form-data

{
  "clientName": "Empresa XYZ",
  "projectName": "Sistema de Gestão",
  "description": "Sistema completo de gestão empresarial",
  "aiProvider": "openai",  # ← Especifica OpenAI
  "files": [arquivo1.pdf, arquivo2.png]
}
```

### 5. Resposta da Geração

```json
{
  "status": "success",
  "message": "Proposta gerada com sucesso",
  "data": {
    "id": "uuid-da-proposta",
    "clientName": "Empresa XYZ",
    "projectName": "Sistema de Gestão",
    "totalCost": 150000.50,
    "totalPrice": 200000.67,
    "duration": 10,
    "complexity": "high",
    "aiProvider": "openai",  # ← IA usada
    "excelDownloadUrl": "/api/proposals/uuid-da-proposta/download",
    "createdAt": "2025-11-08T16:30:00.000Z"
  }
}
```

## Validações Implementadas

1. **Provedor Inválido**: Se `aiProvider` não for 'claude' ou 'openai', retorna erro 400
2. **API Key Ausente**: Se a API key não estiver configurada, o serviço lança erro
3. **Retry Logic**: Ambos os serviços têm retry (3 tentativas) em caso de falha temporária

## Exemplo de Uso com cURL

### Listar Provedores

```bash
curl http://localhost:3001/api/proposals/ai-providers
```

### Gerar com Claude (padrão)

```bash
curl -X POST http://localhost:3001/api/proposals/generate \
  -F "clientName=Acme Corp" \
  -F "projectName=E-commerce Platform" \
  -F "description=Sistema de e-commerce completo" \
  -F "files=@documento.pdf"
```

### Gerar com OpenAI

```bash
curl -X POST http://localhost:3001/api/proposals/generate \
  -F "clientName=Acme Corp" \
  -F "projectName=E-commerce Platform" \
  -F "description=Sistema de e-commerce completo" \
  -F "aiProvider=openai" \
  -F "files=@documento.pdf"
```

## Estrutura de Dados Salva

Quando uma proposta é gerada, o campo `claudeAnalysis` (JSONB) agora inclui:

```json
{
  "analysis": { ... },
  "teamEstimation": { ... },
  "schedule": { ... },
  "aiProvider": "claude",  # ← Qual IA foi usada
  "providerInfo": {
    "name": "Anthropic Claude",
    "model": "claude-3-5-sonnet-20241022",
    "description": "..."
  }
}
```

## Comparação de Recursos

| Recurso | Claude | OpenAI |
|---------|--------|--------|
| Análise de PDF direto | ✅ Sim | ❌ Não (requer extração) |
| Análise de Imagens | ✅ Sim | ✅ Sim (Vision) |
| Contexto Longo | ✅ 200k tokens | ⚠️ 128k tokens |
| JSON Mode | ✅ Sim | ✅ Sim |
| Custo | $$ Moderado | $$ Moderado |
| Velocidade | ⚡ Rápido | ⚡ Rápido |

## Próximas Melhorias

1. [ ] Adicionar Google Gemini como terceira opção
2. [ ] Adicionar métricas de uso (tempo, tokens, custo)
3. [ ] Permitir escolher modelo específico (ex: gpt-4, gpt-4o, claude-opus)
4. [ ] Cache de respostas para documentos idênticos
5. [ ] Comparação lado a lado (gerar com ambas as IAs)

## Logs de Exemplo

```
2025-11-08 16:16:21 [info]: 🎯 Gerando proposta para cliente: Acme Corp usando OPENAI
2025-11-08 16:16:21 [info]: 🤖 Inicializando serviço de IA: OPENAI
2025-11-08 16:16:21 [info]: ✅ OpenAI Service inicializado
2025-11-08 16:16:21 [info]: 📄 Analisando documentos com OpenAI GPT (gpt-4-turbo-preview)...
2025-11-08 16:16:23 [info]: 🔍 Iniciando análise de escopo com OpenAI...
2025-11-08 16:16:25 [info]: 📡 Chamando OpenAI API (tentativa 1/3)
2025-11-08 16:16:28 [info]: ✅ Resposta recebida da OpenAI
2025-11-08 16:16:28 [info]: ✅ Análise concluída - Complexidade: high
```

## Testes Realizados

- ✅ Endpoint `/api/proposals/ai-providers` retorna lista de provedores
- ✅ Geração com Claude (padrão) funciona
- ✅ Geração com OpenAI funciona (instalação da dependência)
- ✅ Validação de provedor inválido funciona
- ✅ Resposta inclui `aiProvider` usado
- ✅ Dados salvos no banco incluem informações da IA

## Observações Técnicas

1. **Singleton Pattern**: Cada provedor é instanciado apenas uma vez
2. **Interface Comum**: `IAIService` garante compatibilidade
3. **Factory Pattern**: `AIServiceFactory` centraliza criação de instâncias
4. **Extensibilidade**: Fácil adicionar novos provedores
5. **Backward Compatible**: Se `aiProvider` não for especificado, usa Claude (padrão)

---

**Conclusão**: A feature está completa e pronta para uso. O sistema agora oferece flexibilidade para escolher entre diferentes modelos de IA, mantendo a mesma qualidade de análise e geração de propostas.
