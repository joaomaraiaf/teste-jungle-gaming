# Contratos REST e eventos

O enunciado define recursos e comportamentos, sem fixar paths ou payloads. Os contratos abaixo foram definidos para esta solução. Schemas e DTOs do catálogo ficam em `src/features/catalog/data/`; o contrato genérico de erro HTTP fica em `src/core/api/`. A infraestrutura, catálogo, autenticação, favoritos e carrinho persistente com merge/cupons estão implementados. Endpoints e regras de comércio estão em [COMMERCE_CONTRACTS.md](COMMERCE_CONTRACTS.md). Cotação, conexão simulada e pedidos recuperáveis estão implementados na etapa 4. `order.updated`, avisos entre abas e reconciliação por REST na conexão estão implementados na etapa 5. Carteiras locais podem ser cadastradas para uso no formulário de pagamento. O perfil do colecionador também possui leitura e edição locais.

## REST implementado

Base: `/api` por padrão, configurável em `VITE_API_URL`.

| Método | Caminho | Resposta |
| --- | --- | --- |
| GET | `/health` | `{ status: "ok", mode: "mock", scenario }` |
| GET | `/nfts` | `{ data: Nft[], total, page, limit, lastPage }` |
| GET | `/nfts/:id` | `MarketNft` (`Nft` + `details`) ou 404 |
| GET | `/catalog/facets` | `{ collections, networks }` com contagens derivadas do catálogo |

Query de listagem: `page` (>= 1, padrão 1), `limit` (1–48, padrão 9), `search` (nome/artista), `minPriceEth` e `maxPriceEth` (limites decimais em ETH), `category` (`art`, `photography`, `gaming`), `network` (`ethereum`, `polygon`, `solana`), `collection` e `sort` (`newest`, `name-asc`, `price-asc`, `price-desc`). Filtros são combináveis. O filtro e a ordenação por preço usam o preço da primeira edição, comparado como unidade inteira (`BigInt`); empates têm desempate estável por id. Intervalos invertidos e outros parâmetros conhecidos inválidos retornam 422. Busca sem resultados e página além do total retornam `data: []`; `lastPage` é 0 no resultado vazio.

Exemplo de listagem: `GET /api/nfts?category=art&network=ethereum&minPriceEth=0.05&maxPriceEth=1.50&page=1&limit=9&sort=price-asc`.

NFT:

