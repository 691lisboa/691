# 691 EXTREME — 2026-09-06

Redesign comercial mobile-first do 691.pt, preservando o backend e os fluxos existentes.

## Mantido
- Reserva Agora / Mais tarde e validações existentes
- Tradução automática do formulário
- Supabase, Telegram, webhook, estados, cancelamentos e restauro de sessão
- Web Push / PWA
- origem `src` / `utm_source` da reserva enviada ao backend
- páginas legal / privacidade / Livro de Reclamações

## Novo
- homepage premium mobile-first
- fotografia real do táxi do 691 como hero
- CTAs principais Reserva + WhatsApp
- barra fixa Reserva / WhatsApp em mobile
- Lisboa / Aeroporto / Viagens por Portugal com cartões visuais
- destinos Sintra & Cascais, Fátima & Óbidos e Évora
- landing pages redesenhadas e sem seletor English/Português
- tradução automática de conteúdo comercial PT/EN/ES (homepage também FR/DE/IT)
- SEO anterior preservado: robots, sitemap, canonical, schema e páginas dedicadas
- imagem OG do táxi

## Validação
`npm run build` => `691 static audit: OK`

## Nota
As fotografias críticas são locais (`/assets/destinations/*.webp`) e a fotografia principal do táxi continua local (`/assets/taxi-691.webp`). Não há dependência de URLs externas para os cartões/hero das páginas principais.

## Correção v3
- corrigido conflito do `body` legado que colocava header/main/footer lado a lado
- desktop e mobile voltam a ocupar 100% da largura corretamente
- fotografias de Lisboa, Sintra, Fátima e Évora passam a assets locais
- cartões sem imagem/cinzentos eliminados
- responsive reforçado em 980 / 680 / 390 px
