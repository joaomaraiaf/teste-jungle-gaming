# Tipos e contratos

- Modelos de negócio puros ficam em `domain/entities/`; contratos em `domain/repositories/`.
- DTOs de requisição/resposta ficam em `data/dtos/` e descrevem o transporte.
- Schemas Zod ficam em `data/schemas/`; derive tipos com `z.infer` em vez de duplicá-los.
- Props e estado visual simples podem ficar inline no componente/hook.
- Domínio não importa DTOs ou schemas de `data/`; seus contratos usam modelos próprios puros.
- DTO e Entity com a mesma forma podem compartilhar o tipo puro. Não crie mappers de identidade.
- Quando as formas divergirem, converta em `data/mappers/`, dentro do repository, nunca no componente.
- Não use `any` na fronteira HTTP. Informe o tipo de resposta: `http.get<ResponseDto>(...)`.
- Valide dados externos nas bordas. Tipagem estática não valida JSON em runtime.
- Valores ETH são strings decimais; quantidades inteiras. Os cálculos do domínio de compra usam bigint em wei, sem ponto flutuante.
