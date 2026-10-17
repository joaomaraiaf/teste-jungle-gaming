# Hooks e estado remoto

Hooks de feature ficam em `features/<feature>/hooks/`, com nome `use-*.hook.ts`. Hooks reutilizáveis ficam em `core/hooks/`.

- Queries usam `useAppQuery`, chamam usecases e exportam `*_QUERY_KEY`.
- A chave inclui todos os parâmetros da consulta e a identidade do usuário quando os dados forem privados.
- Encaminhe `signal` da query até o transporte para cancelar respostas obsoletas.
- Mutations usam `useAppMutation` e exportam `*_MUTATION_KEY`. Invalide somente as consultas afetadas.
- Prefira invalidação para atualizar em background. Use reset quando for necessário retornar ao estado inicial; cancelamento/remoção para encerrar dados de sessão.
- Atualização otimista exige snapshot, cancelamento de consultas concorrentes, rollback e reconciliação.
- ViewModels de formulário usam RHF + `zodResolver` e expõem apenas o necessário para a View.
- Callbacks assíncronos devem ser aguardados. Não duplique os toasts do wrapper.
- Não faça retry automático de operações de compra sem a política de idempotência implementada.

A política de cache/retries, identidade e reconciliação está documentada em [ARCHITECTURE.md](../ARCHITECTURE.md) e nos contratos. Não altere retries de compra sem preservar idempotência e recuperação.
