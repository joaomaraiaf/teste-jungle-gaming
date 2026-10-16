# Auditorias e evidências

## Lighthouse

Executado em 2026-10-16 com `pnpm audit:lighthouse`: build otimizado com mocks completos, Chromium do Playwright, perfis novos, presets oficiais mobile/desktop e throttling simulado. Execuções sequenciais, sem suíte de navegador concorrente. Fontes, imagens e funcionalidades permanecem habilitadas. Versões, CPU, sistema, condições e hash do build constam em [summary.json](lighthouse/summary.json).

Foram realizadas três medições por página/perfil, totalizando 12. Valores abaixo são medianas:

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 84 | 100 | 100 | 100 | 4178 ms | 0.0000 | 88 ms |
| Detalhe | Mobile | 83 | 100 | 100 | 100 | 4225 ms | 0.0000 | 69 ms |
| Início | Desktop | 97 | 97 | 100 | 100 | 1121 ms | 0.0050 | 101 ms |
| Detalhe | Desktop | 96 | 97 | 100 | 100 | 1122 ms | 0.0836 | 0 ms |

**Pendência de qualidade:** performance mobile não atingiu 90. Não declarar conformidade integral ou todas as metas aprovadas. O comando retorna código 1 quando uma meta fica abaixo do solicitado. A existência dos relatórios comprova a auditoria, não o cumprimento da meta.

Relatórios HTML de cada grupo: [início mobile](lighthouse/inicio-mobile-1.html), [detalhe mobile](lighthouse/detalhe-mobile-1.html), [início desktop](lighthouse/inicio-desktop-1.html), [detalhe desktop](lighthouse/detalhe-desktop-1.html). As execuções 2/3 e os JSON correspondentes estão na mesma pasta.

## Análise dos resultados

A limitação mobile é principalmente LCP/primeira renderização, não CLS ou bloqueio prolongado da thread. O runtime MSW completo é carregado antes da aplicação: seu chunk tem cerca de 472 kB minificados/174 kB gzip; React/Router e validação também participam da inicialização. Os relatórios de dependências e JavaScript não usado identificam essa cadeia. A associação com o LCP é uma interpretação dos relatórios, não uma medição isolada de cada biblioteca.

Foram aplicados WebP 256/512/1024, srcSet, prioridades de imagens/fontes, subconjuntos latinos locais, carregamento sob demanda de rotas/modais/menus, antecipação da rota inicial e download paralelo da aplicação/mocks. O transporte Socket.IO inicia em segundo plano após MSW, com recuperação de falha e teardown. O build deixou de emitir o aviso de chunks acima de 500 kB. Os PNG originais foram preservados para compatibilidade e reprodução do otimizador.

O feedback de refetch passou a sobrepor a página sem deslocar o conteúdo. Acessibilidade/SEO foram corrigidos com hierarquia de títulos, nome acessível incluindo texto visível, áreas de toque dos indicadores e robots.txt válido. Contraste foi verificado pelo axe/Lighthouse; os ajustes de acessibilidade estão em ARCHITECTURE.md.

Diagnósticos anteriores compararam o método simulado e throttling real DevTools; o método real também ficou abaixo da meta. Não foi escolhido um perfil mais leve para elevar a nota. A série versionada mantém os presets simulados, sem enfraquecer CPU/rede, desativar mocks ou remover conteúdo. A próxima otimização precisa reduzir a cadeia de inicialização preservando essa condição; a medição pública só ocorrerá após o deploy.

## Reprodução limpa e testes

[VALIDATION.md](../VALIDATION.md) descreve comandos, ambiente e baselines. O verificador de cópia limpa registra passos/códigos em `clean-checkout.json`, incluindo o resultado separado das metas Lighthouse. A reprodução local do smoke de publicação não substitui validação da URL pública.
