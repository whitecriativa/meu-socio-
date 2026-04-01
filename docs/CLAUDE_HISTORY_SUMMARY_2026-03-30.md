# CLAUDE HISTORY SUMMARY (30/03/2026)

Fonte analisada:
- `historicoclaude.rtfd/TXT.rtf`
- Exportado para: `docs/HISTORICO_CLAUDE_COMPLETO.txt`

## 1) Decisões de Produto Confirmadas

- Produto: **Meu Sócio** (assistente de gestão para MEI/autônomo).
- Interface principal: **WhatsApp** (voz/texto).
- Painel web: suporte visual (dashboard, financeiro, agenda, clientes, tarefas, metas).
- Pilar central: financeiro consultivo + agenda + CRM leve + metas + rotina diária.
- Roadmap por fases: validar rápido, depois avançar para automações mais complexas.

## 2) Stack Técnica Consolidada

- Frontend: Next.js 14 (`apps/web`).
- Automação: n8n (Railway).
- Banco: Supabase com RLS.
- IA: OpenAI (intenção, geração, transcrição).
- WhatsApp: Evolution API (pendente ativação com número/chip).

## 3) Estado Atual Consolidado (o que está válido hoje)

- Projeto local correto: `/Users/luizhenriquematias/Desktop/Curso C Coude`
- Banco Supabase ativo.
- Usuário demo confirmado:
  - `0f83b668-37ed-4c71-9301-d33961319522`
- Dashboard já preparado para ler dados reais via:
  - `NEXT_PUBLIC_DEMO_USER_ID`
- n8n criado e workflow importado, faltando etapa final de integração.
- Número de WhatsApp dedicado: **ainda não ativo** (chip já comprado).

## 4) Itens Pendentes Prioritários

1. Completar `.env.local` em `apps/web`:
   - `SUPABASE_SERVICE_ROLE_KEY` (faltando preencher)
2. Popular dados de seed no Supabase para preencher o dashboard.
3. Finalizar n8n com credenciais:
   - Supabase URL + Service Role
   - OpenAI API key
   - Evolution API URL + KEY + instance
4. Ativar número/chip para validar fluxo real de WhatsApp ponta a ponta.

## 5) Pontos que Geraram Confusão (e agora estão fechados)

- Havia duas pastas citadas em momentos diferentes (`MEU SOCIO` e `Curso C Coude`).
- Pasta oficial para seguir: **`Curso C Coude`**.
- Houve orientação conflitante em alguns trechos do histórico sobre caminhos e comandos.
- Este arquivo + `docs/HANDOFF-2026-03-29.md` passam a ser referência operacional.

## 6) Regras Operacionais a partir de agora

- Sempre abrir VS Code na pasta `Curso C Coude`.
- Sempre rodar app em `http://localhost:3000` (com porta).
- Não colar mensagens de erro no SQL Editor (apenas SQL).
- Nunca compartilhar chaves de API em chat.
- Atualizar handoff a cada avanço relevante.

## 7) Próxima Entrega Técnica Recomendada

- Implementar página `configuracoes` conectada ao Supabase.
- Em seguida implementar `calculadora` (precificação) conforme roadmap.

