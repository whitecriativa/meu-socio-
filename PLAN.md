# PLAN.md — Plano de Desenvolvimento do Meu Sócio
## Documento Mestre v4.0 · White Criativa · Luiz Henrique Matias · 2026

> Este arquivo deve ser lido pelo Claude Code antes de qualquer implementação.
> Documento vivo — atualizado conforme o produto evolui.

---

## 1. VISÃO GERAL DO SISTEMA

O **Meu Sócio** é o primeiro parceiro de negócios do pequeno empreendedor brasileiro.

Não é um app que a pessoa precisa aprender a usar. É uma conversa no WhatsApp — por voz ou texto — que cuida do financeiro, do comercial e do administrativo do negócio.

> "O Meu Sócio é o primeiro parceiro de negócios que o MEI brasileiro sempre precisou e nunca pôde ter."

**Exemplo de uso:** O usuário fala: *"Atendi a Ana, limpeza de pele, R$ 180, pix."* O Sócio registra, atualiza o caixa, conta os pontos de gamificação e responde: *"Anotado! Você já faturou R$ 1.340 hoje. Faltam R$ 660 para bater sua meta diária."*

### Filosofia de Interface

| WhatsApp | Painel Web |
|---|---|
| ONDE TUDO ACONTECE | ONDE ELE VISUALIZA |
| Voz, texto ou áudio. O usuário não muda de hábito. O Sócio se adapta a ele. Tudo que acontece aqui é refletido no painel. | Gráficos, relatórios, exportações, calculadoras. Opcional — o produto funciona 100% só pelo WhatsApp. |

**Regra de ouro:** O usuário nunca digita a mesma coisa duas vezes. O que ele faz no WhatsApp aparece automaticamente em todo o restante do sistema.

---

## 2. PÚBLICO-ALVO — O MEI Brasileiro

**Não é só a manicure. São todos os 15 milhões de MEIs ativos no Brasil:**

- Prestadores de serviço: beleza, estética, saúde, educação, técnico
- Representantes comerciais e vendedores autônomos
- Freelancers digitais: designer, dev, fotógrafo, videomaker, copywriter
- Profissionais liberais: advogado, psicólogo, nutricionista, médico
- Pequenos comerciantes e prestadores de serviço em geral

**Exemplos reais:**
- A Caliana é médica e não sabe quanto ganha de verdade
- O João tem uma empresa de iluminação e não sabe qual produto tem maior margem
- A Mariana é manicure e não sabe se o preço que cobra cobre todos os seus custos

**15 milhões de pessoas. Todas no WhatsApp. Nenhuma solução feita para elas.**

> ⚠️ O sistema é 100% agnóstico de profissão. O usuário define sua profissão, suas categorias e seus serviços. Nunca hardcodar nada para uma profissão específica.

---

## 3. STACK TÉCNICA

| Ferramenta | Função | Custo estimado |
|---|---|---|
| Evolution API | WhatsApp do dono com o Sócio | ~R$ 100/mês |
| n8n (Railway) | Cérebro — conecta tudo automaticamente | ~R$ 100/mês |
| OpenAI gpt-4o-mini | Identificação de intenção (rápido e barato) | ~R$ 0,50/cliente/mês |
| OpenAI gpt-4o | IA consultiva e briefing diário | ~R$ 2/cliente/mês |
| OpenAI Whisper | Transcrição de áudios do WhatsApp | Incluso |
| Supabase | Banco de dados com RLS nativo | Gratuito até escala |
| Google Calendar API | Agenda integrada | Gratuito |
| Next.js 14 + Vercel | Painel web do cliente | ~R$ 100/mês |
| Stripe | Cobrança das mensalidades | 2,9% + R$ 0,30/transação |
| **TOTAL (20 clientes)** | — | **~R$ 500/mês** |

**Custo real por cliente:** OpenAI ~R$ 2,50/cliente/mês. Você cobra R$ 247. Margem bruta de infra: 98,7%.

### Arquitetura de Pastas

