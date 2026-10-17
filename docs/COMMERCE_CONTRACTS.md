# Contratos de comércio — base aprovada na etapa 1

Este documento especifica a integração das etapas 2–5. Favoritos, carrinho, cotação, conexão e pedidos estão implementados até a etapa 4. Eventos de pedidos e avisos entre abas estão implementados na etapa 5. O checkout usa `/orders`; o POST legado `/activity/purchases` está desativado no ambiente principal. Não existe conexão blockchain real.

## Convenções e propriedade

Base `/api`. Todos os recursos usam Axios, schemas Zod nas bordas e repositories injetados. Identificadores de carrinho, cotação, conexão, pedido e tentativa são UUIDs. NFTs/edições mantêm os identificadores atuais. Dinheiro é string decimal não negativa com até 18 casas; cálculos usam wei/BigInt. Quantidades são inteiras positivas; versões são inteiros positivos crescentes.

A sessão determina a conta; nenhum endpoint aceita `userId` para escolher outro proprietário. Recursos alheios retornam 404. Ausência/expiração de sessão retorna 401; operação proibida retorna 403. O carrinho visitante usa `X-Guest-Cart-Id` gerado e persistido por aba, sem acesso a carrinhos autenticados. Login, favorito, cotação, conexão e pedido exigem sessão. As sessões são independentes por aba desde a etapa 2.

Erros seguem `{ code, message, fieldErrors? }`, conforme o schema genérico existente. Entrada inválida retorna 422; recurso inexistente 404; mudança de estado/conflito 409; indisponibilidade transitória 503. Não haverá retry automático de mutations de compra.

## Favoritos — etapa 3 implementada

| Método | Endpoint | Corpo / resposta |
| --- | --- | --- |
| GET | `/favorites` | `Favorites` |
| PUT | `/favorites/:nftId` | Sem corpo → `Favorites` |
| DELETE | `/favorites/:nftId` | Sem corpo → `Favorites` |

`Favorites = { userId, version, nftIds: string[] }`, sem duplicatas. PUT/DELETE são idempotentes; NFT desconhecido retorna 404. Query `['favorites', userId]`, privada. Atualização otimista cancela a consulta, captura snapshot, aplica a intenção e faz rollback no erro. A resposta/invalidação reconcilia o cache sem permitir que resposta de outra conta o altere.

## Carrinho — etapa 3 implementada

| Método | Endpoint | Corpo / resposta |
| --- | --- | --- |
| GET | `/cart` | `Cart` |
| POST | `/cart/items` | `{ nftId, editionId, quantity }` → `Cart`; soma à quantidade existente |
| PATCH | `/cart/items/:nftId/:editionId` | `{ quantity }` → `Cart`; substitui a quantidade |
| DELETE | `/cart/items/:nftId/:editionId` | Sem corpo → `Cart` |
| PUT | `/cart/coupon` | `{ code }` → `Cart` |
| DELETE | `/cart/coupon` | Sem corpo → `Cart` |
| POST | `/cart/merge` | `{ guestCartId }` → `{ cart, adjustments }`; exige sessão |

`Cart = { id, userId: UUID | null, version, items: CartItem[], couponCode: string | null, totals }`. `CartItem` conserva os campos atuais; nomes, imagens, preços e disponibilidade vêm do catálogo, nunca são aceitos do cliente como autoridade. O mesmo par NFT/edição não aparece duas vezes. Adição/edição acima da disponibilidade retorna `INSUFFICIENT_STOCK` (409). Remover item já ausente não falha.

Merge soma quantidades, limita ao estoque e devolve os ajustes `{ nftId, editionId, requestedQuantity, availableQuantity }`. O carrinho visitante é consumido, portanto repetir o merge não soma novamente. Cupons distintos preservam o da conta; o cupom visitante é incorporado apenas se a conta não tiver outro e ele continuar válido.

Cupom é normalizado para maiúsculas. Fixtures: `KURIO10` aplica 10% sobre o subtotal; desconto em wei arredondado para baixo. `EXPIRADO` retorna `COUPON_EXPIRED` (422), qualquer outro código retorna `COUPON_INVALID` (422). Uma falha não remove o cupom válido anterior. Taxa de rede não recebe desconto. `totals = { subtotalEth, discountEth, estimatedFeeEth, totalEth }` é calculado pelo handler e transportado em strings decimais. A compra demonstrativa também recalcula e salva o desconto no snapshot; cotação com revisão explícita está implementada na etapa 4.

