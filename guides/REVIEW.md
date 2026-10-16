# Revisão

Revise o diff da tarefa quando Git estiver disponível. Se não houver metadados Git, inspecione os arquivos alterados e compare-os com a versão de referência fornecida.

Classifique achados acionáveis com arquivo/linha, impacto e correção:

- P0: vazamento entre usuários/segredos; ausência efetiva de stack obrigatória; compra falsa; domínio dependente de infraestrutura.
- P1: contratos não tipados, validação ausente, cache incoerente, respostas obsoletas, erro engolido, retry não idempotente ou acessibilidade que bloqueia fluxo.
- P2: convenções, duplicação ou lacunas menores de teste/documentação.

Confira domínio isolado; View → hook → usecase → repository; Axios centralizado; Zod nas bordas; isolamento por usuário; limpeza de listeners; estados de loading/vazio/erro; teclado/foco; tipos, lint, testes e build.

Não exija tracing, Next, backend real, CRUD administrativo ou convenções removidas. Requisitos específicos do desafio orientam as próximas features.
