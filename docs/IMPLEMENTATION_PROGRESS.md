# Adequação ao desafio — entregas por etapa

## Etapa 1 — concluída

- Corrigida a formatação que bloqueava o lint.
- Estabilizados os sete E2E que divergiam dos layouts aprovados. Mobile mantém os acessos de conta disponíveis no desenho atual; detalhe/carrinho/pagamento compactos não receberam novos botões apenas para satisfazer seletores antigos.
- Padronizados repositories de catálogo e mercado com interfaces `I*` e sufixos de arquivo previstos nos guias.
- Preparados modelos puros, interfaces, schemas e DTOs de favoritos, carrinho, cotação, conexão de carteira e pedidos. Estado de pedido discriminado e envelope `order.updated` validados. Schemas são verificados pelo TypeScript contra os modelos de domínio.
- Avaliações/metadados do NFT vêm do endpoint de detalhe. Contagens dos filtros vêm de `/catalog/facets`. Conteúdo editorial estático foi separado de fixtures e componentes não importam mocks.
- Preparadas AliceDemo e BrunoDemo, com hashes PBKDF2 persistidos; seed preserva contas anteriores e reset restaura fixtures.
- Preparadas definições determinísticas de cenários de comércio, sem apresentá-las como endpoints já disponíveis.

Verificação da entrega: lint, typecheck, build com mocks, 65 testes Vitest e suíte E2E completa (57 passaram; 9 ignorados por viewport; zero falhas). O build ainda emite o aviso conhecido de chunks acima de 500 kB; performance será tratada na etapa 7.

Contratos e limites de implementação: [COMMERCE_CONTRACTS.md](COMMERCE_CONTRACTS.md). Endpoints funcionais: [API_CONTRACTS.md](API_CONTRACTS.md).

## Etapa 2 — concluída

- Separadas contas compartilhadas no localStorage e sessão por aba no sessionStorage. Migração preserva contas/perfis/carteiras e invalida a sessão compartilhada anterior.
- Rotas de perfil, carteiras, checkout, confirmação e atividades protegidas, com retomada somente para destinos internos permitidos.
- Compra e histórico exigem sessão também nos handlers; o checkout consulta a sessão novamente antes de enviar.
- Expiração oculta o conteúdo privado e permite retomar formulário/carrinho pela mesma conta, inclusive após refresh. Outra conta não recebe o contexto; logout explícito o limpa.
- Favoritos exigem login e seu estado visual não atravessa identidades. Queries/mutations privadas antigas são removidas e o comprovante é limpo na troca de usuário.
- Criados testes com duas páginas no mesmo contexto e controle de expiração exclusivo dos mocks.

Validação: lint, tipos, build com mocks, 72 testes Vitest e suíte E2E completa (67 passaram, 9 ignorados por viewport, zero falhas). Decisões e limites: [ADR 0002](ADRs/0002-sessao-por-aba-e-retomada-checkout.md).

## Etapa 3 — concluída

- Favoritos autenticados persistidos via API e compartilhados entre catálogo e detalhe, com cancelamento, snapshot, atualização otimista, rollback e reconciliação.
- Carrinho REST com persistência por conta e identificação de visitante por aba; navegação aguarda a adição. Logout inicia visitante vazio, sem apagar o carrinho salvo da conta.
- Merge repetível soma edições, limita ao estoque e informa ajustes; consumo persistido impede duplicar ou entregar os mesmos itens a outra conta.
- Cupons aplicados/removidos persistem. Código inválido/expirado mantém o anterior; `KURIO10` aplica 10% sobre o subtotal. Valores da API calculados em wei, com desconto também salvo no snapshot demonstrativo.
- Queries/mutations isoladas por proprietário e proteção contra respostas atrasadas. Mutations sem retry automático, carrinho serializado e controle de falhas dos mocks para testes.
- Atualizados README, contratos, arquitetura e [ADR 0003](ADRs/0003-favoritos-carrinho-e-cupons.md).

Validação: pnpm 11.5.2; lint, tipos e build com mocks; 75 testes Vitest e suíte E2E completa (73 passaram, 9 ignorados por viewport, zero falhas). Mantido o aviso conhecido de bundle acima de 500 kB para a etapa 7. Não há novos fluxos de cotação/pedidos ou eventos de estoque entre abas nesta entrega.

## Etapa 4 — concluída

- Checkout usa cotação da API, revalida valores e exige aceite explícito de mudanças; cotações anteriores permanecem snapshots.
- Conexão simulada da carteira cadastrada, com rede compatível, recusa e desconexão; não há alteração implícita de perfil/carteiras.
- Criados endpoints de pedidos e recibo, com idempotência por conta, corpo canônico integral e estados `pending`, `confirmed` e `rejected`.
- Tentativa salva antes do POST e recuperada por id/chave após timeout, refresh ou retorno online. Nova compra fica bloqueada enquanto o resultado for desconhecido.
- Catálogo/estoque/pedido/idempotência/carrinho confirmados no mesmo commit sob bloqueio. Estoque baixa uma vez; apenas as quantidades compradas saem do carrinho. Concorrência pela última unidade coberta por integração.
- Comprovante carrega o snapshot confirmado pela API e sobrevive ao refresh. Atividades consultam pedidos; compras anteriores de contas migradas uma vez sem nova baixa de estoque, sem incorporar histórico visitante.
- Documentados cenários determinísticos, recuperação e limites na [ADR 0004](ADRs/0004-cotacao-carteira-e-pedidos-recuperaveis.md), README, contratos e arquitetura.

