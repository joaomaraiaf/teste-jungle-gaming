# Validação reproduzível

Use Node 24 (mínimo 22.19 para a versão instalada do Lighthouse), pnpm 11.5.2 e Chromium do Playwright 1.58.2. Instale com `pnpm install --frozen-lockfile` e `pnpm exec playwright install chromium`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:mock
pnpm test:e2e
pnpm test:visual
pnpm audit:lighthouse
```

Playwright usa Chromium desktop 1440×900 e mobile 390×844. O projeto tablet 768×1024 executa a matriz de telas/acessibilidade e zoom. O relatório HTML e traces de falha ficam em `playwright-report/` e `test-results/`. Os testes iniciam seu próprio build/preview na porta 3102, separada do dev server 3002. Use `PLAYWRIGHT_PORT` se precisar de outra porta livre; reutilização de servidor exige `PLAYWRIGHT_REUSE_SERVER=true` explícito.

## Regressão visual

`pnpm test:visual` cobre início, detalhe, carrinho e pagamento em 390/768/1440×900. As 12 imagens de referência ficam em `tests/visual-baselines`. Fixtures por contexto, relógio fixo, locale pt-BR, UTC, fontes prontas e movimento reduzido estabilizam as capturas. Shimmer é validado separadamente nos testes funcionais. As imagens são comparadas pelo Chromium instalado pelo Playwright; o ambiente canônico desta entrega é macOS/Chromium. Não atualize baselines automaticamente em outro sistema operacional: fontes/rasterização podem diferir.

Para uma mudança visual intencional: `pnpm test:visual:update`, inspecione as 12 imagens e o diff antes de versionar. O limite é de 0,1% de pixels diferentes; diferenças maiores falham.

## Acessibilidade

A matriz percorre início, login, cadastro, perfil, carteiras, detalhe, carrinho, pagamento e confirmação, verificando overflow e axe. Nenhuma violação crítica/séria é aceita. Testes adicionais verificam foco inicial/retorno do diálogo, Tab nos formulários e zoom de texto a 200%. Isso complementa a inspeção da interface, sem substituir testes com tecnologias assistivas reais.

## Rede e tempo

Os controles estão somente nos mocks. `POST /api/__mock/network` recebe `{ rules: [{ path: '/cart', method: 'GET', delayMs: 1500, status: 200, times: 3 }] }`. `search` opcional seleciona a busca de `/nfts`. Regras são consumidas por requisição e persistem no sessionStorage da aba para atravessar refresh. `status: 200` continua no handler normal; `0` falha na rede; 401/403/404/409/422/503 simulam HTTP. `{ rules: [] }` limpa; reset global também limpa as regras daquela aba. Requisições canceladas podem consumir uma regra; use `times` explícito quando o bootstrap reconcilia recursos.

Para bloquear carregamento sem depender da velocidade da máquina, use `gate: 'cart'` na regra e libere com `POST /api/__mock/network/release`, corpo `{ gate: 'cart' }`.

Os testes não usam `waitForTimeout`. Esperam estado visível, resposta de rede ou condição observável. Cenários de pedido pendente e baselines controlam o relógio; buscas fora de ordem usam latência por termo.

## Última execução funcional

Lint e tipos passaram. Vitest: 94 testes em 25 arquivos. Playwright completo: 113 aprovados, 9 ignorados somente por variante de viewport, zero falhas. O [relatório HTML](audits/playwright/index.html) está incluído na entrega, além dos artefatos locais ignorados pelo Git. Lighthouse e a meta mobile são registrados separadamente em [auditorias](audits/README.md).

Regressão visual: 12 imagens revisadas e 12 comparações aprovadas sem atualizar snapshots. [Relatório visual HTML](audits/visual/index.html).

## Reprodução limpa concluída

`pnpm verify:clean` instalou as 540 dependências do lockfile sem copiar node_modules/dist e sem downloads adicionais (cache pnpm reutilizado). Lint, tipos, 94 testes, build, preview e dois smokes de compra/rotas/duas abas passaram. O hash do build da cópia limpa coincide com a série Lighthouse final. [Registro dos passos](audits/clean-checkout.json) e [log](audits/clean-checkout.log).

A auditoria smoke executou e retornou 1 por performance abaixo da meta; `auditTargetsPassed=false` permanece explícito. `passed=true` no verificador significa reprodução dos comandos/fluxos, sem aprovar as metas de qualidade. A série final de 12 medições continua em [Lighthouse](audits/lighthouse/summary.md).

Depois da correção da origem de classes no PostCSS, as 12 comparações visuais passaram sem atualizar baselines e os seis testes de acessibilidade/foco/zoom passaram nas três larguras. [Relatório responsivo](audits/responsive/index.html).
