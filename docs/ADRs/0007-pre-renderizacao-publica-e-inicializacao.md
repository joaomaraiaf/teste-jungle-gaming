# ADR 0007 — Pré-renderização pública e inicialização do transporte

Data: 2026-10-16

Status: aceita

## Contexto

A auditorias iniciais obtiveram Performance mobile 83/84, com LCP próximo de 4,2 segundos, embora acessibilidade, boas práticas e SEO já estivessem aprovados. A aplicação aguardava a inicialização completa do MSW antes de montar a interface. Antecipar downloads e consultas isoladamente não atingiu a meta de 90, o que motivou a pré-renderização descrita nesta decisão. Após a implementação, a auditoria versionada atingiu as metas: Performance mobile 94/98 e desktop 100/100; detalhes estão em [auditorias Lighthouse](../audits/README.md).

## Decisão

O build com mocks gera um snapshot público pelas mesmas rotas REST MSW do navegador. O renderer Node usa os componentes existentes, TanStack Router com histórico em memória e um QueryClient separado, contendo somente catálogo, facetas e detalhe. Gera HTML mobile e desktop para a entrada do catálogo e o NFT de destaque (`/market/nft-001`). Não exige Chromium no build e não inclui contas, sessões, carrinhos, favoritos ou pedidos.

O HTML seleciona a variante pelo mesmo breakpoint do hook de viewport. React hidrata essa árvore depois de carregar a rota e preparar o cache público. O roteador mantém os limites SSR durante a hidratação. As demais rotas continuam usando renderização no cliente.

O snapshot só é usado quando não existe estado anterior de catálogo/comércio, sessão da aba ou controles de rede dos testes. URLs com filtros não recebem o HTML padrão. Dados persistidos, outras abas e cenários de lentidão/erro continuam consultando o estado atual pela API. O snapshot não autoriza compras: cotação, sessão, estoque e pedidos continuam sendo validados pelo transporte normal.

MSW inicia depois do primeiro commit do React. Axios e a criação do cliente Socket.IO aguardam uma promessa compartilhada de prontidão; requisições canceladas durante essa espera não são enviadas. Após a inicialização, as consultas públicas são revalidadas por REST. O cliente Socket.IO continua sendo importado depois da instalação dos interceptors. Atributo `data-transport-ready` no documento permite esperar esse estado sem pausas arbitrárias nos testes.

Os presets Lighthouse, as metas, os assets e os mocks permanecem habilitados. A mesma revisão e o mesmo build atendem usuários, testes e auditorias; não há detecção de Lighthouse.

## Consequências e validação

O HTML de entrada cresce por conter variantes públicas estáticas. Novos pontos de entrada pré-renderizados exigem ampliar explicitamente o renderer; páginas privadas permanecem fora desse processo. O build falha se as rotas REST ou a renderização pública falharem e encerra servidor MSW e loader Vite em `finally`.

`startup.e2e.ts` bloqueia os módulos JavaScript, verifica o conteúdo público e depois libera os módulos para validar hidratação sem erros e revalidação REST. Os testes de armazenamento protegem cenários já persistidos. A suíte funcional cobre sessão, compra, concorrência e reconexão; comparações visuais não atualizam baselines automaticamente. Resultados finais ficam em `docs/audits/lighthouse/summary.json`.
