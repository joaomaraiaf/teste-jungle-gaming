# Segurança

## Dependências

Use pnpm >= 11. Preserve `minimumReleaseAge`, `blockExoticSubdeps`, `strictDepBuilds`, allowlist e overrides em `pnpm-workspace.yaml`. Atualize o lockfile com pnpm, nunca manualmente. CI usa `pnpm install --frozen-lockfile`.

Build scripts novos exigem entender a finalidade antes de incluí-los na allowlist. As regras herdadas permanecem nesta limpeza, mesmo quando seus pacotes já não estão no grafo.

O workflow de segurança executa audit de dependências de produção e revisão de dependências novas em pull requests; CodeQL analisa JavaScript/TypeScript e Dependabot verifica atualizações semanalmente. O estado e os checks que podem ser usados na proteção das branches estão em [docs/CI.md](../docs/CI.md).

## Ambiente e dados

Variáveis `VITE_*` entram no bundle e são públicas. Não inclua segredos. `.env.example` documenta configuração; `.env.local` é ignorado.

A SPA não possui servidor privado. Não implemente garantias de produção fictícias em cookies JS ou validação client-side. Use somente credenciais de demonstração e nunca armazene senhas em claro. Valide dados externos com Zod; evite HTML não sanitizado.

## Sessão e logs

A sessão é simulada com MSW e isolada por aba; contas compartilhadas têm validade de sete dias e sessões de até 24 horas. Isole os dados por usuário; logout/troca de conta limpa dados privados e subscriptions. Não registre tokens, senhas, bodies ou respostas brutas.

## Hosting

Headers de segurança devem ser configurados no hosting da SPA; não há mais `next.config.ts` ou middleware Next. Defina CSP de acordo com origens, assets e transporte Socket.IO efetivamente utilizados. Configure fallback de navegação para `index.html` sem interceptar assets/endpoints.
