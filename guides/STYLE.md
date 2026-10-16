# Estilo

Use Biome: `pnpm lint`, `pnpm lint:fix`, `pnpm format:check`, `pnpm format:fix`.

Aspas simples no TS/JSX, ponto e vírgula, indentação de 2 espaços e largura de 100. Use o formatter, não formatação manual concorrente.

Use medidas relativas em `rem` para espaçamento, dimensões e tipografia. Prefira a escala padrão do Tailwind (`gap-4`, `mt-8`, `text-sm`); quando ela não atender ao design, use um valor arbitrário em `rem` (por exemplo, `w-[22rem]`). Não introduza valores em `px` para essas propriedades.

Há utilities com valores em `px` em componentes visuais existentes, incluindo primitivos shadcn e medidas extraídas do Figma. Trate-os como dívida de migração: ao alterar esses estilos, converta as medidas para `rem` e preserve a aparência com a validação visual.

TypeScript strict, alias `@/` para `src/`, arquivos kebab-case. Prefira nomes que expliquem a intenção e componentes pequenos. Evite abstrações sem uso e barrels que exponham detalhes internos.

Não há Husky ou commitlint configurados nesta cópia. Não dependa de hooks locais para executar verificações.