Queries `['cart', userId]` ou `['cart', guestCartId]`, invalidadas após mutations e mudanças de catálogo relevantes. Carrinho autenticado persiste por conta, visitante por aba. Logout oculta o carrinho privado e inicia um carrinho visitante vazio.

## Cotação — etapa 4 implementada

| Método | Endpoint | Corpo / resposta |
| --- | --- | --- |
| POST | `/quotes` | `{ cartId, cartVersion, network, previousQuoteId? }` → `Quote` |
| GET | `/quotes/:id` | `Quote` |
| POST | `/quotes/:id/accept` | Sem corpo → `Quote` revalidada |

`Quote = { id, cartId, cartVersion, userId, network, pricingVersion, createdAt, status, items, nftVersions, couponCode, totals, issues }`.

- `status`: `valid`, `review-required` ou `unavailable`.
- `totals`: `{ subtotalEth, discountEth, estimatedFeeEth, totalEth }`; `total = subtotal - desconto + taxa`, desconto não pode superar subtotal.
- `nftVersions`: mapa NFT → versão. `pricingVersion` identifica a política de taxa/desconto usada.
- `issues`: `{ code, nftId?, editionId?, message }`, com `PRICE_CHANGED`, `QUANTITY_ADJUSTED`, `SOLD_OUT` ou `COUPON_EXPIRED`.

Criar/revalidar recalcula catálogo, estoque, cupom e taxa. Alteração relevante exige revisão; edição esgotada impede envio. Aceitação é explícita: valida novamente o mesmo snapshot e só retorna `valid` se continuar atual e disponível. Nenhuma resposta alterada dispara compra automaticamente. Nova mudança durante a aceitação exige nova revisão. As cotações anteriores permanecem snapshots; GET não as torna atuais silenciosamente.

## Conexão de carteira — etapa 4 implementada

| Método | Endpoint | Corpo / resposta |
| --- | --- | --- |
| POST | `/wallet-connections` | `{ walletSlot, network, provider }` → `WalletConnection` |
| GET | `/wallet-connections/:id` | `WalletConnection` |
| DELETE | `/wallet-connections/:id` | Conexão atualizada como `disconnected` |

`WalletConnection = { id, userId, walletSlot, network, provider, walletAddress, status, version }`. Slot: `primary`/`secondary`; rede: `ethereum`/`polygon`/`solana`; provider: `metamask`/`coinbase`/`walletconnect`; status: `connected`/`refused`/`disconnected`. O endereço é resolvido da carteira cadastrada. Carteira ausente ou rede incompatível retorna 422. Recusa simulada é uma resposta com `status: refused`; não habilita compra. Nenhum endereço ou sessão de outra conta pode ser usado.

## Pedidos e recibos — etapa 4 implementada

| Método | Endpoint | Corpo / resposta |
| --- | --- | --- |
| POST | `/orders` | `{ quoteId, connectionId, collector }` + `Idempotency-Key` UUID → `Order` |
| GET | `/orders` | `Order[]`, mais recentes primeiro |
| GET | `/orders/:id` | `Order` |
| GET | `/orders/:id/receipt` | Pedido `confirmed`; pendente/recusado retorna 409 |

`collector = { displayName, username, email, profileName, ensName, referralCode, note }`, validado no servidor. Campos de perfil/carteira não são atualizados implicitamente pela compra.

Base do pedido: `{ id, userId, attemptId, quoteId, connectionId, version, createdAt, updatedAt, snapshot }`. `snapshot` contém itens, totais, coletor, endereço, provider e rede. Estados discriminados:

- `pending`: acrescenta `resolveAt`.
- `confirmed`: acrescenta `confirmedAt` e `transactionHash` visual (`0x` + 64 hexadecimais).
- `rejected`: acrescenta `rejectedAt` e `rejection: { code, message }`. Motivos: `PAYMENT_REFUSED`, `INSUFFICIENT_STOCK`, `QUOTE_CHANGED`, `WALLET_DISCONNECTED`.

Pedido novo retorna 201; repetição idêntica retorna 200 e o mesmo pedido. A chave é isolada por conta e vinculada ao conteúdo canônico integral da requisição; conteúdo diferente retorna `IDEMPOTENCY_CONFLICT` (409). Falha antes da criação não consome a chave. Após criação, timeout nunca cria outro pedido quando a mesma tentativa é reenviada.

