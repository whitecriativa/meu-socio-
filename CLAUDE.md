# SÓCIO — O parceiro de negócios que cabe no WhatsApp
## Contexto do Projeto

O Sócio é um sistema de gestão completo para autônomos e profissionais liberais que opera primariamente via WhatsApp. O usuário fala por voz ou texto no WhatsApp — o sistema registra, organiza, analisa e responde de forma inteligente. Há também um painel web para visualização e relatórios.

**Público-alvo:** Prestadores de serviço (manicure, psicóloga, personal, estética) e freelancers digitais (designer, dev, copywriter) que trabalham sozinhos e não têm sócio, contador acessível nem sistema de gestão.

**Problema central:** Eles são desorganizados, perdem cliente por não responder a tempo, não sabem quanto ganharam de verdade, e nunca têm demonstrativo pro contador.

---

## Stack Técnica

| Camada | Tecnologia | Função |
|---|---|---|
| WhatsApp | Evolution API | Canal principal de input/output |
| Automações | n8n | Cérebro — conecta tudo |
| IA | OpenAI API (GPT-4o) | Entende mensagens, gera respostas inteligentes |
| Banco de dados | Supabase (PostgreSQL) | Armazenamento de todos os dados |
| Agenda | Google Calendar API | Integração de agendamentos |
| Painel web | Next.js 14 + TypeScript | Interface visual do cliente |
| Estilo | Tailwind CSS | Estilização |
| Auth | Supabase Auth | Autenticação de usuários |
| Pagamentos | Stripe | Cobrança das mensalidades |

---

## Arquitetura de Pastas

```
socio/
├── CLAUDE.md               → este arquivo
├── SPEC.md                 → especificação completa do produto
├── PLAN.md                 → plano de desenvolvimento
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

## Módulos do Sistema

O produto é modular. Cada módulo é independente mas integrado.

### 1. BOM DIA SÓCIO
Briefing diário automático às 7h. Faturamento do dia anterior, metas, agenda do dia, mensagem motivacional baseada nos dados reais.

### 2. SÓCIO FINANCEIRO (CFO Artificial)
- Lançamentos por voz — sistema extrai tipo, valor, cliente, forma de pagamento automaticamente
- Plano de contas por perfil (prestadora de serviços vs. freelancer digital)
- DRE mensal automático, fluxo de caixa projetado 30/60/90 dias
- 6 indicadores: ticket médio, retenção, custo por atendimento, margem líquida, ponto de equilíbrio, inadimplência
- IA consultiva: alertas proativos, análise preditiva, sugestões de decisão
- Separação PJ/PF com pró-labore sugerido pela IA
- Exportação DRE + Livro Caixa pro contador

### 3. SÓCIO AGENDA
- Agendamento por voz
- Google Calendar integrado
- Link de autoagendamento público pro cliente
- Confirmação automática com imagem
- Cancelamento com justificativa

### 4. SÓCIO METAS
- Sonho definido na entrada (a viagem, a casa, o carro)
- Meta mensal de faturamento
- Termômetro diário de progresso
- Projeção: "no ritmo atual você chega em X"

### 5. SÓCIO COMERCIAL (Carteira)
- Carteira de clientes criada automaticamente pelas conversas
- Histórico de atendimentos por cliente
- Alerta de inativos há X dias
- Reativação com aprovação do dono

### 6. SÓCIO TAREFAS
- Lista de prioridades diárias (máx. 3)
- Matriz de Eisenhower adaptada para autônomo
- Check-in à tarde: "concluiu as 3 prioridades?"
- Lançamento de tarefas por voz

### 7. SÓCIO RADAR (Atendimento)
- Monitora conversas WhatsApp sem resposta
- Alerta após X minutos configurável
- Classifica: novo lead, recorrente, VIP
- Sugestão de resposta pela IA (dono aprova e envia)

### 8. SÓCIO SERVIÇOS
- Diretório de profissionais locais (eletricista, contador, designer etc.)
- Busca por categoria

### 9. MEMÓRIA DO NEGÓCIO
- Histórico inteligente de tudo
- Perguntas em linguagem natural: "quanto faturei em março?"

---

## Banco de Dados — Tabelas Principais (Supabase)

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

**CRÍTICO:** Sempre usar Row Level Security (RLS) em todas as tabelas. Cada query DEVE filtrar por user_id. Nunca expor dados de um usuário para outro.

---

## Regras de Desenvolvimento

### Código
- TypeScript strict mode em tudo
- Componentes React funcionais com hooks
- Zod para validação de inputs
- Tratamento de erros explícito em toda operação de banco

### Segurança (NUNCA violar)
- RLS ativo em todas as tabelas do Supabase
- Service Key do Supabase NUNCA no frontend
- Variáveis de ambiente para TODAS as chaves de API
- Validar e sanitizar todo input do WhatsApp antes de processar

### Padrões de IA
- Prompts em `/packages/ai/prompts/` — nunca hardcoded nas funções
- Sempre incluir user_id e contexto do usuário nos prompts
- Log de todas as chamadas de IA para monitoramento de custo
- Fallback gracioso quando a IA não entender a intenção

### Estilo
- Cores principais: verde escuro `#2D6A4F`, laranja `#F4845F`
- Fonte: Inter
- Tom da interface: acolhedor, não corporativo, como um sócio mesmo

---

## Comandos Úteis

```bash
# Desenvolvimento web
cd apps/web && npm run dev

# Verificar tipos
npm run typecheck

# Testes
npm run test

# Build
npm run build

# Supabase local
supabase start
supabase db push
supabase db reset
```

---

## Como Claude Code deve trabalhar neste projeto

1. **Antes de qualquer alteração**, leia o SPEC.md para entender o módulo em questão
2. **Sempre verificar** se RLS está ativo antes de criar tabelas
3. **Nunca criar** chamadas de IA sem logar o custo estimado em tokens
4. **Sempre perguntar** antes de fazer mudanças arquiteturais grandes
5. **Commitar** incrementalmente — um módulo por vez, testado
6. **Documentar** cada módulo concluído em `/docs/modules/`