```
socio/
├── CLAUDE.md               → instruções do projeto
├── PLAN.md                 → este arquivo
├── apps/
│   ├── web/                → painel Next.js (cliente vê aqui)
│   │   ├── app/            → App Router Next.js 14
│   │   ├── components/     → componentes reutilizáveis
│   │   └── lib/            → utilitários e clientes de API
│   └── api/                → backend Node.js/Express (opcional)
├── packages/
│   ├── database/           → schemas Supabase e migrations
│   ├── ai/                 → prompts e lógica de IA
│   └── whatsapp/           → integração Evolution API
├── n8n/
│   └── workflows/          → exports dos fluxos n8n em JSON
└── docs/
    └── modules/            → documentação de cada módulo
```

---

## 4. MÓDULOS DO PRODUTO

### 🌅 BOM DIA SÓCIO
*O primeiro sócio que fala com o usuário todo dia de manhã*

- Briefing personalizado todo dia às 7h no WhatsApp
- Faturamento do dia anterior e acumulado do mês
- Progresso na meta mensal com termômetro visual em texto
- Agenda do dia com lembretes dos compromissos
- Mensagem motivacional gerada pela IA baseada nos dados reais do negócio
- "Faltam R$ 800 para bater sua meta. No ritmo atual, você chega no dia 27. Bora!"
- Alerta de contas a vencer e clientes inativos
- Tarefas prioritárias do dia (máx. 3)

---

### 💰 SÓCIO FINANCEIRO — CFO Artificial
*6 camadas de inteligência financeira para quem nunca teve contador*

- **CAMADA 1** — Lançamentos por voz: fala a venda ou despesa, o sistema categoriza automaticamente
- **CAMADA 2** — Plano de contas por perfil: cada profissão tem estrutura própria (definida pelo usuário)
- **CAMADA 3** — 6 indicadores em tempo real: ticket médio, retenção, custo por atendimento, margem líquida, ponto de equilíbrio, inadimplência
- **CAMADA 4** — IA Consultiva: alertas proativos, análise preditiva, sugestões de decisão
- **CAMADA 5** — Separação PJ/PF: pró-labore sugerido pela IA, dois bolsos paralelos nunca se misturam
- **CAMADA 6** — Exportação para o contador: DRE, Livro Caixa, notas fiscais — um arquivo por mês
- Anexo de extrato bancário em PDF: IA lê e categoriza automaticamente
- Gestão de contas fixas com lembrete antes do vencimento
- Lembrete de cobrança gentil para clientes com pagamento pendente
- Fluxo de caixa projetado para 30, 60 e 90 dias

---

### 📚 EDUCAÇÃO FINANCEIRA CONVERSACIONAL
*Ensinar o que é margem, custo e lucro — de forma leve e no momento certo*

- O Sócio explica conceitos quando o dado registrado abre uma oportunidade de aprendizado
- Margem de contribuição vs margem líquida — na linguagem do usuário
- Custo fixo vs custo variável — com exemplos do próprio negócio
- Ponto de equilíbrio: "você precisa de X atendimentos por mês para não ter prejuízo"
- Custo real por atendimento incluindo tudo (tempo, insumo, fixo, imposto)
- Diferença entre faturamento e lucro
- ROI de anúncio calculado automaticamente
- Sabedoria financeira no estilo Warren Buffett — simples, aplicável, sem jargão
- Nunca é invasivo: só aparece quando o dado justifica o ensinamento

---

### 🧮 CALCULADORA DE PRECIFICAÇÃO
*Saber se o preço cobrado está realmente pagando as contas*

- Usuário informa o preço que quer cobrar — Sócio calcula se está correto
- Usa dados reais já cadastrados: custos fixos, volume de atendimentos, impostos
- Calcula: custo fixo por atendimento + insumos + imposto + pró-labore = preço mínimo
- Mostra a margem atual e a margem saudável para o perfil
- Sugere o preço ideal baseado nas metas financeiras do usuário
- Calculadora de valor da hora para qualquer profissão
- Disponível no WhatsApp por pergunta e no painel web como calculadora visual

---

### 🎯 SÓCIO METAS
*O sonho como motor do negócio*

- Sonho definido no onboarding — vira o norte de tudo
- Meta mensal de faturamento personalizada por perfil
- Termômetro diário de progresso em texto no WhatsApp
- Projeção: "no ritmo atual você chega na meta no dia X"
- Celebração automática ao bater meta com menção ao sonho
- Alerta quando o ritmo atual não vai bater a meta — com sugestão de ação

---

### 📅 SÓCIO AGENDA + MINI CRM
*A agenda que vira um relacionamento com o cliente*