Criação exige cotação aceita e atual, carteira conectada, rede compatível e sessão válida. Cotação desatualizada retorna `QUOTE_CHANGED` (409). Pedido pendente não reserva estoque; confirmação verifica a disponibilidade sob bloqueio, grava pedido/estoque/idempotência em uma operação e remove apenas as quantidades compradas. Em disputa pela última unidade, somente um pedido confirma. Confirmação/recusa são terminais. Snapshot confirmado é imutável e alterações futuras no catálogo não modificam o recibo.

Tentativa, corpo da requisição e id do pedido são preservados por conta na aba antes do envio. Refresh/reconexão consulta o pedido existente. O processamento simulado usa `resolveAt` persistido para recuperar pendências sem depender exclusivamente de timers de uma aba aberta. Atividade projeta os pedidos confirmados; compras antigas vinculadas a contas são migradas uma vez, sem vincular histórico visitante a uma conta.

## Eventos e concorrência — etapa 5 implementada

`order.updated = { eventId, type: 'order.updated', resourceId, userId, version, occurredAt, data: Order }`. Identidade, usuário e versão do envelope devem corresponder ao pedido. Manter o envelope de `nft.updated` existente, com `data: Nft` e versão crescente.

O store de comércio compartilhado já é a fonte única de catálogo/estoque/pedidos/idempotência. Web Locks serializam mutations entre abas, sempre relendo a persistência sob bloqueio. BroadcastChannel comunica mudanças aos mocks das outras abas após commit; os mocks entregam eventos via Socket.IO. O canal não altera diretamente componentes nem caches Query. Pedidos privados são filtrados pela identidade ativa antes de emitir. Eventos não trafegam senhas, hashes de credenciais ou dados de sessão.

Cliente compara versão com REST/cache, ignora duplicatas/versões antigas e reconcilia recursos ativos ao reconectar. Encerramento de sessão descarta listeners privados e respostas obsoletas. Estados confirmados/recusados não regridem. O caso de duas abas é testado em duas páginas do mesmo contexto Playwright; contextos separados não compartilham armazenamento.

## Cenários preparados e implantação gradual

`src/mocks/commerce-scenarios.ts` define resultados/tempos fixos para confirmação, recusa, timeout após criação e disputa da última unidade. São selecionáveis por `POST /__mock/checkout`; não são valores aceitos por `/__mock/reset`. As fixtures de cupom já estão funcionais desde a etapa 3.

Os cenários de catálogo existentes (`default`, `empty`, `slow`, `server-error`, `network-error`, `out-of-order`) continuam funcionais. O reset restaura catálogo, contas de demonstração e recursos de comércio, invalida as sessões e avisa as outras abas. Schemas descrevem validação; o contrato só é considerado implementado quando há handler e teste correspondente.


## Persistência e falhas — etapa 3

`kurio:mock-commerce:v1` mantém carrinhos, favoritos e marcações de merge no localStorage, vinculados à geração `sessionEpoch` do store de contas. Reset invalida esse estado; contas expiradas deixam de disponibilizar seus recursos. O UUID visitante é recuperado do sessionStorage (`kurio:guest-cart-id:v1`) e enviado por `X-Guest-Cart-Id`; cada aba possui seu identificador. Ao encerrar a sessão, a aba gera um novo UUID, sem entregar o carrinho da conta ao visitante. Um identificador já consumido não pode incorporar os mesmos itens novamente a outra conta.

`X-Expected-User` é uma precondição de identidade; não escolhe o proprietário. Para requisições iniciadas como visitante, o valor é `guest`. Se a sessão mudar antes do processamento, o handler retorna 401. Favoritos não fazem retry automático. O cliente permite uma mutation de favoritos por conta de cada vez para que o rollback não sobrescreva outra intenção. Carrinho usa fila por proprietário, aguarda a resposta, conserva o cache em falhas e reconcilia por REST; adicionar aguarda persistência antes de navegar. Mudança de conta remove caches privados e respostas atrasadas não repopulam outra identidade.

Os handlers de comércio releem o estado dentro de Web Locks quando disponíveis; em ambientes sem essa API, a fila é local à instância. Isso protege as operações atuais de carrinho/favoritos. A etapa 4 adiciona a transação conjunta de pedidos/estoque/idempotência. Eventos entre abas e reconciliação Socket.IO foram implementados na etapa 5.

`POST /api/__mock/commerce/failure` recebe `{ resource: "cart" | "favorites", delayMs?: 0..5000, status?: 0 | 503 }`. A próxima mutation do recurso consome a condição; padrão 503, sem escrita. Status 0 introduz apenas atraso. Leituras não consomem a falha. O controle existe somente nos mocks e permite observar otimismo/rollback e retry manual sem resetar a sessão.


## Execução e recuperação — etapa 4

