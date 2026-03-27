# SPEC.md — Especificação Técnica Completa do Sócio

> Documento de referência para desenvolvimento. Leia antes de implementar qualquer módulo.
> Versão 2.0 — Documento vivo, atualizado conforme o produto evolui.

---

## 1. Fluxo Principal — Como o sistema funciona

```
[Mariana manda mensagem no WhatsApp]
         ↓
[Evolution API captura e envia webhook pro n8n]
         ↓
[n8n recebe e chama OpenAI com contexto do usuário]
         ↓
[OpenAI identifica a intenção:]
   • Financeiro → salva transaction no Supabase
   • Agenda     → cria appointment + Google Calendar
   • Tarefa     → cria task no Supabase
   • Pergunta   → busca dados no Supabase e responde
   • Desconhecido → pede clareza educadamente
         ↓
[n8n executa a ação correta]
         ↓
[Supabase atualiza os dados]
         ↓
[n8n responde via Evolution API no WhatsApp]
         ↓
[Painel web reflete os dados automaticamente]
```

---

## 2. Identificação de Intenção (Prompt base OpenAI)

O prompt base que o n8n envia para a OpenAI deve sempre incluir:

```
Você é o Sócio, assistente de negócios da {nome_usuario}.

Perfil: {profile_type} | Meta mensal: R$ {monthly_goal} | Sonho: {dream}
Faturamento hoje: R$ {today_revenue} | Mês atual: R$ {month_revenue}
Próximo agendamento: {next_appointment}

Mensagem recebida: "{mensagem}"

Identifique a intenção e responda em JSON:
{
  "intent": "financial|appointment|task|query|motivation|unknown",
  "data": { ... campos extraídos conforme a intenção },
  "response": "resposta para enviar no WhatsApp (máx 3 linhas, tom de sócio próximo)",
  "action": "save_transaction|create_appointment|create_task|query_data|send_response"
}
```

---

## 3. Módulo Financeiro — Especificação Detalhada

### 3.1 Categorias automáticas

**Prestadora de Serviços:**
```
RECEITAS
  - servico_avulso (atendimento único)
  - pacote (série de atendimentos)
  - recorrencia (mensalidade de cliente)
  - produto_vendido

DESPESAS_OPERACIONAIS
  - insumos_materiais
  - aluguel_espaco
  - equipamentos
  - marketing
  - cursos_capacitacao
  - software_ferramentas
  - transporte
  - outras_operacionais

DESPESAS_PESSOAIS
  - prolabore (retirada formal)
  - pessoal_alimentacao
  - pessoal_saude
  - pessoal_lazer
  - pessoal_outros
```

**Freelancer Digital:**
```
RECEITAS
  - projeto_avulso
  - retainer_mensal (contrato fixo)
  - produto_digital
  - consultoria

DESPESAS_OPERACIONAIS
  - softwares_assinaturas
  - equipamentos_tech
  - cursos_especializacao
  - subcontratacao
  - marketing_pessoal
  - outras_operacionais

DESPESAS_PESSOAIS
  - prolabore
  - pessoal_outros
```

### 3.2 Cálculo dos Indicadores

```typescript
// Ticket Médio
ticketMedio = totalReceitas / totalAtendimentos

// Taxa de Retenção (mês atual)
taxaRetencao = (clientesQueVoltaram / totalClientesAtivosUltimoMes) * 100

// Custo por Atendimento
custoPorAtendimento = totalDespesasOperacionais / totalAtendimentos

// Margem Líquida
margemLiquida = ((totalReceitas - totalDespesas) / totalReceitas) * 100

// Ponto de Equilíbrio (atendimentos mínimos)
pontoEquilibrio = Math.ceil(totalDespesasFixas / ticketMedio)

// Índice de Inadimplência
indiceInadimplencia = (valorNaoRecebido / totalFaturado) * 100
```

### 3.3 Projeção de Faturamento

```typescript
// Faturamento projetado para o mês
diasRestantes = diasNoMes - diaAtual
mediaAtualPorDia = faturamentoAtual / diaAtual
projecaoMes = faturamentoAtual + (mediaAtualPorDia * diasRestantes)

// Ajuste sazonal (últimos 3 meses mesmo período)
fatorSazonal = mediaMesMesmosMeses3Ultimos / mediaGeralMensal
projecaoAjustada = projecaoMes * fatorSazonal
```

### 3.4 DRE Simplificado (estrutura)

```
DEMONSTRATIVO DE RESULTADO — {mês/ano}
─────────────────────────────────────

RECEITAS BRUTAS                    R$ X.XXX,XX
  (-) Impostos estimados           R$   XXX,XX
─────────────────────────────────────
RECEITA LÍQUIDA                    R$ X.XXX,XX

DESPESAS OPERACIONAIS              R$   XXX,XX
  Insumos e materiais              R$   XXX,XX
  Aluguel e espaço                 R$   XXX,XX
  Marketing                        R$   XXX,XX
  Outros                           R$   XXX,XX
─────────────────────────────────────
RESULTADO OPERACIONAL              R$ X.XXX,XX

(-) Pró-labore                     R$   XXX,XX
─────────────────────────────────────
RESULTADO LÍQUIDO                  R$ X.XXX,XX

MARGEM LÍQUIDA: XX%
TICKET MÉDIO: R$ XXX,XX
ATENDIMENTOS: XX
─────────────────────────────────────
```

---

## 4. Módulo Agenda — Especificação Detalhada

### 4.1 Fluxo de agendamento por voz

