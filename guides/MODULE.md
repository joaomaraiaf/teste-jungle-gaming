# Criar uma feature

1. Execute `pnpm generate <nome-em-kebab-case>`. O generator cria apenas diretórios com `.gitkeep` e recusa sobrescrever uma feature existente.
2. Defina o modelo puro e o contrato do repository em `domain/`.
3. Defina DTOs/schemas necessários em `data/`. Derive tipos de schemas com `z.infer`.
4. Implemente o repository em `data/repositories`, usando o `IHttpClient` injetado.
5. Implemente usecases com dependência do contrato do repository, não da implementação.
6. Monte as dependências fora do domínio, em um arquivo na raiz da feature.
7. Crie hooks de query/mutation e ViewModels. Componentes consomem os hooks.
8. Adicione a rota em `src/routes/` e registre-a em `src/router.ts`.
9. Teste regras e fluxos relevantes. Remova `.gitkeep` quando o diretório tiver arquivos.

Não gere CRUD de administração, tracing ou contratos fictícios como ponto de partida.