`POST /quotes` aceita `previousQuoteId` opcional para comparar o que o usuário viu com a nova cotação. `cartVersion` desatualizada retorna `CART_CHANGED` (409). GET nunca modifica snapshots. `POST /quotes/:id/accept` retorna um novo snapshot: `valid` e aceito somente se os valores revisados continuarem atuais. Ajustes de quantidade/cupom são aplicados ao carrinho apenas nesse aceite. Uma alteração durante o aceite retorna outra cotação para revisão, sem criar pedido.

O cliente salva `{ key, input, orderId }` em `kurio:order-attempt:v1:<userId>` antes de enviar. Sem persistência inicial não envia. Recuperação consulta o id conhecido ou lista pedidos da própria conta procurando a mesma chave; eventual reenvio usa exatamente a mesma tentativa. Queries privadas usam usuário na chave e `AbortSignal`. Não há retry automático indiscriminado de compra. Polling de pendentes usa REST (500 ms), pausa em erro e permite recuperação manual. Foco/online reconciliam a consulta; reconexão Socket.IO também reconcilia as consultas ativas desde a etapa 5.

O comprovante abre `/payment/confirmation?orderId=<UUID>` e consulta `/orders/:id/receipt`. A ausência de id pode usar `kurio:last-order:v1:<userId>`. Pedido pendente/recusado não exibe recibo. Atividade consulta pedidos; o POST legado de atividades retorna 410 no ambiente principal.

### Controle determinístico dos mocks

`POST /api/__mock/checkout`, apenas no ambiente de mocks, aceita:

| Campo | Valores / efeito |
| --- | --- |
| `scenario` | `confirmed`, `refused`, `timeout-after-create`, `last-unit` |
| `resolveAfterMs` | 0 a 60000; define `resolveAt` de novos pedidos; padrão 1000 |
| `outcome` | `confirmed` ou `rejected`; sobrescreve o resultado de novos pedidos |
| `timeoutAfterCreation` | Persiste o pedido e devolve 504; repetir a chave recupera o pedido |
| `refuseConnection` | Cria a conexão com status `refused` |
| `expireCoupon` | Invalida/restaura `KURIO10` para testar revalidação do desconto |
| `pricingVersion` | Inteiro positivo; permite testar mudança de política de taxa/preço |

As regras são persistidas até novo controle/reset; pedidos já criados conservam o resultado/tempo escolhido, exceto revalidações de conexão, estoque, preço, cupom e política. `last-unit` prepara `nft-001`, `edition-one`, com uma unidade. Pedidos pendentes não reservam estoque. O store grava confirmação/estoque/idempotência/carrinho conjuntamente; falha na gravação mantém o estado anterior.

A [ADR 0004](ADRs/0004-cotacao-carteira-e-pedidos-recuperaveis.md) detalha migração, concorrência e recuperação. Desde a etapa 5, Socket.IO entrega notificações entre abas por meio do canal interno dos mocks.


## Política de entrega — etapa 5

O canal dos mocks `kurio:commerce:v1` leva somente `{ epoch, nftIds, orderIds }`; cada receptor valida a geração, lê o registro persistido e emite os snapshots atuais pelo seu servidor Socket.IO simulado. Não há callbacks de canal para componentes ou Query. A conexão captura a conta e a emissão privada confere conta capturada, sessão atual e proprietário. Não há escolha de proprietário por payload de autenticação do cliente.

Assinaturas descartam versões repetidas/antigas e eventos de outra conta. Pedidos terminais não regridem. A reconciliação compara cache REST, cancela respostas em andamento e invalida recursos afetados. Conectar/reconectar consulta novamente recursos ativos para recuperar notificações perdidas. Assinaturas/canais/listeners/heartbeats são encerrados no ciclo correspondente. BroadcastChannel e Web Locks exigem a mesma origem/perfil; sem Web Locks o fallback não garante exclusão entre abas.

GET do carrinho mantém a quantidade quando ainda cabe na disponibilidade; limita excedentes ao estoque positivo e informa o ajuste na tela. Uma edição esgotada permanece identificável para remoção, com aviso e checkout bloqueado. O evento também revalida a cotação, preservando o aceite explícito de mudanças.

`POST /__mock/socket` suspende/restaura o transporte da aba via `{ connected: false | true }`. `POST /__mock/replay-order` aceita o envelope validado, sem contornar o filtro privado. O roteiro com Alice/Bruno está no README e a [ADR 0005](ADRs/0005-eventos-socket-io-entre-abas.md) documenta o fluxo e seus limites.
