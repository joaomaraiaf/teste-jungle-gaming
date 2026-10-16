# Nomes

Arquivos/pastas em kebab-case; classes/componentes em PascalCase; funções/variáveis em camelCase; constantes exportadas em SCREAMING_SNAKE_CASE. Interfaces de contratos usam prefixo `I`.

- `domain/entities/<nome>.entity.ts`: modelo de negócio.
- `domain/repositories/<nome>.repository.interface.ts`: contrato.
- `data/repositories/<nome>.repository.impl.ts`: implementação.
- `domain/usecases/<verbo>-<nome>.usecase.ts`: regra de negócio.
- `data/dtos/*.request.dto.ts`, `*.response.dto.ts`: transporte.
- `data/schemas/*.schema.ts`: validação.
- `hooks/use-*.hook.ts`: hooks da feature/ViewModels.
- `components/*.tsx`: Views.
- `*.spec.ts(x)`, `*.test.ts(x)`, `*.e2e.ts`: unitário, integração, E2E.

Queries exportam `*_QUERY_KEY`; mutations, `*_MUTATION_KEY`. Barrels expõem somente o necessário. Rotas e composição da aplicação ficam em `src/routes/` e `src/router.ts`.
