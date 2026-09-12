# 691 Lisboa

Aplicação web de reservas de táxi com confirmação e gestão operacional via Telegram, estado em tempo real por Socket.IO, notificações Web Push e persistência Supabase.

## Funcionalidades atuais

- Formulário de reserva em `public/index.html` com autocomplete TomTom para moradas.
- Tradução automática coerente em 11 idiomas na interface principal, rodapé, páginas Legal/Privacidade, acompanhamento da reserva e fallback offline; os links internos preservam o idioma.
- Estados da reserva: `pending → accepted → onway → arrived → completed`, com rejeição/cancelamento como estados terminais.
- Bot Telegram administrativo limitado ao `TELEGRAM_CHAT_ID` configurado.
- Cancelamento pelo cliente com confirmação do servidor e aviso no Telegram.
- Web Push com validação do par VAPID e renovação automática de subscrições inválidas.
- Persistência Supabase; o filesystem do Render não é usado como fonte de verdade.
- Link privado `/reserva/:id?token=...` protegido por HMAC.
- Botões Waze com coordenadas exatas quando a morada é escolhida no autocomplete; fallback por geocodificação quando necessário.
- PWA com Service Worker, atualização network-first dos ficheiros locais e fallback offline.

A funcionalidade GPS foi removida por completo porque não é utilizada, reduzindo superfície de ataque, permissões e dependências externas desnecessárias.

## Requisitos

- Node.js 22.x
- npm
- Projeto Supabase com o esquema de `supabase_schema.sql`. Em bases já existentes, aplicar também `supabase_migration_2026-09-12_route_coords.sql` para persistir as coordenadas exatas de recolha/destino usadas pelo Waze. A migração é idempotente e pode ser executada mais de uma vez.

## Variáveis de ambiente

Copiar `.env.example` para `.env` em desenvolvimento. Em produção, configurar as variáveis no Render.

Obrigatórias para a configuração de produção usada pelo 691:

```env
NODE_ENV=production
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WEBHOOK_URL=https://691.pt/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=
BOOKING_ACCESS_SECRET=
TOMTOM_API_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:jose@79.pt
```

`BOOKING_ACCESS_SECRET` deve ser independente dos outros segredos e ter pelo menos 32 caracteres. Pode ser gerado com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Não guardar segredos no Git.

## Instalação e validação

```bash
npm install
npm run build
npm test
npm start
```

`npm run build` executa uma auditoria estática reforçada: valida sintaxe do backend e frontend, JSON-LD, Service Worker, semântica da homepage, integração Waze, migração de coordenadas, dependências críticas e invariantes de segurança.

## Deploy no Render

- Build command: `npm install && npm run build`
- Start command: `npx tsx server/index.ts`
- Node: 22.x

O servidor falha o arranque se a persistência Supabase não estiver disponível ou se `BOOKING_ACCESS_SECRET` estiver ausente/inválido. Este comportamento é intencional para não arrancar em produção num estado inseguro.

## Segurança operacional

- `.env` está excluído do Git.
- A chave `SUPABASE_SERVICE_ROLE_KEY` existe apenas no backend.
- RLS está ativo nas tabelas Supabase e não existem policies públicas no esquema fornecido.
- Reservas e cancelamentos exigem tokens privados além do identificador do cliente.
- O bot Telegram ignora mensagens/comandos de chats não autorizados.
- Transições de estado inválidas são rejeitadas pelo backend.
- Dados pessoais não são escritos nos logs normais de criação de reservas.

## Estrutura

```text
public/          frontend/PWA
server/index.ts  Express, Socket.IO, Telegram e Web Push
server/store.ts  persistência Supabase via REST
scripts/audit.mjs verificações estáticas de build
supabase_schema.sql esquema para instalação nova
supabase_migration_2026-09-12_route_coords.sql migração final das coordenadas Waze
```

## Preço da viagem

A aplicação continua a apresentar o preço final pelo taxímetro conforme o tarifário aplicável. A estimativa automática de preço deve ser integrada apenas quando estiverem definidos e validados todos os parâmetros tarifários que o serviço pretende aplicar; não deve ser inferida por aproximações no código.


## Checklist da versão final

Para uma instalação existente, antes ou depois do deploy do código, executar uma vez no SQL Editor do Supabase:

```sql
-- conteúdo de supabase_migration_2026-09-12_route_coords.sql
```

O backend é compatível com a base antiga: se a migração ainda não tiver sido aplicada, continua a funcionar com geocodificação por morada. Depois de aplicar a migração, reiniciar o serviço no Render para ativar automaticamente a persistência das coordenadas.
