# PLAN.md — Plano de Desenvolvimento do Sócio
## Documento para Plan Mode do Claude Code

> Este arquivo deve ser lido pelo Claude Code antes de qualquer implementação.
> Execute: `claude --plan` ou inicie uma sessão e diga "entre em plan mode e leia o PLAN.md"

---

## 1. VISÃO GERAL DO SISTEMA

O Sócio é um **sistema de gestão inteligente para autônomos** que opera via WhatsApp como interface principal, com painel web como interface secundária.

O usuário fala ou escreve no WhatsApp → o sistema entende a intenção → executa a ação → responde de forma conversacional.

Não é um chatbot. É um CFO + gerente comercial + assistente de agenda que vive no app que o autônomo já usa todos os dias.

---

## 2. TECNOLOGIAS DEFINIDAS

### 2.1 Stack Completa

```
CAMADA DE COMUNICAÇÃO
└── Evolution API v2
    Protocolo: WebSocket + REST
    Função: Transformar WhatsApp em API bidirecional

CAMADA DE AUTOMAÇÃO
└── n8n (self-hosted via Docker)
    Versão: latest stable
    Função: Orquestrador central — recebe webhooks, chama IA, salva dados, envia respostas

CAMADA DE INTELIGÊNCIA ARTIFICIAL
└── OpenAI API
    Modelos:
      - gpt-4o-mini → identificação de intenção (rápido, barato)
      - gpt-4o       → análise consultiva e briefing diário (mais profundo)
      - whisper-1    → transcrição de áudios do WhatsApp
    Função: Entender linguagem natural, classificar intenções, gerar respostas humanizadas

CAMADA DE DADOS
└── Supabase (PostgreSQL 15)
    Função: Banco de dados principal com Row Level Security nativo
    Extras: Auth, Storage (para documentos/NF), Realtime (painel web ao vivo)

CAMADA DE AGENDA
└── Google Calendar API v3
    Função: Sincronização bidirecional de agendamentos

CAMADA DE PAGAMENTOS
└── Stripe
    Função: Cobrança recorrente das mensalidades dos planos

CAMADA DE PAINEL WEB
└── Next.js 14 (App Router)
└── TypeScript (strict mode)
└── Tailwind CSS
└── Shadcn/UI (componentes)
└── Recharts (gráficos)
└── Zustand (estado global)
└── React Query (cache e sync com Supabase)

CAMADA DE INFRAESTRUTURA
└── Vercel → deploy do painel web (Next.js)
└── Railway ou Render → n8n + Evolution API (Docker)
└── Supabase Cloud → banco de dados
```

---

## 3. POR QUE CADA TECNOLOGIA FOI ESCOLHIDA

### Evolution API — por que não Z-API ou Baileys direto?

**Z-API** é uma opção, mas cobra por instância e tem limitações de customização. A **Evolution API** é open source, roda no seu servidor, custo fixo, e tem suporte ativo da comunidade brasileira. Para um produto que vai escalar para 100+ clientes cada um com sua instância, a diferença de custo é enorme.

**Baileys direto** daria mais controle, mas exigiria manter a biblioteca atualizada manualmente toda vez que o WhatsApp muda o protocolo. A Evolution API já cuida disso.

**Decisão:** Evolution API até 50 clientes. Migrar para API Oficial Meta acima de 50 para eliminar risco de banimento.

---

### n8n — por que não código puro (Node.js/Express)?

O Luiz não é desenvolvedor full-time. O n8n permite:
- Visualizar o fluxo completo sem ler código
- Modificar comportamentos sem deploy
- Adicionar integrações novas em minutos
- Testar fluxos isoladamente
- Time não técnico consegue entender o que está acontecendo

**Para o estágio atual do produto**, n8n é a escolha correta. Quando o produto tiver 500+ usuários e precisar de performance extrema, aí faz sentido migrar partes críticas para código puro. Hoje não.

**Self-hosted via Docker** porque o n8n Cloud tem limite de execuções e fica caro com escala. No Railway ou Render você paga pelo servidor e tem execuções ilimitadas.

---

### OpenAI API — por que não Claude API, Gemini ou Llama?

**Claude API (Anthropic)** seria excelente em qualidade, mas os modelos são mais lentos para tarefas simples de classificação e o custo por token é maior para o volume que o produto vai gerar. Para o Bom Dia Sócio e análise consultiva, Claude seria ótimo — mas para classificar 50 mensagens por dia de cada usuário, gpt-4o-mini é mais eficiente.

**Gemini** tem boa performance mas a API ainda tem inconsistências de comportamento em português.

**Llama (self-hosted)** exigiria GPU própria — custo proibitivo para este estágio.

**Decisão:** gpt-4o-mini para tarefas rápidas (classificação, confirmações), gpt-4o para tarefas analíticas (DRE consultivo, briefing). Revisar após 6 meses — o mercado de modelos muda rápido.

