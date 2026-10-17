# ADR 0008 — Persistência da carteira informada no checkout

Data: 2026-10-16

Status: aceita

## Contexto

A tela de pagamento já solicita os dados da carteira necessários para concluir a compra. Porém, o fluxo de conexão usava somente carteiras previamente cadastradas. Assim, mesmo com o formulário completo, uma pessoa sem carteira salva era impedida de prosseguir e precisava sair do checkout para cadastrá-la.

O checkout do projeto é simulado por mocks e não comprova a posse de uma carteira em uma blockchain. Nesse contexto, exigir um cadastro separado antes da compra duplicava informações já fornecidas no formulário.

## Decisão

Antes da conexão simulada, o checkout consulta as carteiras salvas da conta e procura uma que corresponda à rede, ao endereço e ao tipo de carteira informados. Se encontrar uma correspondência, reutiliza esse registro. Caso contrário, salva os dados preenchidos e então inicia a conexão.

Quando a conta ainda não tem carteira principal, os dados são salvos como principal. Quando já existe uma carteira principal, a escolha de carteira secundária do formulário determina o espaço usado; ao escolher a principal com dados diferentes, o registro principal é atualizado. Se a carteira secundária estiver vinculada à principal, o vínculo é removido antes de salvar os dados independentes. O formulário é atualizado para refletir o espaço escolhido, e a conexão simulada valida que o endereço conectado corresponde ao endereço informado.

A preparação da carteira ocorre somente depois que a cotação é revalidada e aceita. Portanto, uma cotação inválida não salva os dados da carteira nem inicia a conexão. Os demais dados do colecionador continuam sendo usados no pedido conforme o fluxo existente.

## Consequências e validação

A pessoa pode concluir o checkout sem cadastrar a carteira em uma etapa separada, e os dados informados ficam disponíveis como carteira salva para compras futuras. No ambiente de mocks, essa persistência não representa uma assinatura criptográfica, verificação de posse ou transação real.

Os testes de checkout cobrem a compra sem carteira previamente salva e a persistência dos dados informados. A conexão e a criação do pedido continuam sujeitas à revalidação da cotação, à sessão ativa e às validações existentes do fluxo.
