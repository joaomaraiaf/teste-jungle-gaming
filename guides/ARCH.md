# Arquitetura

Feature-first + Clean Architecture + MVVM.

```text
src/
  routes/                    # rotas TanStack Router, composição de Views
  core/                      # UI, HTTP, providers e utilitários sem negócio
  features/<feature>/
    domain/entities/         # modelos puros
    domain/repositories/     # contratos
    domain/usecases/         # regras de negócio
    data/dtos/               # contratos de transporte
    data/schemas/            # Zod
    data/repositories/       # implementações dos contratos
    hooks/                   # ViewModels e integração com Query
    components/              # Views
  styles/
```

Fluxo: componente → hook → usecase → contrato do repository. `data/` implementa o contrato e usa `IHttpClient`. Domínio nunca importa `data/`, React, Axios ou hooks. DTOs não devem vazar para contratos do domínio; compartilhe os modelos puros quando as formas forem iguais. Validação de formulários/transporte fica nas bordas; invariantes de negócio ficam no domínio.

Views de página devem atuar principalmente como composição: conectam o ViewModel às seções da tela, sem concentrar a implementação de todas elas. Extraia seções com responsabilidade própria para componentes da feature (por exemplo, sidebar, listagem, promoções e diário do catálogo) e cartões repetidos para componentes próprios quando tiverem estrutura, estilo ou comportamento identificável. Mantenha cada componente focado numa responsabilidade; não fragmente elementos triviais sem benefício de leitura, reutilização ou teste.

Use `.map()` para renderizar coleções em React, como resultados da API em cartões ou opções de filtros em botões, sempre com uma `key` estável. Isso não significa transformar ou copiar os dados da API antes de renderizá-los. Evite mapeamentos de identidade ou conversões sem necessidade, especialmente no repository; converta os dados somente quando a forma do transporte diferir da forma usada pelo domínio.

A composição/DI de repositories e usecases fica fora do domínio, em um arquivo na raiz da feature. Não crie abstrações ou camadas vazias além do esqueleto do generator sem necessidade concreta.