```json
{
  "id": "nft-001",
  "name": "GreenMint #001",
  "description": "NFT fictício para os cenários de demonstração.",
  "imageUrl": "/images/2986a7cb16d09de8970824d2dd58bf0bb021702c.png",
  "artist": "Luna",
  "collection": "Genesis",
  "category": "art",
  "network": "ethereum",
  "editions": [
    { "id": "standard", "name": "1/10", "priceEth": "0.01", "available": 10 },
    { "id": "edition-one", "name": "1/1", "priceEth": "2.01", "available": 1 },
    { "id": "edition-fifty", "name": "1/50", "priceEth": "0.01", "available": 50 },
    { "id": "edition-open", "name": "ABERTA", "priceEth": "0.20", "available": 100 }
  ],
  "version": 1,
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

Os 36 NFTs são fixtures provisórias para exercitar filtros/paginação. Cada NFT recebe um perfil de edições com combinações, preços e disponibilidade próprios; a lista não é igual para todos. As imagens são assets locais de demonstração em `public/images` e não representam conteúdo visual final. ETH trafega como string decimal não negativa, com até 18 casas. A comparação de preços usa unidades inteiras (`BigInt`), sem converter ETH para `Number`. Quantidades são inteiras.

Erro HTTP:

```json
{ "code": "NFT_NOT_FOUND", "message": "NFT não encontrado." }
```

O schema também reserva `fieldErrors: Record<string, string[]>` para validações de formulário futuras. Hoje há 404, 422, 503 e falha de conexão configurável. A tipagem não substitui a validação runtime.

## Evento implementado

Nome Socket.IO: `nft.updated`.

```text
{
  eventId: "nft.updated:nft-001:2",
  type: "nft.updated",
  resourceId: "nft-001",
  version: 2,
  occurredAt: "2026-01-01T00:00:01.000Z",
  data: Nft
}
```

O payload contém o snapshot do NFT. `data.id` e `data.version` devem corresponder ao envelope. O listener `subscribeNftUpdates` valida o payload e ignora versões repetidas/anteriores por recurso durante a assinatura; retorna uma função de unsubscribe. A integração Query compara versões conhecidas por REST, cancela consultas concorrentes e reconcilia recursos ativos ao conectar/reconectar.

## Transporte de demonstração

`socket.io-client` real, namespace padrão, `path: /socket.io`, transporte WebSocket nativo (export `WebSocket` do cliente). Os mocks usam `ws` do MSW e `toSocketIo` do binding 0.2.0. O MSW normaliza `/socket.io/` para `/` ao fazer matching; o handler registra a origem raiz em `ws.link`.

O import runtime do cliente é adiado até os mocks estarem ativos: Engine.IO captura o construtor global de WebSocket no import. A factory retorna o cliente desconectado; o provider gerencia connect/disconnect. Sem mocks e sem `VITE_SOCKET_URL`, a base não abre conexão Socket.IO.

O binding realiza o handshake; os mocks completam a simulação enviando heartbeat Engine.IO a cada 10 segundos e cancelando o timer ao fechar. Interrupção usa fechamento de transporte, permitindo a reconexão do Manager (backoff determinístico de 500ms até 2s). Nenhum servidor externo é iniciado ou acessado com a configuração padrão de demonstração.

Limitações: sem HTTP long-polling/upgrade, sem paridade completa de rooms/namespaces/broadcasting de um servidor Socket.IO. Não estamos testando infraestrutura real, perda física de pacotes ou latência de rede real. Apenas eventos JSON no namespace padrão são usados. `order.updated` usa a identidade capturada da sessão da aba no mock; o servidor verifica novamente o proprietário antes da entrega, e o cliente valida identidade/versão.

## Estado e cenários

O runtime de mocks mantém o mesmo store para REST e eventos. Uma alteração persiste o NFT antes de publicar o evento. Browser: `localStorage`, chave `greenmint:mocks:v1`; Node: storage injetável ou memória para isolamento. Schema inválido/JSON corrompido restaura fixtures conhecidas. Dados são locais a este navegador e origem; há sincronização entre abas da mesma origem/perfil via BroadcastChannel entre mocks e entrega por Socket.IO; navegadores/dispositivos diferentes não compartilham essa simulação.

Cenários: `default`, `empty`, `slow` (1500ms), `server-error` (503), `network-error` e `out-of-order` (500ms/20ms alternados). Condições de falha/latência afetam catálogo e detalhe; health e controles permanecem disponíveis. Contagem e timestamps das alterações são determinísticos.

Rotas de controle existem apenas quando MSW está ativo e não são APIs reais de produção:

| Método | Caminho | Corpo / resultado |
| --- | --- | --- |
| GET | `/__mock/status` | Conexões ativas e cenário |
| GET | `/__mock/state` | Snapshot do store simulado |
| POST | `/__mock/reset` | `{ "scenario": "default" }` (ou `{}`); restaura catálogo, contas de demonstração e estado de comércio, invalida sessões e encerra sockets |
| POST | `/__mock/nfts/:id` | `{ "editionId": "standard", "priceEth": "0.25", "available": 3 }`; preço ou disponibilidade obrigatório; devolve/publica evento |
| POST | `/__mock/replay` | Envelope válido de `nft.updated`; publica evento sem alterar REST, para duplicatas/versões antigas |
| POST | `/__mock/disconnect` | Interrompe conexões locais; 204; o cliente pode reconectar |

Para selecionar um cenário no console do navegador com a aplicação aberta:

```js
await fetch('/api/__mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'slow' }),
});
location.reload();
```

Recarregue após reset para limpar também o estado da interface e assinaturas/cache da execução anterior. Não use `curl` ou `page.request` esperando acessar o store do browser: o worker intercepta requests da página controlada. Os testes Node usam `setupServer` e a mesma factory/handlers. Controles não chamam setters/cache da aplicação; as atualizações passam pelo Socket.IO.

## Inicialização, testes e publicação

`startMocks` aguarda `worker.start()` antes da renderização. Um erro de bootstrap deixa uma mensagem recuperável na página, sem continuar silenciosamente para uma API real. Requisições não tratadas à API configurada falham em modo mock; assets da página não são interceptados por esse bloqueio.

Use `pnpm dev:mock`, `pnpm build:mock` e `pnpm preview:mock`. `.env.mock` é versionado com apenas configuração pública. Alternativamente, defina `VITE_MOCKS_ENABLED=true` no ambiente de build. `pnpm build` sem flag/modo não ativa os mocks. `preview` não muda flags de um bundle já construído; a escolha ocorre no build.

O worker gerado pelo CLI fica em `public/mockServiceWorker.js`, é copiado para `dist/` pelo Vite e não deve ser editado manualmente. O postinstall do MSW atualiza o worker no diretório registrado em package.json.

Na Vercel, use o build com mocks, sirva o worker como JavaScript e preserve os assets antes do fallback SPA. `vercel.json` configura esses requisitos. A aplicação está publicada em [teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app](https://teste-jungle-gaming-59kluuver-joaomaraiafs-projects.vercel.app/); procedimentos para validar rotas e futuras publicações estão em [DEPLOYMENT.md](DEPLOYMENT.md).

Testes de integração exercitam Axios → MSW e cliente Socket.IO → binding; cobrem filtros, erros, precisão decimal, duplicatas, versões antigas, reconexão e unsubscribe. E2E verifica inicialização dos mocks/conexão no build, persistência após refresh e reset em desktop/mobile, sem requests HTTP externos. As telas de catálogo e os fluxos locais de autenticação estão implementados; cotação, conexões simuladas e pedidos possuem testes REST/E2E; eventos entre abas estão cobertos na etapa 5.

## Autenticação local de demonstração

As chamadas passam pelo `apiClient` (Axios), repository e usecase da feature `auth`, até os handlers MSW. Sem um servidor de autenticação externo.

| Método | Caminho | Corpo / resposta |
| --- | --- | --- |
| POST | `/auth/signup` | `{ username, email, password }` → sessão (já conecta a conta) |
| POST | `/auth/login` | `{ email, password }` → sessão |
| GET | `/auth/session` | Sessão válida ou `null` para visitante/expirada |
| POST | `/auth/logout` | `{}` → 204; encerra a sessão, preservando a conta |

Sessão: `{ user: { id, username, email }, expiresAt }`. `expiresAt` é ISO UTC. E-mail é normalizado para minúsculas; a unicidade do nome também ignora caixa. Erros: 422 para entrada inválida, 409 para e-mail/nome duplicado, 401 para credenciais incorretas, 503 quando não é possível consultar/salvar no armazenamento. Confirmação de senha existe somente no formulário; não trafega nem é persistida.

O store compartilhado `kurio:mock-auth:v1` usa localStorage com payload `schemaVersion: 2`, sem propriedade `session`. Contas duram 7 dias. A sessão `{ userId, expiresAt, sessionEpoch }` fica em `kurio:mock-session:v1` no sessionStorage da própria aba e dura até 24 horas, limitada pela validade da conta. Os dois armazenamentos são injetáveis nos testes. Migração preserva contas/perfis/carteiras e invalida a antiga sessão global. Refresh recupera somente a sessão da própria aba; timer, foco e alterações do armazenamento compartilhado provocam revalidação pela API. Logout não apaga as contas nem encerra sessões de outras abas. Reset restaura as fixtures e gera um novo `sessionEpoch`, invalidando sessões antigas na próxima consulta.

Senhas não são persistidas em texto puro: o mock armazena derivação PBKDF2/SHA-256 com salt aleatório individual, 100.000 iterações e 256 bits. Não há OAuth nem envio de e-mail; os botões sociais e recuperação continuam informativos. É uma simulação controlada pelo navegador, sem garantias de autenticação/autoridade de um servidor. Use apenas credenciais fictícias; não compartilha contas entre navegadores/dispositivos e limpar os dados do site remove as contas.

Cache de sessão: `['auth', 'session']`, sem retry automático, stale time de 30 segundos e revalidação ao focar. Queries privadas incluem o usuário na chave e `meta: { private: true }`; mutations também registram o proprietário. Troca de identidade cancela/remove caches antigos e limpa o comprovante. Login adota o carrinho visitante; logout explícito limpa o contexto privado. Expiração mantém o contexto oculto para retomada pela mesma conta. As rotas privadas `/profile`, `/wallets`, `/payment`, `/payment/confirmation` e `/activity` usam uma allowlist de destinos internos para retomada após login. O gate visual também oculta conteúdo privado durante expiração em uma rota já aberta.

## Perfil do colecionador

| Método | Caminho | Corpo / resposta |
| --- | --- | --- |
| GET | `/profile` | Perfil da conta da sessão atual; 401 sem sessão válida. |
| PATCH | `/profile` | Atualiza os campos editáveis e devolve o perfil salvo. |

Perfil: `{ id, displayName, username, email, ensName, walletAlias, avatarDataUrl }`. `PATCH` recebe os mesmos campos sem `id`, mais `passwordChange?: { currentPassword, newPassword }`. A confirmação de senha fica somente no formulário. Todos os dados e, quando solicitada, a senha são validados antes da gravação; senha atual incorreta não salva alterações parciais. E-mail e nome duplicados retornam 409; entrada inválida/senha atual incorreta retorna 422. O id vem da sessão, nunca de um parâmetro enviado pelo formulário.

Nome ENS é um rótulo local de até 63 caracteres (letras minúsculas, números e hífens), com extensão `.eth` exibida separadamente. Apelido da carteira e ENS são somente dados de perfil nesta etapa: não registram nomes na rede nem conectam uma carteira. Avatar aceita PNG, JPEG ou WebP de até 256 KB, armazenado como data URL; a interface valida o arquivo e sua decodificação. Não há upload externo.

Os dados ficam no registro da conta no store de autenticação e seguem sua validade de 7 dias. Registros existentes antes desta tela recebem campos de perfil vazios sem perder a conta. `displayName` usa o nome de usuário até ser editado. Trocar a senha verifica a atual e gera novo salt/hash PBKDF2; trocar o e-mail atualiza o login. A sessão atual permanece válida pelo prazo original.

A query é `['profile', userId]`, marcada com `meta: { private: true }`, habilitada somente com sessão e sem retry. Sucesso atualiza o cache do perfil e os dados públicos da sessão somente se a conta ativa ainda for a mesma. Logout/troca de identidade remove o cache privado. A rota `/profile` valida a sessão no Router; visitante vai ao início com `redirect=/profile` e o modal de login aberto. Os destinos internos `/profile` e `/wallets` são aceitos para retomada após login/cadastro. Sessão expirada durante a navegação oculta o formulário e permite entrar novamente no mesmo endereço.

O menu da conta contém **Meu perfil** e **Sair**. A navegação lateral possui as páginas Dados do perfil e Carteiras; Atividade exibe o histórico de compras; Lista de interesse, Ofertas, Arquivos baixados e Suporte ainda são informativas.

## Carteiras salvas

| Método | Caminho | Corpo / resposta |
| --- | --- | --- |
| GET | `/wallets` | `{ primary, secondary, secondarySameAsPrimary }` da conta atual. |
| PUT | `/wallets/primary` | Dados completos da carteira principal → estado atualizado. |
| PUT | `/wallets/secondary` | Dados completos da secundária → estado atualizado. |
| PATCH | `/wallets/secondary-link` | `{ sameAsPrimary: boolean }` → estado atualizado. |

Carteira: `{ displayName, walletAlias, network, profileName, walletAddress, secondaryWallet, walletType, referralCode, email, ensName }`. `network`: `ethereum`, `polygon` ou `solana`; `walletType`: `metamask`, `coinbase` ou `walletconnect`. Todos os campos são strings; código de indicação, ENS e anotação ENS/carteira secundária podem ser vazios. E-mail é normalizado para minúsculas. Ethereum/Polygon exigem formato `0x` com 40 caracteres hexadecimais; Solana exige formato base58 de 32–44 caracteres. Esta é validação de formato, sem consulta à rede ou prova de propriedade.

GET/PUT/PATCH exigem sessão (401) e usam a conta do usuário autenticado; não aceitam um id de outro usuário. A secundária depende de uma principal salva (409). Payload inválido retorna 422, slot desconhecido retorna 404 e falha no armazenamento retorna 503. Salvamento por slot substitui seus dados, sem criar duplicatas a cada clique.

As duas carteiras ficam no registro da conta no store local e seguem sua expiração de 7 dias. Contas persistidas antes desta feature recebem estado vazio, preservando login e perfil. Logout mantém as carteiras; reset dos mocks ou limpeza dos dados do site as remove. A query `['wallets', userId]` é privada e só executa com sessão; troca de conta limpa seu cache.

“Igual à carteira principal” persiste uma referência lógica: a leitura devolve a principal também como secundária e acompanha futuras alterações da principal. O registro anterior da secundária é preservado internamente e volta ao desmarcar a opção. Salvar uma secundária própria desativa esse vínculo.

A rota privada `/wallets` compartilha o layout e a navegação da conta com `/profile`. Acesso sem sessão abre o login e retoma o endereço depois de autenticar. No pagamento, **Usar carteira salva** permite selecionar principal ou secundária própria e preencher os dados do formulário; não executa conexão a extensões, assinatura ou transferência blockchain.


## Atividades e compras demonstrativas

Desde a etapa 4, a tela consulta `GET /orders` e projeta somente pedidos confirmados, usando o snapshot salvo. A confirmação carrega `GET /orders/:id/receipt`; ela permanece disponível depois de refresh, por id na URL. Pedido pendente ou recusado retorna 409 para o recibo.

Compras anteriores do store de contas são migradas uma vez como pedidos confirmados, sem nova baixa de estoque. Histórico legado visitante não é atribuído a contas. O POST `/activity/purchases` retorna 410 no ambiente principal: não há outro endpoint para criar uma compra sem cotação e conexão. Helpers antigos permanecem isolados nos testes de compatibilidade.

O cache `['activity', userId]` é privado; pendentes provocam polling de pedidos e confirmados passam a aparecer no histórico. Reset invalida os recursos pela geração da autenticação. Consulte os [contratos de comércio](COMMERCE_CONTRACTS.md) para pedidos, idempotência, rejeições e controles de cenário.

## Retomada e controle de expiração — etapa 2

`POST /__mock/auth/expire-session` retorna 204 e expira somente a sessão da aba atual; falha de armazenamento retorna 503. O endpoint é exclusivo dos mocks. Ao confirmar o checkout, uma nova consulta da sessão impede envio após expiração; respostas 401 de recursos privados também provocam revalidação.

Desde a etapa 3, o carrinho usa os endpoints REST de [comércio](COMMERCE_CONTRACTS.md), com persistência por conta e identificador visitante no sessionStorage; o formulário incompleto fica em `kurio:payment-draft:v1:<userId>`, por até sete dias. Expiração permite retomada pela mesma conta, inclusive após refresh; logout explícito limpa o contexto e outra conta não o herda. Logout oculta o carrinho privado, mas a conta pode recuperá-lo no próximo login. O rascunho do formulário é limpo no logout. A [ADR 0002](ADRs/0002-sessao-por-aba-e-retomada-checkout.md) detalha migração e isolamento.


## Dados de apresentação pela API — etapa 1

O detalhe agora retorna `details: { rating, reviewsCount, description, contract, royalty, royaltyDescription, attributes, reviews }`. Review: `{ id, author, date, rating, comment, initials }`. O repository valida `marketNftSchema` antes de entregar à View. Os mesmos textos/imagens permanecem; avaliações e metadados são produzidos pelos handlers MSW. A listagem continua retornando `Nft`, sem os detalhes adicionais.

`GET /catalog/facets` responde coleções/categorias e redes com `{ label, value, count }`; contagens refletem o cenário atual. As categorias visuais que compartilham o mesmo filtro possuem a contagem desse filtro. Conteúdo editorial e assets estáticos ficam em `content/`, sem imports de mocks nas Views.

O browser inicializa duas contas fictícias, `alice@kurio.test` e `bruno@kurio.test`, ambas com senha pública de demonstração `Kurio123!`. IDs/salts/hashes são estáveis; só hashes PBKDF2 entram no armazenamento. Reset restaura as duas contas; fixtures não criam sessão automaticamente. Contas antigas são preservadas e contas expiradas não reaparecem no refresh. Testes isolados podem optar por `seedDemoAccounts: true` na factory.


## Favoritos, carrinho e cupons — etapa 3

Os endpoints `/favorites`, `/cart`, `/cart/items`, `/cart/coupon` e `/cart/merge` estão funcionais, conforme [contratos e política de cache](COMMERCE_CONTRACTS.md#favoritos--etapa-3-implementada). As telas usam repositories HTTP injetados e usecases; os handlers validam quantidades/estoque e obtêm metadados/preços do catálogo. `Cart.totals` transporta subtotal, desconto, taxa estimada e total em strings decimais; os cálculos são em wei.

Até a etapa 3, a compra demonstrativa aceitava `couponCode?: string | null` e salvava desconto/total no histórico. Esse contrato agora é somente legado para migração; novas compras usam `/orders`. Registros antigos sem esses campos continuam válidos. Alterar o cupom altera o fingerprint da tentativa. A etapa 4 substitui esse transporte pelo fluxo de cotação/conexão/pedido e implementa a limpeza transacional das quantidades compradas.

Cupons: `KURIO10` aplica 10% sobre subtotal; `EXPIRADO` falha com 422; código desconhecido falha com 422. O erro não remove outro cupom válido. O controle `POST /__mock/commerce/failure` permite testar falhas e rollback sem invalidar a sessão.


## Cotação, carteira e pedidos — etapa 4

Endpoints funcionais: `POST /quotes`, `GET /quotes/:id`, `POST /quotes/:id/accept`; `POST/GET/DELETE /wallet-connections`; `POST/GET /orders`, `GET /orders/:id`, `GET /orders/:id/receipt`. Paths individuais de conexão incluem `/:id`. Contratos e cenários completos estão em [COMMERCE_CONTRACTS.md](COMMERCE_CONTRACTS.md#cotação--etapa-4-implementada).

Todos exigem sessão e aceitam a precondição `X-Expected-User`; recurso de outro proprietário retorna 404. Criação de pedido exige UUID em `Idempotency-Key`; mesmo conteúdo recupera o mesmo pedido, conflito retorna 409. Preço/estoque/cupom/taxa são revalidados antes da criação e da confirmação. A rede da carteira conectada deve corresponder à rede escolhida na cotação; o mock não impõe que essa rede corresponda à rede dos NFTs. A conexão usa carteira cadastrada e não altera implicitamente os cadastros.

Totais são strings decimais calculadas em wei. Cotações e recibos são snapshots. Pedidos `pending` têm resolução persistida e recuperável por REST. Confirmar grava pedido/estoque/idempotência/carrinho em uma operação sob Web Lock. Consultas não repetem baixa de um pedido terminal. `POST /__mock/checkout` controla sucesso, recusa, timeout após criação, conexão recusada, cupom expirado e última unidade.


## Eventos e reconexão entre abas — etapa 5

`order.updated = { eventId, type, resourceId, userId, version, occurredAt, data: Order }`. O schema exige consistência entre envelope/pedido. A conexão captura a identidade da sessão local e o servidor só emite se ela ainda for a mesma e corresponder ao proprietário. Identidade informada pelo cliente não escolhe outra conta. O cliente também verifica a conta ativa, descarta duplicatas/versões antigas e impede regressão de estados terminais.

O commit de comércio notifica `{ epoch, nftIds, orderIds }` pelo canal `kurio:commerce:v1` após persistência. O mock receptor lê o estado e emite pelo Socket.IO; não há payload de coletor, credenciais ou sessão no canal. Componentes/caches não recebem callbacks de BroadcastChannel. Web Locks serializam as transações compartilhadas. O fallback sem essa API é apenas local ao runtime, sem garantia de exclusão entre abas.

NFTs reconciliam catálogo/detalhe/carrinho/cotação; pedidos reconciliam acompanhamento/atividades/recibo/carrinho da conta. Consultas concorrentes são canceladas antes da invalidação. A conexão/reconexão recupera recursos ativos por REST. GET do carrinho limita quantidades excedentes ao estoque positivo e mantém itens esgotados identificáveis/removíveis, com checkout bloqueado e aviso acessível.

Controles adicionais, exclusivos de mocks: `POST /__mock/socket` com `{ connected: boolean }` suspende/restaura o transporte daquela aba; `POST /__mock/replay-order` valida e reenvia um envelope mantendo o filtro de proprietário. Reset de geração descarta notificações antigas e reinicia conexões para reconciliação. Canais/listeners/heartbeats são encerrados no teardown/HMR; a restauração BFCache reinicializa o runtime.


## Controles de rede reproduzíveis

`POST /__mock/network` substitui as regras da aba. Corpo `{ rules: [{ path: '/nfts', method: 'GET', search: 'Emerald', delayMs: 1400, status: 200, times: 1 }] }`. Caminhos aceitos: `/nfts`, `/nfts/:id`, `/catalog/facets`, `/cart`, `/favorites`, `/orders`, `/orders/:id`, `/quotes`. Métodos GET/POST/PUT/DELETE. `delayMs` entre 0 e 15000; `times` entre 1 e 10. O status 200 apenas continua para o handler normal; 0 produz erro de conexão; 401/403/404/409/422/503 produzem erros HTTP simulados. Controle inválido retorna 422.

Regras ficam no sessionStorage, sobrevivem ao refresh e são consumidas na chegada de cada requisição, inclusive consultas posteriormente canceladas. Reset limpa as regras da aba. Não existe passagem direta para setters/cache da interface.

O campo opcional `gate` (identificador minúsculo de até 40 caracteres) bloqueia respostas até `POST /__mock/network/release` com `{ gate: 'cart' }`. Serve para observar skeletons deterministicamente sem depender da velocidade do computador. `{ rules: [] }` limpa e libera bloqueios pendentes.

A URL do catálogo aceita também `tab=new`, um estado de apresentação para “Novos lançamentos”. O parâmetro é removido antes do repository REST; ordenação e filtros continuam usando o contrato de catálogo existente.