```
Input: "Marca a Ana pra sexta às 14h"
  ↓
OpenAI extrai: { client: "Ana", date: "próxima sexta", time: "14:00" }
  ↓
Sistema busca cliente "Ana" na carteira do usuário
  ↓
Se encontrado → usa dados existentes
Se não encontrado → cria novo cliente
  ↓
Cria appointment no Supabase
  ↓
Cria evento no Google Calendar (via Google Calendar API)
  ↓
Responde: "Agendado! Ana, sexta às 14h. Lembro você amanhã e 1h antes."
  ↓
[Opcional, plano superior] Manda confirmação pro WhatsApp da Ana
```

### 4.2 Link de autoagendamento

URL pública: `socio.app/{username}/agendar`

- Mostra os horários disponíveis do profissional
- Cliente escolhe horário, coloca nome e telefone
- Sistema cria appointment e manda confirmação pro dono
- [Plano superior] Manda confirmação pro cliente também

### 4.3 Status de agendamentos

```
confirmado | aguardando_confirmacao | cancelado | concluido | no_show
```

---

## 5. Módulo Tarefas — Matriz de Priorização

```typescript
type Quadrant = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither'

// Regras de classificação
const priorityRules = {
  urgent_important: {
    label: '🔴 Fazer agora',
    examples: ['cliente reclamando', 'prazo de hoje', 'pagamento vencendo'],
    action: 'Coloca no topo e avisa imediatamente'
  },
  important_not_urgent: {
    label: '🟡 Agendar',
    examples: ['melhorar portfólio', 'estudar nova técnica', 'planejar mês'],
    action: 'Agenda para o melhor dia disponível'
  },
  urgent_not_important: {
    label: '🟢 Delegar ou simplificar',
    examples: ['responder email genérico', 'tarefa administrativa simples'],
    action: 'Sugere simplificar ou faz em menos de 2 minutos'
  },
  neither: {
    label: '⚪ Questionar',
    examples: ['scroll em redes sociais', 'reunião sem pauta clara'],
    action: 'Pergunta: isso precisa ser feito hoje?'
  }
}
```

---

## 6. Módulo Radar (Atendimento) — Especificação

### Configurações do usuário
```typescript
{
  alertAfterMinutes: 30,        // Alerta após X min sem resposta (padrão: 30)
  vipClients: string[],         // Números de clientes VIP (alerta imediato)
  workingHours: {               // Só monitora dentro do horário de trabalho
    start: "08:00",
    end: "19:00"
  },
  autoSuggestReply: boolean     // Se true, gera sugestão de resposta
}
```

### Classificação de contatos
```typescript
type ContactType = 'new_lead' | 'recurring_client' | 'vip_client' | 'unknown'

// new_lead: primeiro contato (não está na carteira)
// recurring_client: está na carteira, atendido nos últimos 90 dias
// vip_client: marcado manualmente como VIP OU entre os top 3 por receita
// unknown: número não identificado
```

---

## 7. Bom Dia Sócio — Template de Mensagem

```
☀️ Bom dia, {nome}!

{mensagem_motivacional_personalizada}

💰 Ontem você faturou R$ {yesterday_revenue}
🎯 Meta do mês: {progress_bar} {percent}% (R$ {month_revenue} de R$ {monthly_goal})

📅 Hoje você tem {appointments_count} agendamento(s):
{appointments_list}

⚡ Prioridade de hoje: {top_task}

{alert_if_any}

Bora! 💪
```

A `mensagem_motivacional_personalizada` é gerada pela IA com base no contexto real:
- Mês forte → celebra e desafia a mais
- Mês fraco → encoraja e sugere ação concreta
- Bateu meta → celebra com o sonho dela ("Tá chegando perto da viagem!")
- Clientes inativos → menciona que vai verificar

---

## 8. Painel Web — Páginas

```
/            → Dashboard (métricas do dia e do mês)
/financeiro  → DRE, fluxo de caixa, indicadores
/agenda      → calendário + lista de agendamentos
/clientes    → carteira de clientes
/tarefas     → lista de tarefas por prioridade
/metas       → termômetro de metas e sonho
/relatorios  → DRE mensal, exportações
/configuracoes → perfil, horários, planos, integrações
```

---

## 9. Segurança — Checklist antes de cada deploy

- [ ] RLS ativo em todas as tabelas novas
- [ ] Nenhuma Service Key exposta no frontend
- [ ] Todas as variáveis de ambiente em `.env` (nunca commitadas)
- [ ] Inputs do WhatsApp sanitizados antes de processar
- [ ] Log de erro sem dados sensíveis do usuário
- [ ] Backup do Supabase verificado

---

## 10. Roadmap de Construção

### MVP — Mês 1 (validar com 3 clientes beta)
- [x] Configuração do projeto (Next.js, Supabase, n8n, Evolution API)
- [x] Schema do banco com RLS
- [x] Webhook do WhatsApp funcionando
- [x] Identificação de intenção financeira pela IA
- [x] Salvar transactions no Supabase
- [x] Resposta automática de confirmação
- [ ] Briefing diário básico (Bom Dia Sócio)
- [x] Dashboard web básico (caixa do dia)

### Fase 2 — Mês 2 (lançamento oficial)
- [ ] Módulo Agenda completo + Google Calendar
- [ ] Carteira de clientes
- [ ] Módulo Metas
- [ ] Módulo Tarefas com priorização

### Fase 3 — Mês 3 (escala)
- [ ] Painel web completo
- [ ] DRE automático + exportação
- [ ] Separação PJ/PF
- [ ] IA consultiva (alertas proativos)

### Fase 4 — Mês 4+ (expansão)
- [ ] Módulo Radar (atendimento)
- [ ] Autoagendamento público
- [ ] Cobrança automática gentil
- [ ] Diretório de profissionais