Validação: pnpm 11.5.2, lint, tipos, build com mocks, 88 testes Vitest e suíte E2E completa (83 passaram, 9 ignorados por viewport, zero falhas). O aviso de bundle acima de 500 kB permanece para a etapa 7. Eventos de pedidos/estoque e avisos entre abas continuam na etapa 5.

## Etapa 5 — concluída

- Commits de comércio notificam os mocks das outras abas por BroadcastChannel somente depois de persistir; o canal contém apenas geração/identificadores, sem payload privado.
- Cada mock relê o store compartilhado e entrega `nft.updated`/`order.updated` pelo servidor Socket.IO simulado. Componentes e caches não assinam BroadcastChannel.
- Servidor filtra pedidos por identidade capturada, sessão atual e proprietário. Cliente valida conta/versão e descarta duplicatas/versões antigas; estados terminais não regridem.
- Eventos reconciliam catálogo, detalhe, carrinho, cotação, pedidos e atividades por REST, cancelando consultas concorrentes. Reconexão recupera eventos perdidos.
- Carrinho informa esgotamento e bloqueia checkout. Estoque ainda suficiente mantém a quantidade; excedente ao estoque positivo é ajustado com aviso.
- Playwright com duas páginas no mesmo contexto valida compra de B esgotando o carrinho de A, ajuste parcial, reconexão e disputa concorrente pela última unidade.
- Canais, listeners, heartbeats e assinaturas encerrados no teardown/HMR; roteiro e limites documentados na [ADR 0005](ADRs/0005-eventos-socket-io-entre-abas.md) e no README.

Validação: pnpm 11.5.2, lint, tipos, build com mocks, 90 testes Vitest e suíte E2E completa (91 passaram, 9 ignorados por viewport, zero falhas). O aviso conhecido de bundle acima de 500 kB permanece para a etapa 7. A simulação exige mesma origem/perfil; exclusão entre abas depende de Web Locks.

## Etapa 6 — fechamento funcional e evidências

- Avisos separados de preço/estoque, atualização em segundo plano preservando conteúdo e erro recuperável.
- Shimmer compartilhado com movimento reduzido no catálogo/detalhe/resumo do carrinho; controles de rede e bloqueios por aba para testes determinísticos.
- Busca/filtros/ordenação/página/aba sincronizados à URL e histórico, sem rascunho reativado ao avançar. Ordenação mobile e navegação de conta em tablet acessíveis.
- Cobertura de respostas canceladas, falhas de mutation com troca de conta, replays de eventos, pedido pendente desconectado e concorrência. Logout coordena navegação no provider persistente; notificações não interceptam compra.
- Axe nas telas obrigatórias em 390/768/1440, sem violações críticas/sérias; teclado, foco e zoom cobertos.
- 12 baselines de início/detalhe/carrinho/pagamento geradas e revisadas. As 12 comparações visuais passaram sem atualizar snapshots; acessibilidade/foco/zoom foram reconferidos em seis testes após estabilizar o CSS. Reprodução limpa aprovada: instalação congelada, lint/tipos/94 testes, build/preview e dois smokes; hash igual ao build auditado. Evidências em VALIDATION.md.

Validação funcional: lint, tipos, 94 testes Vitest em 25 arquivos; Playwright completo com 113 aprovados, 9 ignorados por variante de viewport, zero falhas. [Relatório HTML](audits/playwright/index.html).

## Etapa 7 — auditoria e publicação concluídas

- Otimizadas artes com WebP responsivo e fontes locais; rotas/modais/menus carregam sob demanda; bootstrap antecipa a rota inicial e baixa aplicação/mocks em paralelo. Transporte Socket.IO inicia após MSW sem bloquear a primeira renderização.
- Build sem o aviso anterior de chunks acima de 500 kB.
- Lighthouse executado 12 vezes com relatórios HTML/JSON, versões/ambiente e medianas. Performance mobile 94/98 e desktop 100/100; todas as metas de acessibilidade, boas práticas e SEO também foram atingidas. Evidências e condições estão em [auditorias](audits/README.md).
- Arquitetura consolidada na raiz, ADRs, matriz de requisitos, comandos e configuração Vercel documentados. O deploy está publicado em [teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app](https://teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app); a rota `/payment` foi conferida.
- Para novas revisões, publicar o build validado e repetir o roteiro de rotas públicas de [DEPLOYMENT.md](DEPLOYMENT.md).
