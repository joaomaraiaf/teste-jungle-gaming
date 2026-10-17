# AGENTS.md — Frontend React

Documentação por tarefa: carregue apenas os guias relevantes em `guides/`.

## Regras

- Use **pnpm 11.5.2**, nunca npm/yarn. Node.js >= 22.19 (24 recomendado para as auditorias).
- Feature-first + Clean Architecture + MVVM. O domínio não importa `data/`, hooks, React ou componentes.
- Comece novas features com `pnpm generate <nome>`; o generator cria apenas as pastas, sem CRUD fictício.
- Não há mais uma feature `users` de referência. Siga os guias e implemente somente o escopo do marketplace.
- Não edite manualmente `node_modules/`, `dist/` ou `pnpm-lock.yaml`. Atualizações de dependências usam pnpm e geram o lockfile.
- Preserve as proteções de supply chain em `pnpm-workspace.yaml` e pnpm >= 11.
- Antes de programar, leia o guia da tarefa.

## Guias

- Arquitetura e dependências → [ARCH.md](guides/ARCH.md)
- Nomes e sufixos → [NAMING.md](guides/NAMING.md)
- Tipos, DTOs, schemas e mappers → [TYPES.md](guides/TYPES.md)
- Feature e generator → [MODULE.md](guides/MODULE.md)
- Componentes e formulários → [COMPONENTS.md](guides/COMPONENTS.md)
- Hooks e estado remoto → [HOOKS.md](guides/HOOKS.md)
- HTTP → [API.md](guides/API.md)
- Sessão → [AUTH.md](guides/AUTH.md)
- Estilo → [STYLE.md](guides/STYLE.md)
- Testes → [TESTS.md](guides/TESTS.md)
- Erros → [ERRORS.md](guides/ERRORS.md)
- Segurança → [SECURITY.md](guides/SECURITY.md)
- Revisão → [REVIEW.md](guides/REVIEW.md)

## Stack

React 19 · TypeScript · Vite · TanStack Router/Query · Axios · Tailwind CSS 4 · shadcn/ui · RHF/Zod · Biome · Vitest/Playwright.

MSW e Socket.IO são iniciados em `src/mocks/`; os DTOs e schemas ficam em `src/features/*/data/` e os contratos REST/eventos estão em `docs/API_CONTRACTS.md`. Leia esse documento ao integrar dados/eventos. Fluxos do marketplace, testes funcionais e baselines visuais estão implementados. Relatórios Lighthouse estão em `docs/audits/`; a meta de performance mobile ainda está pendente. A configuração da Vercel está em `vercel.json`, mas a publicação e a validação pública ainda estão pendentes.

## Comandos

```bash
pnpm install --frozen-lockfile
pnpm dev                 # http://127.0.0.1:3002
pnpm generate catalog
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```