---

### Supabase — por que não Firebase, PlanetScale ou MongoDB?

**Firebase** é fácil mas o modelo de preço escala mal com muitas leituras/escritas pequenas (exatamente o padrão do Sócio — muitas mensagens curtas). Além disso, NoSQL dificulta relatórios financeiros que precisam de JOINs.

**PlanetScale** é ótimo mas não tem Row Level Security nativo — você teria que implementar a segurança multi-tenant manualmente.

**MongoDB** tem o mesmo problema do Firebase: sem RLS nativo e queries financeiras complexas ficam verbosas.

**Supabase** tem:
- PostgreSQL real (SQL completo para relatórios financeiros)
- RLS nativo (segurança multi-tenant sem esforço)
- Auth integrado (não precisa de serviço separado)
- Storage integrado (para notas fiscais e documentos)
- Realtime integrado (painel web atualiza sem polling)
- SDK TypeScript excelente
- Plano gratuito generoso para começar

**É a escolha certa para este produto.**

---

### Next.js 14 — por que não React puro, Vue ou Nuxt?

**React puro (Vite/CRA)** exigiria configurar SSR, routing e otimizações manualmente. Next.js já traz tudo isso pronto.

**Vue/Nuxt** — boa opção, mas o ecossistema de componentes (Shadcn, Radix) e a comunidade de tutoriais são maiores no React/Next para este tipo de painel administrativo.

**Next.js 14 com App Router** foi escolhido porque:
- Server Components reduzem JavaScript no cliente
- API Routes permitem criar endpoints sem servidor separado
- Integração com Supabase é bem documentada
- Deploy no Vercel é trivial (zero config)

---

## 4. FUNCIONALIDADES DO SISTEMA

### 4.1 Fluxo Central (obrigatório no MVP)

```
F01 - Receber mensagem via WhatsApp (texto ou áudio)
F02 - Transcrever áudio para texto (Whisper)
F03 - Identificar intenção da mensagem (OpenAI)
F04 - Executar ação correspondente à intenção
F05 - Responder no WhatsApp com confirmação
F06 - Salvar tudo no Supabase com RLS
```

### 4.2 Módulo Financeiro

```
F10 - Registrar receita por voz/texto
F11 - Registrar despesa por voz/texto
F12 - Categorizar lançamento automaticamente por perfil do usuário
F13 - Separar lançamentos empresa (PJ) vs pessoal (PF)
F14 - Calcular caixa do dia em tempo real
F15 - Gerar DRE mensal automático
F16 - Calcular 6 indicadores: ticket médio, retenção, custo/atendimento,
       margem líquida, ponto de equilíbrio, inadimplência
F17 - Projetar faturamento 30/60/90 dias com fator sazonal
F18 - Gerar alertas proativos de saúde financeira
F19 - Sugerir decisões financeiras baseadas nos dados
F20 - Sugerir pró-labore ideal com base no caixa disponível
F21 - Exportar DRE e Livro Caixa em PDF e CSV
```

### 4.3 Módulo Agenda

```
F30 - Criar agendamento por voz ("Marca a Ana pra sexta às 14h")
F31 - Sincronizar com Google Calendar
F32 - Gerar link público de autoagendamento
F33 - Enviar confirmação automática para o cliente (plano superior)
F34 - Registrar cancelamento com justificativa
F35 - Enviar lembrete automático 24h antes para o dono
F36 - Controlar status: confirmado, cancelado, concluído, no_show
```

### 4.4 Módulo Metas

```
F40 - Registrar sonho do usuário na entrada (a viagem, a casa, o carro)
F41 - Definir meta mensal de faturamento
F42 - Calcular progresso diário da meta
F43 - Projetar data de chegada ao sonho no ritmo atual
F44 - Celebrar automaticamente quando meta é atingida
```

### 4.5 Bom Dia Sócio

```
F50 - Enviar briefing diário às 7h para todos os usuários ativos
F51 - Incluir: faturamento ontem, progresso da meta, agenda do dia, prioridade
F52 - Gerar mensagem motivacional personalizada baseada no contexto real
F53 - Alertar sobre contas a vencer e clientes inativos
```

### 4.6 Módulo Tarefas

```
F60 - Registrar tarefa por voz/texto
F61 - Classificar tarefa na Matriz de Eisenhower automaticamente
F62 - Gerar lista de no máximo 3 prioridades do dia
F63 - Check-in diário à tarde: "concluiu as prioridades?"
F64 - Histórico de tarefas com contexto
```

### 4.7 Módulo Radar (Atendimento)

```
F70 - Monitorar conversas WhatsApp sem resposta
F71 - Alertar dono após X minutos configurável (padrão: 30min)
F72 - Classificar contato: novo lead / recorrente / VIP
F73 - Gerar sugestão de resposta para aprovação do dono
F74 - Relatório semanal de tempo médio de resposta
```

