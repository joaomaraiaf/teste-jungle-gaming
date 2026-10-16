# ADR 0002 — Sessão por aba e retomada segura do checkout

Status: aceita. Data: 2026-10-16. Complementa a ADR 0001.

## Contexto

A avaliação precisa de duas contas distintas em duas abas do mesmo navegador. A sessão antiga era persistida junto das contas em localStorage, fazendo um login/logout afetar todas as abas. Checkout e pedidos também permitiam visitante, contrariando o enunciado. Precisamos preservar o contexto de compra sem revelar dados de uma conta a outra.

## Decisão

As contas, perfis, carteiras, hashes/salts e históricos continuam no registro compartilhado `kurio:mock-auth:v1` do localStorage. O payload passa a ter `schemaVersion: 2` e `sessionEpoch`, sem propriedade `session`. A migração valida e preserva registros anteriores, ignora a sessão antiga e grava o novo formato. O nome da chave é mantido para migração transparente.

A sessão `{ userId, expiresAt, sessionEpoch }` fica em `kurio:mock-session:v1` no sessionStorage da aba. Contas duram sete dias; sessões duram até 24 horas, limitadas pela validade da conta. Refresh recupera a própria sessão. Login/logout não alteram sessões de outras abas. Reset global gera uma nova época e invalida sessões antigas em todas as abas na próxima consulta. Alterações compartilhadas notificadas por `storage` provocam consulta da sessão da própria aba, nunca cópia de outra sessão.

Os handlers recebem os dois armazenamentos por injeção. Testes podem usar Maps separados e relógio controlado. O contrato público de `/auth/session` não muda. O mock continua sendo simulação local, sem autenticação de produção.

## Proteção e retomada

`/profile`, `/wallets`, `/payment`, `/payment/confirmation` e `/activity` exigem sessão no Router. O login retoma apenas destinos internos de uma allowlist. Expiração durante a navegação oculta o conteúdo privado e abre o modal sem descartar a rota. Cancelar o modal mantém uma tela de acesso, sem expor o conteúdo anterior.

O checkout verifica a sessão pela API imediatamente antes da compra. Os handlers de atividades também exigem sessão e conferem se ela permaneceu a mesma durante o processamento. O cliente envia `X-Expected-User` para descartar tentativas originadas por uma identidade anterior; o header não autoriza a operação nem escolhe outro proprietário. Pedidos/históricos de visitante deixam de ser acessíveis. Favoritos solicitam login e seu estado visual não atravessa identidades; persistência e atualização otimista ficam para a etapa 3.

Um contexto temporário do carrinho fica em `kurio:checkout-cart:v1` no sessionStorage, marcado com o proprietário. Itens de visitante são adotados no login. Na expiração, o contexto da conta fica oculto e pode ser retomado pela mesma conta. Login com outra identidade descarta esse contexto; logout explícito o limpa. Isso sustenta refresh durante o login, mas não implementa o carrinho REST/merge remoto da etapa 3.

O formulário incompleto é salvo por conta em `kurio:payment-draft:v1:<userId>`, no sessionStorage, por até sete dias. Campos ainda inválidos também são preservados. A mesma conta pode retomar; outra não recebe os valores. Logout explícito e compra concluída removem o rascunho. Carteiras salvas não sobrescrevem um rascunho já existente na retomada mobile. Esses armazenamentos contêm apenas dados fictícios do teste; nunca guardam senha em claro.

Troca de identidade cancela/remove queries privadas antigas e remove suas mutations do cache, limpa o comprovante e reinicia a conexão Socket.IO. Respostas tardias de mutations conferem o proprietário antes de atualizar dados privados. Erros 401 dos recursos privados provocam nova consulta da sessão. Eventos de pedidos/subscriptions privadas ainda serão integrados na etapa 5.

## Verificação e limites

Testes de integração usam dois stores com contas compartilhadas e sessões separadas. Playwright usa duas páginas no mesmo contexto para validar contas distintas, refresh e logout independente. Também cobre bloqueio da API/rotas sem sessão, expiração antes do envio, restauração do formulário/carrinho e troca de conta sem expor o rascunho anterior.

O endpoint de controle `POST /api/__mock/auth/expire-session` expira somente a sessão da aba que o chamou, permitindo reproduzir o cenário. Ele existe apenas no ambiente de mocks. A compra ainda usa o endpoint demonstrativo de atividades; cotação, carteira conectada e ciclo pendente/confirmado/recusado serão implementados nas próximas etapas. A recuperação de um pedido já criado após refresh pertence à etapa 4.
