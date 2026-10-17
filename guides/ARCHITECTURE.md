# Arquitetura e decisões implementadas

Use [ARCHITECTURE.md](../ARCHITECTURE.md) como referência para o comportamento e as decisões arquiteturais que já existem no projeto. Este guia complementar define o formato das próximas mudanças:

- Mantenha as features independentes e siga o fluxo View → hook/ViewModel → usecase → interface de repository.
- Deixe DTOs, schemas e implementações na camada `data/`; o domínio contém modelos e regras puros.
- Componha dependências na raiz da feature e mantenha HTTP e realtime atrás de contratos.
- Extraia seções da tela e responsabilidades coesas em componentes próprios; mantenha a página como composição.
- Registre mudanças de contrato ou decisões estruturais em `docs/` e atualize a documentação canônica quando o comportamento mudar.

Para estrutura de pastas e criação de módulos, consulte [ARCH.md](ARCH.md) e [MODULE.md](MODULE.md). Para contratos MSW/Socket.IO, consulte [docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md).
