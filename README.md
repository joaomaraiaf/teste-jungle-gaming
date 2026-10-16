# Jungle NFT Marketplace

Marketplace demonstrativo de NFTs criado para o [Frontend Challenge da Jungle Gaming](https://github.com/junglegaming/frontend-challenge). A aplicação cobre descoberta e filtragem de NFTs, detalhe do item, favoritos, carrinho, cotação, checkout recuperável, confirmação da compra e histórico da conta, em layouts desktop e mobile.

O frontend é uma SPA em React 19, TypeScript e Vite. Não há backend, blockchain, carteira externa ou pagamento real: Axios envia as requisições para a API local simulada pelo MSW, e eventos Socket.IO são simulados no navegador. A demonstração funciona sem conectar a serviços externos; os dados ficam no armazenamento local do navegador e não sincronizam entre dispositivos.

## Executar

Requisitos: Node.js `>=22.19` e pnpm `11.5.2`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abra [http://127.0.0.1:3002](http://127.0.0.1:3002). O comando `pnpm dev` usa o modo `mock`, que habilita MSW e Socket.IO localmente.

### Variáveis de ambiente

| Variável | Padrão no modo mock | Uso |
| --- | --- | --- |
| `VITE_MOCKS_ENABLED` | `true` | Habilita o worker MSW; use `true` também no build de demonstração. |
| `VITE_API_URL` | `/api` | Prefixo das chamadas REST interceptadas pelo MSW. |
| `VITE_SOCKET_URL` | origem atual | Origem para o cliente Socket.IO; vazio usa a origem da aplicação. |

As variáveis `VITE_*` são incluídas no bundle e não devem conter segredos. `.env.mock` configura a execução local; `.env.example` documenta os valores para configuração manual.

## Funcionalidades

- Catálogo com busca, filtros, ordenação, paginação e navegação para o detalhe do NFT.
- Favoritos e carrinho de visitante ou de usuário, com seleção de edição e quantidade.
- Conta local de demonstração, perfil e carteiras salvas para preencher o checkout.
- Cotação revisável, cupons, conexão de carteira simulada e checkout idempotente recuperável após refresh.
- Confirmação/recusa demonstrativa, recibo e histórico de compras.
- Atualizações de catálogo, estoque, carrinho, cotação e pedidos entre abas do mesmo navegador.
- Layout responsivo com as artes fornecidas no projeto e fonte Roboto Mono.

A tela **Atividade** é uma extensão demonstrativa do histórico de compras. Integração com redes sociais, recuperação de senha, conexão real de carteira, transferência on-chain e pagamento real não fazem parte do fluxo implementado. O escopo e o estado dos requisitos estão na [matriz do desafio](docs/REQUIREMENTS_MATRIX.md).

## Conta e cenários de demonstração

É possível criar uma conta fictícia pela interface. Há também duas contas de demonstração prontas:

| Usuário | E-mail | Senha |
| --- | --- | --- |
| AliceDemo | `alice@kurio.test` | `Kurio123!` |
| BrunoDemo | `bruno@kurio.test` | `Kurio123!` |

Contas e perfil ficam no armazenamento local por até 7 dias; a sessão de cada aba dura até 24 horas. As senhas de demonstração são armazenadas com hash e salt, e não representam autenticação segura para produção.

Os controles abaixo devem ser executados no console do navegador com a aplicação aberta. Eles são interceptados pelo MSW daquela aba; não use `curl` ou `page.request`, pois esses processos não compartilham o estado mockado do browser.

Defina este helper no console para configurar os controles. Se recarregar a página, defina-o novamente, pois a função vive apenas no contexto atual:

```js
window.setMockControl = async (control, payload) => {
  const response = await fetch(`/api/__mock/${control}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Controle mock falhou: ${response.status}`);
};
```

### Catálogo e falhas de rede

Os cenários de catálogo são `default`, `empty`, `slow` (1,5 s), `server-error` (503), `network-error` e `out-of-order` (latências alternadas). Selecione um e recarregue a página para observar o carregamento:

```js
await setMockControl('reset', { scenario: 'slow' });
location.reload();
```

Para falhar a consulta inicial e as três tentativas automáticas do catálogo com HTTP 503, configure quatro ocorrências e recarregue. Depois, tente novamente na interface para verificar a recuperação:

```js
await setMockControl('network', {
  rules: [{ path: '/nfts', method: 'GET', status: 503, times: 4 }],
});
location.reload();
```

Use `status: 0` para simular falha de conexão, ou `delayMs: 1500` com `status: 200` para atrasar a resposta normal. Para manter uma requisição parada até liberá-la, configure `gate: 'catalogo'`, recarregue a página e, depois que ela abrir, libere a requisição com `await setMockControl('network/release', { gate: 'catalogo' })`. Regras de rede são consumidas por requisição e persistem no `sessionStorage` da aba até serem consumidas ou substituídas; `times` aceita de 1 a 10.

Os status simulados incluem 401, 403, 404, 409, 422 e 503. `path` é relativo à API: por exemplo, `'/cart'`, `'/quotes'`, `'/favorites'` ou `'/nfts/nft-001'`. Use `method` para selecionar `GET`, `POST`, `PUT` ou `DELETE`.

### Favoritos, carrinho e sessão

Para testar rollback após uma falha de mutation, configure a falha e então favorite/remova um NFT ou altere o carrinho:

```js
await setMockControl('commerce/failure', {
  resource: 'favorites', // ou 'cart'
  delayMs: 1000,
  status: 503, // use 0 para falha de conexão
});
```

Esse controle falha a próxima mutation do recurso selecionado; leituras não consomem a falha. Para testar sessão expirada, estando autenticado, execute o controle e tente abrir uma área privada ou continuar o checkout:

```js
await setMockControl('auth/expire-session', {});
```

Cadastro duplicado também reproduz conflito de validação: tente cadastrar novamente `alice@kurio.test` ou `bruno@kurio.test`.

### Checkout, preço e estoque

Configure o resultado antes de iniciar uma nova compra. Os cenários de checkout são `confirmed`, `refused`, `timeout-after-create` e `last-unit`:

```js
await setMockControl('checkout', { scenario: 'refused' });
```

`refused` demonstra recusa do pedido. `timeout-after-create` persiste a tentativa e responde com timeout; depois de atualizar a página, o checkout deve recuperar o mesmo pedido pela chave de idempotência. `last-unit` deixa uma unidade da edição `edition-one` do `nft-001`; duas abas podem competir pela unidade para observar uma confirmação e uma recusa. Para atrasar o resultado e observar o estado pendente, use `{ resolveAfterMs: 5000 }`. Para simular recusa da conexão de carteira, use `{ refuseConnection: true }`.

Para alterar o preço ou esgotar uma edição durante a navegação, publique uma atualização pelo controle de NFT. O mock atualiza o mesmo store do REST e envia `nft.updated` pelo cliente Socket.IO:

```js
await fetch('/api/__mock/nfts/nft-001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ editionId: 'edition-one', priceEth: '2.25', available: 0 }),
});
```

Adicione o NFT ao carrinho antes de enviar essa atualização para verificar o aviso, o resumo atualizado e o bloqueio do checkout desatualizado. No pagamento, `KURIO10` aplica o desconto; `EXPIRADO` cobre cupom expirado e outro código cobre cupom inválido. Para expirar/restaurar `KURIO10` no controle de cotação, use `await setMockControl('checkout', { expireCoupon: true })` ou `{ expireCoupon: false }`.

### Reset

O reset global restaura fixtures, contas de demonstração e estado de comércio, limpa regras de latência/falha, invalida sessões e encerra sockets. Execute-o ao terminar os cenários e recarregue a página; será necessário entrar novamente:

```js
await setMockControl('reset', { scenario: 'default' });
location.reload();
```

Os payloads completos e os limites de cada controle estão nos [contratos da API e eventos](docs/API_CONTRACTS.md) e nos [contratos de comércio](docs/COMMERCE_CONTRACTS.md). Os cenários são determinísticos e exclusivos dos mocks.

### MSW e Socket.IO

Usamos MSW 2 (`msw@2.15.0`), compatível com o peer dependency declarado por `@mswjs/socket.io-binding@0.2.0`. O binding disponível é para MSW 2; a versão também é compatível com as ferramentas de teste instaladas. A documentação do repositório do binding pode acompanhar uma API diferente da versão publicada, então a integração deve ser conferida contra os exports instalados.

O transporte de eventos é WebSocket nativo via Socket.IO client, interceptado pelo `ws` do MSW e pelo binding `@mswjs/socket.io-binding`. A inicialização espera o worker MSW antes de carregar o cliente. REST e eventos leem e atualizam o mesmo estado mockado.

O ambiente simula somente o protocolo necessário ao desafio. Não cobre HTTP long-polling, upgrade de polling, rooms ou paridade completa com um servidor Socket.IO. Reconexão, eventos e sincronização funcionam entre abas da mesma origem e perfil de navegador; não testam uma rede real nem sincronizam dispositivos.

## Comandos

```bash
pnpm dev                 # aplicação local com MSW
pnpm lint                # Biome
pnpm typecheck           # TypeScript
pnpm test                # Vitest: unitários e integração
pnpm test:cov            # Vitest com cobertura
pnpm build:mock          # valida tipos e cria build com MSW
pnpm preview:mock        # serve o build de demonstração
pnpm exec playwright install chromium
pnpm test:e2e            # fluxos E2E em Chromium
pnpm test:e2e:safari     # regressão em WebKit/Safari; requer instalar WebKit
pnpm test:visual         # compara as 12 baselines visuais
pnpm audit:lighthouse    # audita início e detalhe em mobile e desktop
pnpm verify:clean        # reprodução de instalação e verificações em cópia limpa
pnpm generate catalog   # cria o esqueleto de uma feature
```

O Playwright inicia seu próprio build/preview na porta `3102` (`PLAYWRIGHT_PORT` permite alterá-la); não usa o servidor de desenvolvimento na porta `3002`. A matriz cobre desktop e mobile, com verificações adicionais em tablet. Os testes de rede usam MSW e os sockets simulados, sem API externa.

Na última execução documentada, Vitest passou com 94 testes em 25 arquivos e Playwright passou com 113 testes; 9 casos foram ignorados por não se aplicarem à variante de viewport. As baselines visuais passaram nas 12 comparações. Lighthouse atingiu as metas de acessibilidade, boas práticas e SEO, mas a mediana de Performance mobile ficou em 84 no início e 83 no detalhe, abaixo da meta 90. Consulte as [evidências e condições de validação](docs/VALIDATION.md) e os [relatórios Lighthouse](docs/audits/README.md).

## Estrutura e arquitetura

```text
src/
  core/        infraestrutura compartilhada, layout, HTTP e realtime
  features/    catálogo, mercado, carrinho, autenticação, pagamento e demais features
  mocks/       worker MSW, handlers REST/Socket.IO, estado e cenários
  routes/      rotas TanStack Router e composição das views
  styles/      estilos e tokens globais
tests/         fluxos Playwright e baselines visuais
docs/          contratos, decisões, matriz de requisitos e evidências
guides/        regras de implementação por tarefa
```

Cada feature mantém suas entidades e contratos em `domain/`, e schemas, DTOs e implementações em `data/`. O domínio não depende de React ou infraestrutura; views são compostas por componentes e hooks/ViewModels. Leia [ARCHITECTURE.md](ARCHITECTURE.md) para as decisões implementadas, [AGENTS.md](AGENTS.md) para as instruções de trabalho e os guias relevantes em [`guides/`](guides/).

## CI e publicação

GitHub Actions executam lint, tipos, Vitest, build mock, Playwright, auditoria de dependências, CodeQL e Lighthouse. Os workflows e os checks recomendados para as branches estão descritos em [CI](docs/CI.md).

A configuração para Vercel usa `pnpm build:mock`, publica `dist` e habilita o fallback SPA por rota. O deploy e a validação de uma URL pública ainda estão pendentes; não há URL pública verificada nesta cópia. Siga o [procedimento de publicação](docs/DEPLOYMENT.md) e atualize esse estado após o deploy.

## Referências

- [Enunciado original](readme-github.md)
- [Matriz do desafio](docs/REQUIREMENTS_MATRIX.md)
- [Contratos REST e eventos](docs/API_CONTRACTS.md) e [contratos de comércio](docs/COMMERCE_CONTRACTS.md)
- [Validação reproduzível](docs/VALIDATION.md) e [auditorias](docs/audits/README.md)
- [Decisões ADR](docs/ADRs/)
- [Publicação na Vercel](docs/DEPLOYMENT.md)