- Agendamento por voz: "marca a Ana pra sexta às 14h"
- Integração nativa com Google Calendar
- Link público de autoagendamento para o cliente
- Confirmação automática com imagem para o cliente
- Cancelamento com justificativa registrada
- Histórico completo por cliente: quantas vezes voltou, o que consumiu, total gasto (LTV)
- Pipeline de relacionamento: Novo → Proposta → Agendado → Atendido → Fidelizado
- Nível de fidelidade calculado automaticamente (1-5, 6-10, 11+ visitas)
- Observações por cliente registradas por voz a qualquer momento

---

### 🔄 SÓCIO COMERCIAL — Follow-up e Reativação
*Vender para o mesmo cliente é 7x mais barato que conquistar um novo*

- Alerta automático de clientes inativos por período configurável
- Sócio sugere o texto de reativação — usuário manda com um toque (sem custo de API)
- "Ana não vem há 35 dias. Aqui está o texto para reativar ela — é só copiar e mandar."
- Agrupamento de inativos por período para ação em lote
- Calendário sazonal com 21 dias de antecedência: Dia das Mães, Natal, Black Friday, etc.
- Sugestões de marketing baseadas nos dados do negócio e na data do calendário
- ROI de cada ação de reativação rastreado automaticamente

---

### ✅ SÓCIO TAREFAS — Prioridade Inteligente
*Resolver o que importa, não o que aparece primeiro*

- Registro de tarefas por voz a qualquer momento
- Classificação automática na Matriz de Eisenhower adaptada para autônomo
- Urgente + Importante → faz agora | Importante → agenda | Urgente → simplifica | Nenhum → questiona
- Lista de máximo 3 prioridades por dia — sem sobrecarga
- Check-in diário à tarde: "concluiu as prioridades? O que fica para amanhã?"
- Histórico de tarefas com contexto de quando foi feito e o que foi postergado

---

### 📡 SÓCIO RADAR — Atendimento Sem Perder Ninguém
*Nenhum cliente fica sem resposta por mais de 30 minutos*

- Monitora conversas do WhatsApp do dono sem resposta
- Alerta configurável: "você tem 2 clientes aguardando resposta há 30 minutos"
- Classifica o contato: novo lead, cliente recorrente ou VIP
- Gera sugestão de resposta rápida — dono aprova e envia
- Relatório semanal: tempo médio de resposta e impacto estimado na receita
- Não é bot que responde pelo dono — é radar que avisa na hora certa

---

### 🎮 GAMIFICAÇÃO — O Sistema que Cria Hábito
*O usuário não cancela quando está no nível 4 faltando 2 missões para o nível 5*

- Sistema de pontos: cada ação gera pontos (+10 receita, +30 reativação, +150 meta batida)
- 6 níveis: 🌱 Semente → 🌿 Broto → 🌳 Árvore → ⭐ Estrela → 💎 Cristal → 🏆 Sócio Ouro
- Missões diárias, semanais e mensais com recompensas
- 10 badges permanentes: Primeira Venda, Em Chamas, Meta Batida, Empresária e mais
- Streaks com proteção aos fins de semana — não quebra se descansar no sábado
- Protetor de streak: 1 por mês para emergências
- Pontos e nível nunca regridem — conquistas são permanentes
- Notificação de streak em risco às 18h se não registrou nada no dia

---

### 🏦 SAÚDE FINANCEIRA E INVESTIMENTOS
*Incentivar o empreendedor a crescer e investir o que sobra*

- Indicador de saúde financeira mensal: semáforo verde/amarelo/vermelho
- Quando sobra dinheiro: "Você está com R$ 2.400 de reserva. Já pensou em investir?"
- Parceria com R3 Investimentos: sugestão de produtos de investimento no app
- Educação sobre reserva de emergência: mínimo 3 meses de custos fixos
- Calculadora de independência financeira

---

### 🤝 MARKETPLACE DE ESPECIALISTAS
*Conectar o empreendedor com quem pode ajudá-lo a crescer*

- Aba de contato com especialistas por área: marketing, contabilidade, jurídico, investimentos
- Marketing e produção de conteúdo: White Criativa
- Investimentos e RPPS: R3 Investimentos
- Contador online: parceiros cadastrados por região
- Gatilhos inteligentes: "bateu meta 3 meses seguidos → oferecer tráfego pago"
- Modelo: lead qualificado pelo app → vendido pela White Criativa

