# ADR 0001 — Autenticação local simulada com persistência temporária

- **Status:** Aceita
- **Data:** 2026-10-16
- **Escopo:** Cadastro, login, recuperação da sessão e logout do marketplace de demonstração.

## Contexto

O projeto não dispõe de uma API de autenticação, mas a avaliação precisa exercitar a criação de contas, saída e entrada posterior com as mesmas credenciais. Os formulários inicialmente apenas validavam os campos, sem criar uma conta ou estabelecer sessão.

Manter os dados somente em memória impediria continuar esses testes após recarregar a página. Ao mesmo tempo, a aplicação já utiliza Axios e MSW para simular contratos HTTP e deve preservar a separação entre interface, regras e transporte.

## Decisão

Implementar a autenticação de demonstração com uma API local interceptada pelo MSW. As chamadas seguem o fluxo componente → ViewModel → usecase → contrato de repository → implementação HTTP com `apiClient` (Axios) → handler MSW. Componentes e hooks não simulam respostas nem acessam diretamente o armazenamento de contas.

O store de autenticação utiliza estado em memória e persistência em `localStorage`, na chave versionada `kurio:mock-auth:v1`. Nos testes, o armazenamento e o relógio podem ser injetados. O estado persistido é validado com Zod; dados corrompidos restauram o estado vazio. Falhas de acesso ou gravação são reportadas pela API simulada.

### Contas e credenciais

- Contas permanecem válidas por **7 dias desde a criação**, sem renovação automática desse prazo no login.
- E-mails são normalizados para minúsculas. E-mail e nome de usuário devem ser únicos, ignorando diferenças de caixa.
- Senhas são armazenadas somente como derivação **PBKDF2/SHA-256**, com salt aleatório individual, 100.000 iterações e saída de 256 bits. A senha original e sua confirmação não são persistidas.
- Somente credenciais fictícias devem ser usadas. O cadastro inicia a sessão automaticamente.

### Sessão e interface

- A sessão dura **24 horas desde o cadastro ou login**, limitada à validade da conta.
- O refresh recupera a sessão pela API simulada. Expiração, foco da janela e alterações do armazenamento em outra aba provocam revalidação.
- O cabeçalho mostra o nome do usuário e a opção **Sair** quando existe sessão. Logout encerra a sessão e mantém a conta disponível para outro login.
- Entrada e saída preservam o carrinho de visitante e o catálogo público. A persistência do carrinho após refresh não faz parte desta decisão.
- Trocas de identidade e saída limpam o comprovante e cancelam/removem queries marcadas com `meta: { private: true }`. Queries privadas futuras também devem incluir o id do usuário na chave.
- Não há retry automático das mutations de autenticação.

### Contrato e limpeza

| Método | Endpoint | Comportamento |
| --- | --- | --- |
| POST | `/api/auth/signup` | Cria conta e devolve sessão. |
| POST | `/api/auth/login` | Valida credenciais e devolve sessão. |
| GET | `/api/auth/session` | Devolve sessão válida ou `null`. |
| POST | `/api/auth/logout` | Encerra a sessão sem excluir a conta. |

A leitura do store descarta contas e sessões expiradas. O reset de demonstração em `POST /api/__mock/reset` também apaga contas e sessão. Limpar os dados do site remove a persistência local.

## Alternativas consideradas

| Alternativa | Motivo para não adotar |
| --- | --- |
| Apenas memória | Perde contas e sessão após refresh, prejudicando a avaliação. |
| `sessionStorage` | Limita a persistência à aba e não atende à continuidade entre aberturas do navegador. |
| Acesso ao `localStorage` diretamente pelos formulários | Acopla a interface à simulação e contorna o fluxo HTTP existente. |
| Backend ou provedor externo de autenticação | Acrescenta infraestrutura e dependências fora do escopo atual de demonstração. |

## Consequências

É possível validar cadastro, credenciais incorretas, duplicidade, login, logout, expiração e continuidade após refresh sem depender de um servidor externo. Os contratos HTTP e o repository permitem substituir o mock por uma API futura sem reescrever os formulários.

As contas pertencem à origem e ao navegador usados; não são compartilhadas entre dispositivos, perfis ou navegadores. O armazenamento e o relógio são controlados pelo cliente. Portanto, esta solução **não constitui autenticação ou autorização segura para produção**, mesmo com derivação de senha. A expiração é aplicada na leitura, não por um serviço de limpeza em segundo plano.

Login social, recuperação de senha, envio de e-mail e proteção de futuras rotas privadas permanecem fora deste escopo. A adoção de um backend real deverá substituir a autoridade local sobre contas e sessões e revisar os contratos, a política de armazenamento e a proteção de rotas.

## Validação

- Testes de integração Axios → MSW cobrem cadastro, sessão, logout, novo login, credenciais incorretas, duplicidade, concorrência, expiração, armazenamento corrompido e falha de persistência.
- Testes de navegador cobrem os modais e o fluxo completo de cadastro → logout → login → refresh, em desktop e celular, preservando o carrinho durante entradas e saídas.

## Referências

- [Contratos de autenticação](../API_CONTRACTS.md#autenticação-local-de-demonstração)
- [Decisões de arquitetura](../../guides/ARCHITECTURE.md#autenticação-de-demonstração)
- [Instruções para testar](../../README.md#testar-criação-de-conta-login-e-logout)


## Complemento — etapa 1 da adequação ao desafio

O browser passa a preparar duas contas fictícias preexistentes (`alice@kurio.test` e `bruno@kurio.test`), ambas com a senha pública `Kurio123!`. IDs, salts e hashes PBKDF2 são fixtures estáveis; senha em claro não entra no store. O seed versionado preserva cadastros existentes e não recria fixtures expiradas em cada refresh. Reset e restauração após limpar/corromper o armazenamento recuperam as duas contas, sem autenticar automaticamente. Testes isolados habilitam esse comportamento explicitamente.

A sessão compartilhada atual permanece nesta etapa. Sua migração para sessão independente por aba, com preservação das contas/perfis/carteiras, será executada na etapa 2. Os contratos das próximas etapas estão em [COMMERCE_CONTRACTS.md](../COMMERCE_CONTRACTS.md).
