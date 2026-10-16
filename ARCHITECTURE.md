# Arquitetura do Jungle NFT Marketplace

## Organização

SPA React 19/TypeScript com Vite, TanStack Router e TanStack Query. Features seguem Feature-first, Clean Architecture e MVVM: View → ViewModel/hook → usecase → contrato de repository. Implementações HTTP, DTOs e schemas ficam em `data/`; o domínio não importa React nem infraestrutura. As dependências são compostas na raiz da feature. Novas features começam com `pnpm generate <nome>`.

As rotas carregam Views sob demanda. Axios é o transporte REST da aplicação, com schemas Zod nas bordas e cancelamento por `AbortSignal`. Valores ETH são strings decimais; cálculos de compra usam `bigint` em wei. Não há blockchain, extensão de carteira ou pagamento real.

## Estado, cache e recuperação

Contas, perfis e carteiras ficam no `localStorage` por sete dias; a sessão fica no `sessionStorage` de cada aba por até 24 horas. Senhas usam PBKDF2 com salt. Isso serve à demonstração local e não constitui autenticação segura de produção. Cada aba tem um identificador de visitante; o carrinho autenticado é persistido por usuário. No login, itens do visitante são incorporados uma única vez, respeitando edição e estoque. Logout explícito inicia um carrinho visitante separado.

Query keys incluem parâmetros e identidade. Catálogo e facetas têm `staleTime` de 30 segundos. Queries encaminham `AbortSignal`; favoritos usam snapshot otimista, rollback e reconciliação por REST. Mutations de comércio não têm retry automático. Mutations do carrinho são serializadas por proprietário. Troca de conta remove dados privados do cache, encerra assinaturas e protege callbacks atrasados por identidade.

A URL é a fonte de busca, filtros, ordenação, paginação e aba do catálogo. Busca tem debounce de 250 ms; navegação invalida rascunhos pendentes para impedir que respostas atrasadas sobrescrevam voltar/avançar. Atualizações em segundo plano preservam dados carregados e exibem estado/erro sem deslocar o conteúdo.

## Pedidos, estoque e eventos

A tentativa de compra guarda o corpo e a chave idempotente no `sessionStorage` antes do POST. Timeout ou refresh recuperam o mesmo pedido por ID/chave; uma chave reutilizada com outro conteúdo gera conflito. `pending` pode terminar em `confirmed` ou `rejected`, sem regressão. Recibos consultam somente snapshots confirmados. Atividades são uma projeção dos pedidos.

Catálogo, estoque, carrinho, pedidos e idempotência compartilham o store dos mocks. Web Locks serializa operações entre abas compatíveis, relendo o estado dentro do bloqueio. Confirmação grava estoque, pedido e carrinho conjuntamente; somente as quantidades compradas são removidas. Sem Web Locks, a fila protege somente o runtime atual.

BroadcastChannel transporta apenas geração e identificadores entre os mocks. Após o commit, os mocks emitem envelopes tipados pelo servidor Socket.IO simulado (`@mswjs/socket.io-binding` e `socket.io-client`). A aplicação recebe eventos pelo cliente Socket.IO; componentes não assinam o BroadcastChannel. Eventos privados são filtrados pela sessão/conta, duplicatas e versões antigas são descartadas e a reconexão reconcilia recursos ativos por REST.

O transporte usa WebSocket nativo do Socket.IO client, interceptado pelo MSW e binding. O mock não implementa HTTP long-polling, upgrade de polling, rooms ou paridade completa de servidor. A sincronização vale para abas na mesma origem e perfil de navegador. Não há backend compartilhado entre dispositivos ou servidor WebSocket remoto.

## Interface e acessibilidade

As features possuem componentes focados por seção e hooks/ViewModels para estado e comportamento. As páginas compõem essas partes e não concentram mocks ou lógica de transporte. O layout é responsivo, usa Roboto Mono local e as artes incluídas em `public/images`. As imagens otimizadas WebP possuem tamanhos responsivos; os PNG originais são preservados para a reprodução do otimizador. Animações respeitam `prefers-reduced-motion`.

Os fluxos implementados mantêm estados de carregamento, vazio, erro e atualização; formulários e navegação suportam teclado, foco visível e ampliação de texto. A matriz de acessibilidade percorre as rotas principais em desktop, tablet e mobile. Baselines visuais cobrem início, detalhe, carrinho e pagamento.

Autenticação, contas, eventos e pagamentos são simulados. Login social, recuperação de senha, conexão real de carteira, transação on-chain e pagamento real não são anunciados como operações concluídas. A tela Atividade é uma extensão demonstrativa do histórico de pedidos.

## Validação e publicação

- Requisitos: [docs/REQUIREMENTS_MATRIX.md](docs/REQUIREMENTS_MATRIX.md)
- Contratos REST/eventos e de comércio: [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md), [docs/COMMERCE_CONTRACTS.md](docs/COMMERCE_CONTRACTS.md)
- Decisões: [docs/ADRs/](docs/ADRs/)
- Testes, baselines e condições: [docs/VALIDATION.md](docs/VALIDATION.md)
- Relatórios: [docs/audits/README.md](docs/audits/README.md)
- Publicação: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

`vercel.json` configura a instalação congelada, build mock, diretório `dist`, service worker sem cache e fallback SPA. A configuração local não comprova publicação; a URL pública e sua validação devem ser registradas em `docs/DEPLOYMENT.md` após o deploy.