---

### 🧠 MEMÓRIA DO NEGÓCIO
*Histórico inteligente de tudo que aconteceu*

- Tudo que foi dito, vendido, agendado e prometido fica salvo e indexado
- Perguntas em linguagem natural: "quanto faturei em março?", "quem é meu cliente mais fiel?"
- Comparativos automáticos entre períodos
- O dono nunca perde uma informação — o Sócio lembra por ele

---

### 💳 INTEGRAÇÃO BANCÁRIA — Cobranças sem ser Fintech

O Meu Sócio permite emitir boletos e links Pix para os clientes sem sair do WhatsApp. Não somos fintech — operamos como parceiros de um BaaS regulamentado.

| Parceiro | O que oferece | Custo |
|---|---|---|
| **Cora** (já usado pelo Luiz) | API de cobrança, boleto, Pix — MEI friendly | Gratuito para MEI + taxa/boleto |
| Celcoin | Boleto, Pix, split de pagamento | Por transação |
| Asaas | Boleto, Pix, cobrança recorrente — API simples | R$ 1,99 por boleto |
| Juno (Boa Compra) | Boleto, cartão, Pix | Por transação |

**Modelo de receita:** Taxa de R$ 1,50 por cobrança gerada.
> ⚠️ Não implementar antes de ter 20 clientes pagantes.

---

## 5. BANCO DE DADOS — Tabelas Principais (Supabase)

```sql
-- Usuários (donos do negócio)
users: id, name, phone, profile_type, dream, monthly_goal, created_at

-- Clientes do usuário
clients: id, user_id, name, phone, last_contact, total_spent, status

-- Lançamentos financeiros
transactions: id, user_id, client_id, type, amount, category, payment_method, description, competence_date, paid_at

-- Agendamentos
appointments: id, user_id, client_id, service, datetime, status, price, notes

-- Tarefas
tasks: id, user_id, title, priority, quadrant, due_date, completed_at

-- Mensagens (log do WhatsApp)
messages: id, user_id, phone, content, direction, intent, created_at

-- Métricas diárias (cache)
daily_metrics: id, user_id, date, revenue, expenses, appointments_count, new_clients
```

**CRÍTICO:** RLS ativo em todas as tabelas. Cada query DEVE filtrar por `user_id`. Nunca expor dados de um usuário para outro.

---

## 6. PLANOS E PRECIFICAÇÃO

| Funcionalidade | 🌱 Essencial R$ 147/mês | ⚡ Profissional R$ 247/mês | 🚀 Acelerador R$ 397/mês |
|---|---|---|---|
| Financeiro por voz | ✅ | ✅ | ✅ |
| Bom Dia Sócio | ✅ | ✅ | ✅ |
| Metas e gamificação | ✅ | ✅ | ✅ |
| Agenda + Google Cal | ✅ | ✅ | ✅ |
| Tarefas priorizadas | ✅ | ✅ | ✅ |
| Educação financeira | ✅ | ✅ | ✅ |
| Calculadora precificação | ✅ | ✅ | ✅ |
| Calendário sazonal | ✅ | ✅ | ✅ |
| Mini CRM + histórico | ❌ | ✅ | ✅ |
| Painel web completo | ❌ | ✅ | ✅ |
| Autoagendamento cliente | ❌ | ✅ | ✅ |
| Separação PJ/PF | ❌ | ✅ | ✅ |
| Indicadores avançados | ❌ | ❌ | ✅ |
| DRE pro contador | ❌ | ❌ | ✅ |
| Módulo Radar | ❌ | ❌ | ✅ |
| Saúde financeira + invest. | ❌ | ❌ | ✅ |
| Marketplace especialistas | ❌ | ❌ | ✅ |

---

## 7. ONBOARDING CONVERSACIONAL

Na primeira mensagem, o Sócio conduz um onboarding de 5 perguntas. Sem formulário, sem link, sem app.

```
Sócio: "Oi! Sou o Sócio, seu parceiro de negócios. Como posso te chamar?"
Sócio: "Qual é a sua profissão ou área de atuação?"
Sócio: "Você atende em domicílio, em estúdio próprio ou em outro local?"
Sócio: "Quantos clientes você atende por semana em média?"
Sócio: "Última pergunta: qual é o seu grande sonho? Pode ser uma viagem, uma casa, um carro — qualquer coisa."
```

