# CI, segurança e proteção das branches

As GitHub Actions executam lint, TypeScript, Vitest, build mock e Playwright em pushes para `develop`/`main` e em pull requests com destino a essas branches. Os testes usam Chromium e os mocks locais; não exigem API externa. Os relatórios Playwright e Lighthouse ficam disponíveis como artefatos por sete dias.

O workflow `Security` audita dependências de produção e bloqueia severidade alta ou crítica. O audit completo ainda aponta um alerta alto em `braces`, dependência transitiva de desenvolvimento do Plop; o registry não oferece a versão corrigida recomendada pelo advisory, então não há override seguro disponível. A revisão de dependências do pull request bloqueia vulnerabilidades altas/críticas introduzidas por novas dependências, incluindo as de desenvolvimento. CodeQL analisa JavaScript/TypeScript nos pushes, pull requests e semanalmente. Dependabot verifica atualizações de pacotes e Actions semanalmente.

O workflow `Lighthouse` roda em todo pull request para `develop` ou `main`, medindo início e detalhe nos perfis mobile e desktop com três execuções por grupo. Ele falha se as medianas não atingirem Performance 90, Acessibilidade 95, Boas práticas 95 e SEO 90. A série versionada em `docs/audits/lighthouse/summary.md` registra Performance mobile 84 no início e 83 no detalhe; portanto, este check permanecerá vermelho até a otimização mobile alcançar a meta. Os outros checks podem ser usados para proteger as branches enquanto esse trabalho termina; inclua Lighthouse como requisito de merge quando estiver verde.

## Configuração recomendada no GitHub

Crie regras de proteção para `main` e `develop` em **Settings → Branches → Add branch ruleset** (ou **Branch protection rules**, conforme a interface):

- Ative **Do not allow deletions** para impedir que a branch seja apagada.
- Exija pull request antes do merge e, para `main`, use `develop` como origem do fluxo normal.
- Exija que os checks terminem antes do merge. Selecione `CI / quality`, `CI / e2e`, `Security / dependency-audit`, `Security / dependency-review` e `Security / codeql`. O check `Lighthouse / lighthouse-targets` pode ser adicionado quando a meta mobile estiver aprovada.
- Ative **Require conversation resolution**. Exija aprovação de outra pessoa somente se houver alguém disponível para revisar; essa opção pode impedir o merge em um repositório individual.
- Ative **Block force pushes**. Não habilite exceções de bypass para administradores se quiser que a regra também se aplique à sua conta.

As verificações de pull request só aparecem para seleção depois que ao menos uma execução correspondente tiver sido concluída no repositório. Primeiro envie os workflows para `develop`, abra um PR para validar os nomes exibidos e então selecione os checks na regra.

## O que não é automatizado

Esses workflows não publicam na Vercel. O deploy pode ser conectado depois que o projeto e as variáveis estiverem configurados na Vercel; a validação pública continua separada dos testes locais com mocks.
