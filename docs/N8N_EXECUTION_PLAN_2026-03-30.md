# N8N Execution Plan (30/03/2026)

Objetivo: continuar as automacoes agora, mesmo sem numero de WhatsApp ativo.

## Estado atual

- Workflow principal existe: `n8n/workflows/01-main-flow.json`
- URL n8n (Railway): `https://n8n-production-cad37.up.railway.app`
- Supabase e dashboard ja estao ativos.
- Numero/chip WhatsApp ainda nao ativado.

## O que vamos validar agora (sem WhatsApp ativo)

1. Entrada via webhook (`messages.upsert`) com payload mock.
2. Busca de usuario no Supabase por telefone.
3. Gravacao de mensagem em `messages`.
4. Classificacao de intencao via OpenAI.
5. Gravacao de transacao quando intencao for `financial`.
6. Marcacao de mensagem como processada.

## Pre-requisitos no n8n (Environment Variables)

No Railway (servico do n8n), configurar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `EVOLUTION_API_URL` (pode deixar com valor placeholder por enquanto)
- `EVOLUTION_API_KEY` (pode deixar com valor placeholder por enquanto)

Importante:
- sem `SUPABASE_SERVICE_ROLE_KEY` o fluxo nao grava no banco.
- sem `OPENAI_API_KEY` a classificacao nao funciona.

## Passo a passo rapido

1. Abrir n8n e importar workflow:
   - arquivo: `n8n/workflows/01-main-flow.json`
2. Abrir node `Webhook Evolution API` e copiar a `Test URL`.
3. Deixar workflow em modo de teste (Execute workflow).
4. Enviar payload de teste (arquivo abaixo) para a Test URL.
5. Verificar no n8n se os nodes executaram na ordem.
6. Conferir no Supabase:
   - tabela `messages` (nova linha)
   - tabela `transactions` (se intencao financial)

## Payload de teste

Arquivo pronto:
- `n8n/payloads/mock-messages-upsert.json`

Telefone no payload:
- `11999999999` (usuario demo atual)

## Como testar via curl

Substitua `N8N_TEST_WEBHOOK_URL` pela URL de teste do node webhook.

```bash
curl -X POST "N8N_TEST_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @"/Users/luizhenriquematias/Desktop/Curso C Coude/n8n/payloads/mock-messages-upsert.json"
```

## Resultado esperado

- `Filtrar mensagens inbound`: true
- `Extrair dados da mensagem`: phone/text ok
- `Buscar usuario pelo telefone`: retorna 1 usuario
- `Salvar mensagem no Supabase`: inserido
- `Classificar intencao`: retorna JSON
- `Rotear por intencao`: cai em `financeiro`
- `Salvar transacao financeira`: inserido
- `Marcar mensagem como processada`: `processed=true`

## Quando o numero de WhatsApp ativar (sequencia)

1. Subir Evolution API no Railway.
2. Conectar instancia no numero dedicado.
3. Configurar webhook da Evolution apontando para:
   - n8n webhook direto, ou
   - proxy Next.js: `/api/webhook/evolution`
4. Repetir teste ponta a ponta com mensagem real "oi".
5. Ativar workflow em producao.

## Troubleshooting rapido

- Erro `user_id null`:
  - telefone nao bate com tabela `users`.
- Erro `401` no Supabase REST:
  - `SUPABASE_SERVICE_ROLE_KEY` invalida/ausente.
- Erro OpenAI:
  - chave ausente ou sem credito.
- Sem resposta no WhatsApp:
  - esperado enquanto numero nao estiver ativo.

