# 🚕 691 Taxi - Serviço Premium

Aplicação moderna de serviço de taxi com design premium, comunicação em tempo real e integração com Telegram.

## ✨ Funcionalidades

### 🎨 Design Premium
- **OLED UX**: Fundo preto puro com glassmorphism
- **TAXI GREEN**: Esquema de cores verde oficial (#004d00)
- **Mapa TomTom**: Estilo "Night" em fullscreen
- **Animações suaves** e feedback visual avançado

### 📱 PWA Completo
- **Instalável** no iOS e Android
- **Service Worker** para offline-first
- **Splash screen** personalizado
- **Notificações push** nativas

### 🚗 Funcionalidades Principais
- **Reserva instantânea** com cálculo automático de preço
- **GPS automático** para preenchimento de endereços
- **Chat em tempo real** com tradução automática
- **Acompanhamento** em tempo real da viagem

### 🤖 Integração Telegram
- **Botões de ação rápida**:
  - ✅ Confirmar
  - 📍 Cheguei (com alerta sonoro no cliente)
  - 🚀 Waze (abre rota)
  - 🏁 Concluir
  - 💬 Chat

### 💰 Sistema de Preços
- **Base**: €3.25
- **Por km**: €0.90
- **Cálculo via TomTom Routing API**

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** + **TypeScript**
- **Vite** para build rápido
- **TailwindCSS** com classes customizadas
- **Socket.io Client** para comunicação real-time
- **TomTom Maps SDK**

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Socket.io** para real-time
- **Telegram Bot API**
- **Drizzle ORM** + **PostgreSQL**

### PWA
- **Service Worker** com cache strategies
- **Web App Manifest**
- **Push Notifications**

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clonar o projeto
```bash
git clone https://github.com/691lisboa/691.git
cd 691
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Editar `.env` com suas credenciais:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/691_taxi

# TomTom Maps API
VITE_TOMTOM_API_KEY=your_tomtom_api_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Session Secret
SESSION_SECRET=your_session_secret_here

# OpenAI (opcional, para tradução avançada)
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Configurar banco de dados
```bash
# Criar banco de dados
createdb 691_taxi

# Rodar migrations
npm run db:push
```

### 5. Iniciar desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📱 Configuração do Telegram Bot

### 1. Criar Bot no Telegram
1. Fale com [@BotFather](https://t.me/BotFather)
2. Use `/newbot`
3. Siga as instruções
4. Copie o token recebido

### 2. Obter Chat ID
1. Fale com [@userinfobot](https://t.me/userinfobot)
2. Envie qualquer mensagem para seu bot
3. Copie o ID recebido

### 3. Configurar Variáveis
```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
```

## 🗺️ Configuração TomTom Maps

### 1. Criar Conta TomTom
1. Acesse [TomTom Developer Portal](https://developer.tomtom.com/)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a API Key

### 2. Configurar Variável
```env
VITE_TOMTOM_API_KEY=your_tomtom_api_key_here
```

## 🚀 Deploy (Produção)

### Render.com
1. Conecte seu repositório GitHub ao Render
2. Configure as variáveis de ambiente no painel
3. Deploy automático será acionado

### Variáveis de Produção
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_CHAT_ID=seu_chat_id
VITE_TOMTOM_API_KEY=sua_api_key
```

## 📁 Estrutura do Projeto

```
691/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── App.tsx       # App principal
│   │   └── main.tsx      # Entry point
│   └── index.html        # HTML com PWA
├── server/               # Backend Node.js
│   ├── index.ts         # Servidor principal
│   ├── routes.ts        # Rotas API
│   ├── telegram.ts      # Bot Telegram
│   └── services/
│       └── routing.ts   # Serviço de rotas
├── shared/              # Código compartilhado
│   └── schema.ts       # Schema do banco
├── public/              # Arquivos estáticos
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
└── script/             # Scripts de build
    └── build.ts       # Build configuration
```

## 🎯 Funcionalidades Detalhadas

### Real-time Communication
- **Socket.io** para comunicação bidirecional
- **Status updates** instantâneos
- **Chat messages** com tradução automática
- **Driver location** tracking

### Telegram Integration
- **Rich messages** com Markdown
- **Inline keyboards** para ações rápidas
- **Location sharing** via Waze
- **Status notifications** automáticas

### PWA Features
- **Offline support** com cache strategies
- **Background sync** para mensagens
- **Push notifications** para updates
- **App-like experience** no mobile

### Security
- **Input validation** com Zod
- **SQL injection protection** com Drizzle
- **XSS protection** no frontend
- **Rate limiting** (implementar)

## 🧪 Testes

### Testes Unitários
```bash
npm run test
```

### Testes E2E
```bash
npm run test:e2e
```

## 📈 Monitoramento

### Logs
- **Structured logging** no backend
- **Error tracking** centralizado
- **Performance monitoring**

### Analytics
- **Trip analytics** dashboard
- **User behavior** tracking
- **Revenue metrics**

## 🔧 Manutenção

### Updates
```bash
# Update dependencies
npm update

# Database migrations
npm run db:push

# Build production
npm run build
```

### Backup
```bash
# Database backup
pg_dump 691_taxi > backup.sql

# Restore backup
psql 691_taxi < backup.sql
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie feature branch: `git checkout -b feature/nova-funcionalidade`
3. Commit changes: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Pull Request

## 📄 Licença

MIT License - ver [LICENSE](LICENSE) para detalhes

## 🆘 Suporte

- **Email**: support@691.pt
- **Telegram**: @691support
- **Issues**: [GitHub Issues](https://github.com/691lisboa/691/issues)

---

## 🚀 Próximos Passos

- [ ] Implementar pagamento integrado
- [ ] Adicionar múltiplos motoristas
- [ ] Sistema de avaliação
- [ ] Analytics dashboard
- [ ] Multi-language support

**Feito com ❤️ para 691 Taxi**
