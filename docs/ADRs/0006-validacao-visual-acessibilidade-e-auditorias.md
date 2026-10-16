# ADR 0006 — Evidências reproduzíveis de qualidade

- Status: aceita
- Data: 2026-10-16

## Contexto

O desafio exige comportamentos sob falha, acessibilidade, regressão visual e medições Lighthouse, além dos fluxos de compra. Screenshots avulsos e checks de posicionamento não substituem baselines comparáveis; dados/eventos aleatórios tornam resultados instáveis.

## Decisão

Manter Playwright como teste de navegador, ampliando cenários pela rede MSW/Socket.IO. Controles por aba permitem latência por caminho/termo, HTTP/rede e bloqueios liberados explicitamente para observar carregamento. O relógio é fixado quando a regra depende do tempo; asserções esperam condições observáveis, sem sleeps arbitrários.

Executar axe nas telas obrigatórias em 390/768/1440, com checks de overflow, foco e zoom de texto. Shimmer mantém caixas estáveis e desativa animação com movimento reduzido. Avisos de preço e estoque permanecem separados e acessíveis. Notificações informativas não interceptam controles; fechar permanece interativo. Logout redireciona pelo ViewModel/provider persistente, sem depender de callbacks de Views desmontadas.

Versionar 12 baselines Chromium para início/detalhe/carrinho/pagamento, com locale, fuso, relógio, fontes, fixtures e dimensões fixos. O ambiente canônico é macOS com Chromium do Playwright 1.58.2; mudanças de baseline exigem inspeção visual.

Lighthouse usa presets mobile/desktop, build completo com mocks, perfil novo a cada medição e execução sequencial. São três medições por página/perfil. Relatórios HTML/JSON e medianas incluem condições, versões e LCP/CLS/TBT. Não remover imagens, fontes, mocks ou funcionalidades para elevar pontuação; metas não atingidas continuam pendentes e devem ter causa documentada.

Limitar a detecção de classes Tailwind ao código em src: relatórios HTML não podem alterar o CSS gerado.

Aplicar otimizações comuns a toda a aplicação: WebP responsivo, fontes locais latinas, prioridade para recursos iniciais, rotas/modais/menus sob demanda e download paralelo do runtime de mocks e aplicação. O Socket.IO só é executado após os interceptors, mesmo quando seu arquivo é antecipado por modulepreload.

## Consequências

Evidências ficam reproduzíveis e falhas reais não são escondidas por retries de mutations ou atualização automática de screenshots. Há manutenção adicional dos cenários, baselines e relatórios. Axe não comprova sozinho acessibilidade integral; medições locais não comprovam performance de uma URL pública.

