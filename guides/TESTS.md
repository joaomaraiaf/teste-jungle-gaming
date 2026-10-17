# Testes

- `*.spec.ts(x)`: unitários, Vitest; junto do código.
- `*.test.ts(x)`: integração, Testing Library + Vitest; junto do código.
- `tests/*.e2e.ts`: fluxos de navegador, Playwright.

```bash
pnpm test
pnpm test:unit
pnpm test:int
pnpm test:cov
pnpm exec playwright install chromium
pnpm exec playwright install webkit # necessário para pnpm test:e2e:safari
pnpm test:e2e
pnpm test:e2e:safari # regressão da troca de edição em Safari/WebKit
pnpm test:e2e:report
```

Não são necessários arquivos `.env.test` ou `.env.e2e` para a base. Playwright inicia build/preview na porta 3102, que deve estar livre. Chromium executa desktop 1440px e mobile 390px; o projeto tablet (768px) roda os testes responsivos. Há relatório HTML e traces preservados em falhas. O dev server na porta 3002 não é reutilizado; reuso exige `PLAYWRIGHT_REUSE_SERVER=true` explícito.

Priorize regras de negócio, erros, cancelamento, idempotência, isolamento por usuário e recuperação. Os testes de integração em `src/mocks/network.test.ts` usam a mesma factory REST/Socket.IO que o browser. O E2E usa build:mock/preview:mock. Os testes funcionais devem passar pela rede MSW e pelo cliente Socket.IO, com reset e cenários determinísticos. Baselines, acessibilidade e auditorias possuem comandos e ambiente documentados em [VALIDATION.md](../docs/VALIDATION.md).
