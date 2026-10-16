# ADR 0003 — Favoritos e carrinho pela API simulada

Status: aceita. Data: 2026-10-16. Complementa a ADR 0002.

## Contexto

Favoritos e carrinho eram estado visual temporário. O teste exige persistência, isolamento por usuário e recuperação de falhas, sem API real. É necessário preservar o desenho e preparar a futura integração de cotação/pedidos.

## Decisão

Favoritos e carrinho passam por View → ViewModel → usecase → repository HTTP injetado → MSW. Entidades e cálculos são puros. Schemas Zod validam requisições e respostas; metadados/preços são reconstruídos pelo handler a partir do catálogo. Quantidades são inteiras, e ETH é transportado como string e calculado em wei.

O store `kurio:mock-commerce:v1` mantém favoritos e carrinhos separados por proprietário no localStorage. O identificador opaco do visitante fica em `kurio:guest-cart-id:v1` no sessionStorage. A sessão continua por aba, conforme ADR 0002. Reset invalida comércio pela geração da autenticação; contas expiradas perdem acesso aos recursos. A simulação permanece local ao navegador/origem, com dados fictícios.

Login incorpora o visitante via `/cart/merge` antes de apresentar o carrinho autenticado. Edições iguais somam quantidades até o estoque; ajustes são informados. A marcação persistida de consumo impede repetir a soma em refresh, retry ou outra conta. Cupom válido da conta tem precedência; visitante só transfere um cupom válido quando a conta não possui outro. Logout gera outro identificador visitante e oculta o carrinho privado; a conta recupera seu carrinho no próximo login. O rascunho de pagamento continua sendo limpo no logout.

Favoritos compartilham a query por conta entre catálogo e detalhe. O hook cancela consultas concorrentes, captura snapshot, aplica a intenção otimista e restaura em falha, reconciliando por REST. Uma mutation por conta de cada vez evita que um rollback sobrescreva outro toggle. Carrinho aguarda persistência antes de navegar ou atualizar os valores, serializa mutations por proprietário e permite retry manual. Requisições carregam precondição de identidade e callbacks conferem a conta ativa antes de gravar cache.

Os handlers releem o store dentro de Web Locks quando disponíveis; o fallback serializa somente a instância. A transação conjunta de pedido/estoque/idempotência e o transporte de eventos entre abas permanecem para as etapas seguintes.

`KURIO10` aplica 10% do subtotal, arredondando para baixo em wei. Taxa não recebe desconto. Inválido/expirado retorna 422 sem substituir o cupom anterior. A resposta do carrinho inclui totais; a compra demonstrativa recalcula e salva desconto/total. A cotação com revisão explícita será introduzida na etapa 4.

## Validação e limites

Integração Axios/MSW cobre persistência, autorização, metadados canônicos, limite de estoque, merge repetível, cupons, falhas e total do snapshot. Playwright cobre favoritos compartilhados, rollback, refresh, merge, logout e isolamento de contas nos layouts desktop/mobile. O controle exclusivo dos mocks `/__mock/commerce/failure` atrasa/falha a próxima mutation sem resetar a sessão.

Carrinho não reserva estoque. A compra ainda utiliza o endpoint demonstrativo de atividades; confirmação pendente/recusada, recuperação após timeout, limpeza transacional e disputa da última unidade pertencem às etapas 4–5. Não há sincronização automática entre dispositivos nem eventos de estoque entre abas nesta entrega.
