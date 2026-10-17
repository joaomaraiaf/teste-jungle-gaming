# Publicação

Destino padrão: Vercel, SPA Vite. `vercel.json` define instalação congelada, `pnpm build:mock`, saída `dist`, service worker sem cache e fallback após resolução de arquivos estáticos. `.env.mock` habilita os mocks; `VITE_API_URL=/api`; `VITE_SOCKET_URL` vazio usa a origem da aplicação. Nenhum segredo é necessário no frontend.

## Situação

A aplicação está publicada na Vercel: [https://teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app](https://teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app). O deploy foi conferido na rota `/payment`. Após publicar novas revisões, registre o identificador da revisão e repita a validação das rotas públicas.

## Procedimento

1. Disponibilizar a revisão a validar em um repositório acessível ao avaliador, incluindo lockfile, baselines e relatórios.
2. Importar o repositório na Vercel, usar Node 24 e pnpm 11.5.2 indicado no packageManager. Não definir `VITE_MOCKS_ENABLED=false`.
3. Ao publicar uma nova revisão, registrar SHA/identificador da revisão e confirmar que a URL pública continua atendendo essa revisão.
4. Na URL pública, abrir diretamente `/`, `/market/nft-001`, `/cart`, `/profile`, `/wallets`, `/payment` e `/payment/confirmation`. Recarregar cada rota; rotas privadas devem solicitar login quando necessário.
5. Executar `PUBLIC_BASE_URL=https://sua-url pnpm test:public`. O teste usa estado isolado e cobre login, compra, recibo após refresh e evento de estoque em outra aba.
6. Executar manualmente o roteiro de duas contas do README e conferir que o service worker é JavaScript, imagens/fontes carregam e nenhum backend privado é requisitado.

Os dados pertencem ao armazenamento do navegador e não se propagam para outro dispositivo. Uma nova URL/origem inicia armazenamento independente.

Referência oficial da configuração: [vercel.json e rotas](https://vercel.com/docs/project-configuration/vercel-json). Os headers usam rotas com continue; o filesystem é resolvido antes do fallback.
