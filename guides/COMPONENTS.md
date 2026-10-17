# Componentes

- Primitivos shadcn: `src/core/components/ui/`. Blocos reutilizáveis: `core/components/forms` e `dialogs`.
- Views de negócio: `features/<feature>/components`. Views consomem ViewModels, sem chamar HTTP/repository/usecase diretamente.
- React SPA: não use diretivas `use client`, APIs de servidor ou imports de Next.
- Componentes em PascalCase, arquivos kebab-case e props em `interface NomeProps`.
- Use `cn`, Tailwind e lucide-react. Primitivos com variantes usam `cva`, `VariantProps`, atributos nativos e `data-slot`.
- Formulários: React Hook Form + `zodResolver`; reutilize `AppForm` e `FormFieldFactory`. Tipos disponíveis: texto, email, senha e select.
- Associe label, input e erro; preserve teclado, foco visível e foco dos diálogos. Não registre valores de campos no console.
- Loading usa skeleton com dimensões estáveis. Use Skeleton compartilhado com shimmer e movimento reduzido; atualizações em segundo plano preservam o conteúdo já carregado.
- Use TanStack Router `Link` para navegação interna.
