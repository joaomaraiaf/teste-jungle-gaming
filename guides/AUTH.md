# Sessão do colecionador

A autenticação antiga foi removida. Cadastro, login, sessão e logout de demonstração estão implementados contra Axios → MSW; veja [os contratos](../docs/API_CONTRACTS.md#autenticação-local-de-demonstração). Contas locais duram 7 dias e sessões duram até 24 horas, independentemente por aba. Login preserva o carrinho visitante; expiração permite retomada pela mesma conta e logout explícito limpa o contexto privado.

Na implementação do desafio:

- Login, cadastro, consulta da sessão e logout devem passar pelo Axios e pela API simulada MSW.
- Proteja rotas privadas com TanStack Router, preservando o destino para retomada após login.
- Recupere a sessão após refresh e trate expiração sem perder o contexto do checkout.
- Isole cache por usuário e limpe dados privados/subscriptions ao trocar de conta ou sair.
- Use credenciais fictícias; não persista senhas em claro.
- Preserve o carrinho de visitante no login e mescle os itens uma única vez, respeitando edição e estoque. Logout explícito inicia um carrinho visitante separado.
- Não reintroduza OAuth, permissões administrativas, JWT decode como autorização ou cookies do backend antigo.

Documente o contrato e a política final em [ARCHITECTURE.md](../ARCHITECTURE.md) e as credenciais fictícias no README.

A [ADR 0002](../docs/ADRs/0002-sessao-por-aba-e-retomada-checkout.md) documenta migração, destinos permitidos, retomada do formulário e isolamento entre abas implementados na etapa 2.