### 4.8 Carteira de Clientes

```
F80 - Criar cliente automaticamente quando mencionado pela primeira vez
F81 - Registrar histórico de atendimentos por cliente
F82 - Calcular LTV (lifetime value) por cliente
F83 - Alertar clientes inativos há X dias
F84 - Reativação com aprovação do dono
```

### 4.9 Painel Web

```
F90 - Dashboard: métricas do dia e do mês
F91 - Página financeiro: DRE, fluxo de caixa, indicadores com gráficos
F92 - Página agenda: calendário + lista
F93 - Página clientes: carteira com histórico
F94 - Página tarefas: lista priorizada
F95 - Página metas: termômetro visual
F96 - Página relatórios: exportações
F97 - Página configurações: perfil, horários, planos, integrações
```

### 4.10 Segurança e Infraestrutura

```
F100 - Row Level Security em todas as tabelas (user_id em toda query)
F101 - Autenticação via Supabase Auth (magic link ou Google OAuth)
F102 - Todas as API Keys em variáveis de ambiente
F103 - Log de todas as chamadas de IA com custo estimado
F104 - Backup automático diário do Supabase
F105 - Monitoramento de erros no n8n
```

---

## 5. REGRAS DE NEGÓCIO

### RN-01 Isolamento de dados (CRÍTICA — nunca violar)
Cada usuário só acessa seus próprios dados. Nenhuma query pode retornar dados de outro usuário. RLS ativo em 100% das tabelas. Violação desta regra é falha crítica de segurança.

### RN-02 Identificação de usuário via telefone
O usuário é identificado pelo número de telefone do WhatsApp. Um número = uma conta. Não há login por email no WhatsApp — a autenticação do painel web usa Supabase Auth separadamente mas vinculado ao mesmo user_id.

### RN-03 Intenção desconhecida
Se a OpenAI não identificar a intenção com confiança acima de 70%, o sistema deve pedir clareza educadamente. Nunca assumir intenção errada e salvar dado incorreto. Exemplo: "Não entendi bem. Você quis registrar uma receita ou uma despesa?"

### RN-04 Áudio obrigatoriamente transcrito antes de processar
Toda mensagem de áudio deve ser transcrita via Whisper antes de ser enviada para identificação de intenção. Nunca enviar áudio diretamente para a OpenAI de classificação.

### RN-05 Lançamento financeiro sempre com data de competência
A data de competência (quando o serviço foi prestado) é diferente da data de pagamento. O sistema sempre registra ambas. Para o DRE, usa data de competência. Para fluxo de caixa, usa data de pagamento.

### RN-06 Pró-labore não é despesa operacional
Pró-labore é retirada do sócio — vai para a categoria `despesas_pessoais.prolabore` e é apresentado separado no DRE. Nunca categorizar como despesa operacional.

### RN-07 Projeção financeira requer mínimo de dados
A projeção de faturamento só é gerada quando o usuário tem pelo menos 7 dias de histórico no mês atual. Antes disso, exibir apenas o acumulado sem projeção.

### RN-08 Agendamento no passado
O sistema não cria agendamentos para datas/horários no passado. Se o usuário tentar, perguntar se quer registrar como atendimento já realizado (lançamento financeiro) ou confirmar que a data está certa.

### RN-09 Cliente duplicado
Antes de criar um novo cliente, o sistema verifica se já existe um cliente com nome similar (distância de Levenshtein ≤ 2) ou mesmo telefone. Se encontrar, pergunta ao dono se é o mesmo cliente.

### RN-10 Limite de mensagens motivacionais repetidas
O sistema nunca envia a mesma mensagem motivacional nos últimos 30 dias. Manter histórico das últimas 30 mensagens enviadas por usuário para evitar repetição.

### RN-11 Horário de atendimento do Radar
O Radar de Atendimento só monitora conversas dentro do horário de trabalho configurado pelo usuário (padrão: 08h às 19h). Fora desse horário, não gera alertas de resposta pendente.

### RN-12 Exportação de dados pessoais (LGPD)
Qualquer usuário pode solicitar a exportação de todos os seus dados em formato JSON. O sistema deve gerar e entregar em até 72h. Também deve permitir a exclusão completa da conta e todos os dados associados.

### RN-13 Planos e funcionalidades

```
ESSENCIAL (R$ 147/mês)
└── F01-F06 (fluxo central)
└── F10-F15 (financeiro básico)
└── F30-F31, F35-F36 (agenda básica)
└── F40-F43 (metas)
└── F50-F53 (bom dia sócio)
└── F60-F64 (tarefas)
└── F80-F83 (carteira básica)

PROFISSIONAL (R$ 247/mês)
└── Tudo do Essencial
└── F16-F20 (indicadores e IA consultiva)
└── F32-F34 (autoagendamento e confirmação cliente)
└── F90-F97 (painel web completo)
└── F84 (reativação de inativos)

ACELERADOR (R$ 397/mês)
└── Tudo do Profissional
└── F21 (exportação DRE para contador)
└── F70-F74 (módulo radar)
└── F17, F19 (projeção e sugestões avançadas)
└── Suporte prioritário
```

