# ADR 0005 — Eventos Socket.IO e simulação entre abas

Status: aceita. Data: 2026-10-16. Complementa a ADR 0004.

## Contexto

O store de comércio já confirmava pedidos e estoque conjuntamente, mas outra aba só percebia mudanças ao consultar novamente a API. Precisamos demonstrar esgotamento e concorrência com duas contas, preservando a separação entre transporte dos mocks e estado da interface.

## Decisão

O store publica uma notificação depois de persistir um commit com versões novas de NFTs ou pedidos. Web Locks continuam serializando leitura, validação e gravação das operações de comércio na mesma origem. Catálogo/estoque/pedidos/idempotência permanecem no mesmo registro, sem reserva antecipada de estoque. Cenário e sequência dos controles do catálogo também são relidos da persistência, evitando snapshots antigos em outra aba.

O canal `kurio:commerce:v1` usa BroadcastChannel somente entre mocks. Sua mensagem contém `{ epoch, nftIds, orderIds }`: não inclui pedido, coletor, credenciais nem sessão. O mock receptor valida o envelope, relê o estado persistido e produz os eventos `nft.updated` e `order.updated` por seu servidor Socket.IO simulado. O mock originador também emite localmente depois do commit. Ler uma notificação não grava o store nem reenvia o canal, evitando loops.

Componentes e caches não recebem callbacks do BroadcastChannel. A integração da aplicação assina somente Socket.IO. Eventos validam schema, identidade e versão. Consultas afetadas são canceladas antes da invalidação e recuperação por REST, preservando filtros/paginação do catálogo e metadados do detalhe. Versões antigas/repetidas não provocam regressão; pedidos terminais não voltam a pendentes.

## Isolamento privado

Cada conexão do servidor captura a identidade da sessão daquela aba. Antes de emitir `order.updated`, o servidor verifica que o usuário atual ainda corresponde ao capturado e ao proprietário do evento. Login/logout reiniciam a conexão; uma conexão antiga não pode receber pedidos da nova conta. O cliente também verifica proprietário, sessão ativa e versão. Queries privadas mantêm o usuário na chave e respostas de assinaturas encerradas não invalidam o cache de outra identidade.

## Atualização e recuperação

`nft.updated` reconcilia catálogo, detalhe, carrinho e cotação. A quantidade permanece quando ainda cabe no estoque. O GET do carrinho limita quantidades positivas excedentes à disponibilidade; a tela informa o ajuste. Uma edição esgotada continua identificável/removível, com aviso e checkout bloqueado. Reabrir o carrinho já esgotado também mostra o aviso. Cotação alterada exige o aceite explícito existente.

`order.updated` reconcilia o pedido em acompanhamento, atividades, recibo e carrinho da conta. Polling REST dos pedidos permanece como recuperação adicional; a resolução persistida não depende de um socket ou timer sobrevivendo ao refresh.

Ao conectar/reconectar, a aplicação consulta novamente os recursos ativos por REST. Isso recupera eventos perdidos durante queda do transporte. Reset de geração invalida notificações antigas e reinicia conexões para reconciliar snapshots novos. Assinaturas, mapas de versão, heartbeats, canais e listeners são encerrados no ciclo correspondente. HMR remove o runtime anterior; restauração pelo BFCache recarrega o runtime para não reutilizar um canal já encerrado.

## Testes e demonstração

Playwright usa duas páginas no mesmo contexto/origem, autenticadas como AliceDemo e BrunoDemo. Cobre compra de B esgotando a edição no carrinho de A sem refresh/foco de A, redução parcial sem ajuste desnecessário, recuperação de evento perdido com o transporte suspenso e duas tentativas concorrentes pela última unidade.

A integração Axios → MSW → Socket.IO cobre confirmação/pendência, filtro de proprietário, conexão antiga após troca de conta, duplicatas/regressões e unsubscribe. O teste do canal verifica notificação somente depois de persistir, ausência de payload privado, falha de escrita e encerramento dos listeners.

Controles exclusivos dos mocks: `POST /__mock/socket` recebe `{ connected: false | true }` para suspender/restaurar o transporte daquela aba; `POST /__mock/replay-order` valida e reenvia um envelope de pedido, mantendo o filtro privado do servidor. O controle anterior `/__mock/disconnect` continua sendo uma interrupção breve com reconexão automática.

## Limites

A simulação funciona em abas do mesmo navegador/perfil e origem, com BroadcastChannel e Web Locks. O fallback sem Web Locks serializa somente o runtime da aba e não garante exclusão entre abas. Não há comunicação entre dispositivos ou backend externo, nem pagamento/blockchain real. Não há long-polling, rooms ou broadcasting de um servidor Socket.IO completo. Acessibilidade ampliada, baselines, Lighthouse e publicação continuam nas etapas 6–7.
