# Matriz de requisitos do desafio

Referência: `readme-github.md`. “Implementado” exige teste relacionado; relatórios de execução e pendências ficam nos documentos vinculados. Publicação não é considerada concluída por existir configuração.

| Requisito | Implementação/evidência | Situação |
| --- | --- | --- |
| React/TS/Router/Query/Axios/Tailwind/shadcn | package.json, src/features, src/core | Implementado |
| MSW + cliente Socket.IO efetivo | mocks.e2e, network.test, commerce-realtime.test | Implementado |
| Busca/filtros/ordenação/paginação/histórico | catalog-state.e2e, network.test | Validado: E2E completo sem falhas |
| Detalhe direto, ausente, edições e quantidade | home.e2e, nft-mobile.e2e | Implementado |
| Cadastro/login/logout/expiração/isolamento | login.e2e, session.e2e, auth-tab-session.test | Implementado |
| Favoritos otimistas/rollback/identidade | commerce.e2e, commerce-network.test | Implementado |
| Carrinho/refresh/merge/cupons | commerce.e2e, cart-provider.test | Implementado |
| Cotação precisa/revisão/carteira | checkout.e2e, checkout-network.test | Implementado |
| Compra/recibo/recusa/idempotência/timeout | payment.e2e, checkout.e2e, checkout-network.test | Implementado |
| Perfil/avatar/senha/carteiras/validações | profile.e2e, wallets.e2e | Implementado |
| Preço/estoque via Socket.IO e aviso | realtime.e2e, checkout.e2e | Validado: E2E completo sem falhas |
| Eventos antigos/duplicados/reconexão/pedido pendente | realtime.e2e, commerce-realtime.test | Validado: E2E completo sem falhas |
| Concorrência entre abas e estoque uma vez | realtime.e2e, checkout-network.test | Implementado |
| Erro/lentidão/fora de ordem/skeleton/retry | catalog-state.e2e, network-controls.test | Validado: E2E completo sem falhas |
| Teclado/foco/formulários/axe/zoom | responsive.e2e, login.e2e, payment.e2e | Validado: E2E completo sem falhas |
| Responsividade 390/768/1440 | responsive.e2e, marketplace.visual | Validado: E2E completo sem falhas |
| 12 baselines de início/detalhe/carrinho/pagamento | playwright.visual.config.ts | 12 baselines revisadas e 12 comparações aprovadas |
| HTML público antes dos módulos/hidratação/estado salvo | startup.e2e, can-use-public-snapshot.spec, axios-adapter.spec | Validado: hidratação sem erros e transporte protegido |
| Lighthouse: 12 medições, metas e métricas | lighthouse.config.mjs, scripts/lighthouse.mjs | 12 auditorias aprovadas: Performance mobile 94/98 e desktop 100/100; demais metas aprovadas |
| Contratos/cache/retries/concorrência/limites | ARCHITECTURE.md, docs/API_CONTRACTS.md, ADRs | Documentado |
| Checkout limpo e lockfile reproduzível | docs/VALIDATION.md | Instalação congelada/checks/build/preview/smoke reproduzidos; hash igual ao auditado |
| Deploy, URL pública e refresh de rotas | vercel.json, docs/DEPLOYMENT.md | Publicado na Vercel; rota `/payment` conferida; roteiro das demais rotas documentado |
