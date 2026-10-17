# ADR 0004 — Cotação, carteira simulada e pedidos recuperáveis

Status: aceita. Data: 2026-10-16. Complementa as ADRs 0002 e 0003.

## Contexto

O checkout gravava uma atividade concluída imediatamente e limpava o carrinho no cliente. Não havia pedido pendente, recusa, recuperação depois de refresh ou transação conjunta de estoque e pedido. O comprovante existia somente no estado React.

## Decisão

As features existentes `quotes`, `orders` e `payment` passam a usar repositories HTTP injetados, usecases puros, schemas Zod e ViewModels com TanStack Query. O checkout deixa de chamar `/activity/purchases`. Esse POST retorna 410 no ambiente principal; os helpers antigos permanecem isolados para testar compatibilidade de registros anteriores.

A cotação é um snapshot imutável com itens, versões do catálogo/carrinho/política de preços, rede, cupom e valores decimais calculados em wei. Revalidação cria outro snapshot. Mudança relevante retorna `review-required`; esgotamento retorna `unavailable`. Aceitar revalida outra vez; se algo mudou, exige nova revisão. Só uma cotação aceita e ainda atual pode criar um pedido. O formulário exibe os valores da cotação e exige aceite explícito de alterações antes de habilitar a compra.

Conexões simuladas usam o endereço da carteira principal/secundária cadastrada na conta. No checkout, os dados preenchidos podem ser salvos antes da conexão, conforme a [ADR 0008](0008-persistencia-de-carteira-no-checkout.md). A rede da carteira conectada deve corresponder à rede da cotação; o mock não exige que essa rede corresponda à rede dos NFTs. Há conexão, recusa e desconexão; um pedido pendente pode ser recusado se a carteira for desconectada antes da resolução. Nenhuma extensão ou assinatura real é solicitada.

## Persistência transacional

O store `kurio:mock-commerce:v1` recebe catálogo/estoque, cotações, conexões, pedidos, tentativas e regras de resolução. Defaults migram o payload anterior preservando carrinhos/favoritos. O catálogo passa a ler esse snapshot compartilhado; o registro antigo do catálogo mantém compatibilidade com os controles de cenário. Reset continua vinculado à geração da autenticação.

Operações de comércio usam o mesmo Web Lock `kurio:commerce`, relendo a persistência dentro do bloqueio. O fallback serializa as operações no runtime atual; não oferece exclusão entre abas sem Web Locks. Confirmação grava estoque, pedido terminal, registro de idempotência e remoção das quantidades compradas em um único `setItem`. Falha de persistência não deixa uma confirmação ou baixa parcial. Controles de catálogo também passam pelo bloqueio.

Pedidos novos são `pending` e possuem `resolveAt` persistido. Consultas processam os pedidos vencidos sob bloqueio, sem depender de timer sobrevivendo a um refresh. Não há reserva de estoque: a resolução verifica disponibilidade, preço, cupom, política de preços e conexão. Confirmação/recusa são terminais. Uma confirmação diminui o estoque uma vez e retira somente as quantidades compradas; itens ou quantidades adicionados depois permanecem. Duas tentativas pela última unidade produzem uma confirmação e uma recusa por estoque.

`Idempotency-Key` é UUID isolado por conta, vinculado ao corpo canônico completo. Repetição idêntica recupera o mesmo pedido, mesmo depois de timeout; conteúdo diferente retorna 409. Falha anterior à criação não consome a chave. Valores e itens confirmados não são recalculados no recibo.

## Recuperação e interface

Antes do POST, `kurio:order-attempt:v1:<userId>` no sessionStorage salva chave e corpo; depois, salva também o id. Se essa gravação inicial falhar, o POST não ocorre. Refresh recupera pelo id ou procura a mesma tentativa em `/orders`. Se ela ainda não existir, somente o mesmo corpo e a mesma chave podem ser reenviados. Uma falha de consulta oferece recuperação manual; não é criada outra tentativa enquanto o resultado for desconhecido.

Pedidos pendentes são consultados a cada 500 ms, com revalidação ao focar/voltar online. Erro interrompe o polling até recuperação manual. Recusa permite nova tentativa somente por ação explícita. Troca de conta cancela consultas privadas e callbacks atrasados não preenchem o cache de outra identidade. A tentativa da conta fica preservada para retomada; ela nunca é entregue ao visitante ou a outra conta.

A confirmação usa `/orders/:id/receipt`, com `orderId` na URL e fallback para o último pedido da conta na aba. Apenas pedidos confirmados podem produzir recibo. Atividades consultam `/orders` e projetam os confirmados. Compras antigas das contas são migradas uma vez como pedidos confirmados, sem nova baixa de estoque; histórico visitante não é atribuído a contas.

## Validação e limites

Integração Axios/MSW cobre idempotência, conflito, snapshots, timeout, recusa, desconexão, autenticação, isolamento, migração, cupom expirado, preço alterado, quantidade ajustada, falha de persistência e concorrência pela última unidade. Playwright cobre conexão/recusa/desconexão, revisão explícita, pendência/refresh, timeout/refresh, nova tentativa após recusa e comprovante após refresh, além da regressão existente.

A preparação transacional é necessária nesta etapa. `order.updated`, BroadcastChannel, avisos de estoque entre abas e reconciliação via Socket.IO permanecem para a etapa 5. Os dados são simulados no mesmo navegador/origem; não há pagamento ou blockchain real. A taxa de rede é uma fixture de 0.016 ETH para carrinhos não vazios, com política versionada.