Com essas 5 respostas, o sistema configura o plano de contas, calibra as metas, personaliza o tom e já está pronto para começar.

---

## 8. ROADMAP DE CONSTRUÇÃO

| Fase | O que construir | Marco de validação | Status |
|---|---|---|---|
| **FASE 0** | Estrutura do projeto, banco de dados com RLS, painel web com 6 páginas, n8n no Railway | Infraestrutura completa no ar | ✅ Concluído |
| **FASE 1** | Conectar Evolution API, webhook WhatsApp, identificação de intenção, lançamento financeiro por voz, Bom Dia Sócio | Primeiro "oi" respondido automaticamente | ⏳ Aguardando chip |
| **FASE 2** | Agenda + Google Calendar, mini CRM, metas, gamificação, calculadora de precificação, educação financeira | 5 clientes beta pagando | 🔲 Mês 2 |
| **FASE 3** | Módulo Radar, follow-up com texto sugerido, calendário sazonal, exportação DRE, separação PJ/PF | 20 clientes — R$ 5.000 MRR | 🔲 Mês 3 |
| **FASE 4** | Marketplace especialistas, saúde financeira, investimentos, extrato bancário PDF, app mobile | 50 clientes — R$ 12.000+ MRR | 🔲 Mês 4+ |

---

## 9. ESTADO ATUAL (atualizado em 01/04/2026)

| O que foi construído | Status |
|---|---|
| ✅ Banco de dados — RLS completo | Rodando em produção no Supabase |
| ✅ Painel web — 7 páginas (Dashboard, Financeiro, Agenda, Clientes, Tarefas, Metas, Configurações) | localhost:3000 funcionando |
| ✅ Dashboard conectado ao Supabase (dados reais) | Sem dados mockados |
| ✅ Módulo Financeiro — lançamentos + DRE + indicadores | Formulário web funcional |
| ✅ Módulo Agenda — calendário + agendamentos | Formulário web funcional |
| ✅ Módulo Clientes/CRM — lista + detalhe + reativação | Formulário web funcional |
| ✅ Módulo Tarefas — Eisenhower + gamificação | Formulário web funcional |
| ✅ Módulo Metas — termômetro + badges + níveis | Formulário web funcional |
| ✅ n8n — workflow principal + Bom Dia Sócio | Rodando no Railway |
| ⏳ WhatsApp via Evolution API | Aguardando chip dedicado |
| 🔲 Calculadora de precificação | Planejado |
| 🔲 Onboarding conversacional | Planejado |
| 🔲 Google Calendar integração real | Planejado |
| 🔲 Integração bancária Cora/Celcoin | Fase 4 — após 20 clientes |
| 🔲 Deploy Vercel + domínio | Após validação com beta |

---

## 10. REGRAS DE NEGÓCIO

### RN-01 Isolamento de dados (CRÍTICA)
Cada usuário só acessa seus próprios dados. RLS ativo em 100% das tabelas. Violação = falha crítica de segurança.

### RN-02 Sistema agnóstico de profissão
O sistema NUNCA é nichado para uma profissão específica. O usuário define sua profissão, categorias e serviços livremente. Não há listas fixas de profissões, serviços ou categorias — apenas sugestões genéricas como datalist.

### RN-03 Intenção desconhecida
Se a OpenAI não identificar a intenção com confiança acima de 70%, o sistema pede clareza educadamente. Nunca assumir intenção errada.

### RN-04 Áudio transcrito antes de processar
Toda mensagem de áudio deve ser transcrita via Whisper antes de identificação de intenção.

### RN-05 Lançamento financeiro com data de competência
Data de competência (quando o serviço foi prestado) ≠ data de pagamento. O DRE usa data de competência. Fluxo de caixa usa data de pagamento.

### RN-06 Pró-labore não é despesa operacional
Pró-labore vai para `despesas_pessoais.prolabore` — nunca categorizar como despesa operacional.

### RN-07 Projeção financeira requer dados mínimos
Projeção só é gerada com pelo menos 7 dias de histórico no mês atual.

### RN-08 Agendamento no passado
Sistema não cria agendamentos para datas no passado sem confirmação. Pergunta se quer registrar como atendimento já realizado.