### RN-14 Custo por usuário
O custo de infraestrutura por usuário ativo não pode exceder R$ 25/mês (para manter margem saudável no plano Essencial). Monitorar uso de tokens da OpenAI por usuário mensalmente.

### RN-15 Graceful degradation
Se a OpenAI API estiver fora do ar, o sistema deve:
1. Confirmar recebimento da mensagem para o usuário
2. Colocar na fila de reprocessamento (Supabase queue)
3. Processar quando a API voltar
4. Nunca deixar mensagem sem resposta por mais de 10 minutos sem aviso

---

## 6. ORDEM DE IMPLEMENTAÇÃO (Plan Mode)

O Claude Code deve seguir esta ordem. Não pular etapas.

```
FASE 0 — Fundação (fazer antes de tudo)
└── [x] Estrutura de pastas do projeto
└── [x] Configuração TypeScript strict
└── [x] Schema do banco com RLS (Supabase)
└── [x] Variáveis de ambiente (.env.example)
└── [x] CI básico (typecheck + lint no push)

FASE 1 — MVP Core
└── [x] Webhook Evolution API recebendo mensagens
└── [x] Transcrição de áudio (Whisper)
└── [x] Identificação de intenção (gpt-4o-mini)
└── [x] Handler financeiro (salvar transaction)
└── [x] Resposta no WhatsApp
└── [x] Dashboard web básico

FASE 2 — Módulos Principais
└── [ ] Módulo Agenda + Google Calendar
└── [ ] Módulo Metas
└── [ ] Módulo Tarefas
└── [ ] Bom Dia Sócio (cron diário)
└── [ ] Carteira de clientes

FASE 3 — IA Consultiva
└── [ ] 6 indicadores financeiros
└── [ ] DRE automático
└── [ ] Alertas proativos
└── [ ] Projeção de faturamento
└── [ ] Separação PJ/PF

FASE 4 — Expansão
└── [ ] Módulo Radar
└── [ ] Autoagendamento público
└── [ ] Exportação para contador
└── [ ] Stripe (cobrança dos planos)
└── [ ] Diretório de profissionais
```

---

## 7. DECISÕES ARQUITETURAIS REGISTRADAS

| Decisão | Escolha | Motivo | Data |
|---|---|---|---|
| WhatsApp API | Evolution API | Open source, custo fixo, comunidade BR | v2.0 |
| Orquestração | n8n self-hosted | Visual, sem limite de exec, acessível para não-dev | v2.0 |
| IA classificação | gpt-4o-mini | Rápido, barato, suficiente para intenção | v2.0 |
| IA consultiva | gpt-4o | Qualidade necessária para análise financeira | v2.0 |
| Banco de dados | Supabase | RLS nativo, SQL real, auth integrado | v2.0 |
| Frontend | Next.js 14 | App Router, SSR, Vercel deploy | v2.0 |
| Infraestrutura | Railway + Vercel | Simples, custo controlado, sem DevOps complexo | v2.0 |
| Pagamentos | Stripe | Padrão de mercado, SDK excelente | v2.0 |

---

## 8. COMO USAR ESTE ARQUIVO NO CLAUDE CODE

### Iniciar Plan Mode

```bash
# Na pasta do projeto
claude

# Dentro do Claude Code, diga:
"Leia o PLAN.md completamente e entre em plan mode.
Antes de escrever qualquer código, me apresente:
1. Sua compreensão do sistema
2. A ordem que você vai implementar
3. Qualquer dúvida ou decisão que precise da minha aprovação"
```

### Durante o desenvolvimento

```bash
# Sempre que for implementar uma funcionalidade nova:
"Vou implementar [F10 - Registrar receita por voz].
Leia a RN-05 e RN-03 antes de começar.
Me mostre o plano antes de escrever código."

# Antes de qualquer merge/deploy:
"Execute /revisar-seguranca e verifique RN-01 em todos os arquivos novos."

# Quando encontrar uma decisão arquitetural nova:
"Registre esta decisão na seção 7 do PLAN.md:
Decisão: [o que foi decidido]
Escolha: [o que foi escolhido]
Motivo: [por quê]"
```

### Checklist antes de cada sessão

```
[ ] Estou na pasta correta do projeto?
[ ] O PLAN.md e CLAUDE.md estão atualizados?
[ ] A tarefa de hoje está na ordem correta do item 6?
[ ] Sei qual RN se aplica ao que vou implementar?
```