### RN-09 Cliente duplicado
Antes de criar novo cliente, verificar nome similar (Levenshtein ≤ 2) ou mesmo telefone.

### RN-10 Limite de mensagens motivacionais repetidas
Nunca enviar a mesma mensagem motivacional nos últimos 30 dias por usuário.

### RN-11 Horário do Radar
O Radar só monitora conversas dentro do horário de trabalho configurado (padrão: 08h–19h).

### RN-12 LGPD
Exportação completa dos dados em JSON em até 72h. Exclusão completa da conta disponível.

### RN-13 Integração bancária
Não implementar antes de ter 20 clientes pagantes.

### RN-14 Custo por usuário
Custo de infra por usuário ativo não pode exceder R$ 25/mês. Monitorar uso de tokens da OpenAI mensalmente.

### RN-15 Graceful degradation
Se a OpenAI API estiver fora: confirmar recebimento, colocar na fila, processar quando voltar. Nunca deixar mensagem sem resposta por mais de 10 minutos sem aviso.

---

## 11. MÉTRICAS DE VALIDAÇÃO — 60 dias

| ✅ Continua se... | ⚠️ Pivota se... | 🔴 Para se... |
|---|---|---|
| 5 MEIs pagando qualquer valor | Menos de 3 pagantes em 60 dias | Zero pagantes em 90 dias |
| 3 deles mandando mensagem todo dia | Ninguém usa financeiro por voz | Produto funcionando e sem uso |
| NPS médio acima de 8 | Mesma reclamação de 3+ usuários | Custo maior que receita por 3 meses |
| Pelo menos 1 depoimento espontâneo | Taxa de churn acima de 30%/mês | Fundador sem motivação para continuar |

---

## 12. PRODUTO FUTURO — MEU ESTOQUE

Para MEIs que vendem produto físico (revendedores, comerciantes). Produto separado com a mesma interface WhatsApp.

- João fala: "comprei 20 lâmpadas LED por R$ 15 cada" → sistema registra entrada
- João fala: "vendi 5 lâmpadas por R$ 45 cada" → sistema registra saída
- Estoque atual sempre atualizado em tempo real
- Margem por produto calculada automaticamente
- Alertas de estoque baixo antes de faltar
- **Desenvolvimento planejado após atingir 100 clientes no Meu Sócio**

---

## 13. DECISÕES ARQUITETURAIS

| Decisão | Escolha | Motivo | Data |
|---|---|---|---|
| WhatsApp API | Evolution API | Open source, custo fixo, comunidade BR | v1.0 |
| Orquestração | n8n self-hosted | Visual, sem limite de exec, acessível para não-dev | v1.0 |
| IA classificação | gpt-4o-mini | Rápido, barato, suficiente para intenção | v1.0 |
| IA consultiva | gpt-4o | Qualidade necessária para análise financeira | v1.0 |
| Banco de dados | Supabase | RLS nativo, SQL real, auth integrado | v1.0 |
| Frontend | Next.js 14 | App Router, SSR, Vercel deploy | v1.0 |
| Infraestrutura | Railway + Vercel | Simples, custo controlado | v1.0 |
| Pagamentos | Stripe | Padrão de mercado, SDK excelente | v1.0 |
| Server Actions | adminClient() inline | Evitar `import 'server-only'` em Server Actions | v4.0 |
| Supabase client | createClient direto | lib/supabase-server.ts não funciona em actions | v4.0 |
| Profissão | Campo livre (datalist) | Sistema agnóstico — nunca nichado | v4.0 |

---

## 14. COMO CLAUDE CODE DEVE TRABALHAR

1. **Antes de qualquer alteração**, leia este PLAN.md para entender o módulo em questão
2. **Sempre usar** `adminClient()` inline em Server Components e Server Actions — nunca importar de `lib/supabase-server.ts`
3. **Sempre verificar** se RLS está ativo antes de criar tabelas
4. **Nunca nichado** — categorias são datalist com sugestões genéricas, profissão é campo livre
5. **Commitar** incrementalmente — um módulo por vez, testado
6. **TypeScript strict** — zero erros em `npx tsc --noEmit` (exceto supabase-server.ts que é legado)
7. **export const dynamic = 'force-dynamic'** em todas as páginas com fetch de dados

```bash
# Padrão correto de adminClient em qualquer arquivo server-side:
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```
