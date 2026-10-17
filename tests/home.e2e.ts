import { expect, test } from '@playwright/test';

test('abre a página inicial', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Kurio — Marketplace de NFTs');
  const heading = page.getByRole('heading', { level: 1 });
  const heroBackgroundImage = await page
    .locator('#inicio')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  if (test.info().project.name === 'mobile') {
    await expect(heading.locator('span').first()).toBeVisible();
    await expect(heading.locator('span').first()).toHaveText('SEJA DONO DA CULTURA DIGITAL');
    expect(heroBackgroundImage).toContain('linear-gradient');
  } else {
    await expect(heading.locator('span').nth(1)).toBeVisible();
    await expect(heading.locator('span').nth(1)).toHaveText(/OWN THE FUTURE OF\s*DIGITAL ART/);
    expect(heroBackgroundImage).toBe('none');
  }
});

test('mostra dois NFTs por linha com as colunas desencontradas no mobile', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');

  await page.goto('/');
  const cards = page.getByRole('link', { name: /^Ver / });
  await expect(cards).toHaveCount(9);

  const firstCard = await cards.nth(0).boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(secondCard!.x).toBeGreaterThan(firstCard!.x);
  expect(secondCard!.y - firstCard!.y).toBeGreaterThan(20);

  await expect(
    page.getByRole('textbox', { name: 'Buscar NFTs por nome ou artista' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Filtros do catálogo' }).click();
  await expect(page.getByRole('dialog', { name: 'Filtros do catálogo' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Faixa de preço em ETH' })).toBeVisible();
});

test('exibe paginação no catálogo do início', async ({ page }, testInfo) => {
  await page.goto('/?limit=12');
  const pagination = page.getByRole('navigation', { name: 'Paginação' });
  const cards = page.getByRole('link', { name: /^Ver / });

  await expect(pagination).toBeVisible();
  await expect(cards).toHaveCount(9);
  if (testInfo.project.name === 'desktop') {
    const paginationBounds = await pagination.boundingBox();
    const featuredBounds = await page
      .getByRole('heading', { name: 'NFT EM DESTAQUE' })
      .locator('xpath=../..')
      .boundingBox();

    expect(paginationBounds).not.toBeNull();
    expect(featuredBounds).not.toBeNull();
    expect(paginationBounds!.y + paginationBounds!.height).toBeCloseTo(
      featuredBounds!.y + featuredBounds!.height,
      0
    );
  }

  await page.getByRole('button', { name: 'Página 2' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('link', { name: 'Ver Kurio Ape #051' })).toBeVisible();
  await expect(cards).toHaveCount(9);
  await expect(page.getByRole('button', { name: 'Página 4' })).toBeVisible();
});

test('abre os detalhes ao selecionar um NFT e permite trocar a edição e a aba', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver Emerald Ape #042' }).click();

  await expect(page).toHaveURL(/\/market\/nft-001$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.getByText('1.19 ETH')).toBeVisible();
  if (!mobile) {
    await expect(page.getByRole('button', { name: 'Comprar', exact: true })).toHaveCSS(
      'width',
      '160px'
    );
    await expect(page.getByRole('button', { name: 'Favoritar', exact: true })).toHaveCSS(
      'width',
      '160px'
    );
  }
  const editions = ['1/10', '1/1', '1/50', 'ABERTA'];
  for (const edition of editions) {
    await expect(page.getByRole('button', { name: edition, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: '1/1', exact: true }).click();
  await expect(page.getByText('2.01 ETH')).toBeVisible();
  await expect(page.getByRole('button', { name: '1/1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  if (!mobile) {
    await page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' }).click();
    await expect(page.getByRole('heading', { name: 'Marina Costa' })).toBeVisible();
  }
});

test('mantém os controles de compra estáveis ao trocar a edição e alinha as avaliações à direita', async ({
  page,
}) => {
  for (const width of [768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/market/nft-001');

    const editionOption = page.getByRole('button', { name: '1/50', exact: true });
    await editionOption.scrollIntoViewIfNeeded();
    const scrollBeforeSelection = await page.evaluate(() => window.scrollY);
    const quantityButton = page.getByRole('button', { name: 'Diminuir quantidade' });
    const buyButton = page.getByRole('button', { name: 'Comprar', exact: true });
    const favoriteButton = page.getByRole('button', { name: 'Favoritar', exact: true });
    const controlsBeforeSelection = await Promise.all([
      quantityButton.boundingBox(),
      buyButton.boundingBox(),
      favoriteButton.boundingBox(),
    ]);
    const rating = page.getByText('19 avaliações de colecionadores').locator('xpath=..');
    const ratingBounds = await rating.boundingBox();
    const ratingRowBounds = await rating.locator('xpath=..').boundingBox();
    const documentPositionsBeforeSelection = await Promise.all(
      controlsBeforeSelection.map((bounds) => page.evaluate((y) => y + window.scrollY, bounds!.y))
    );

    expect(controlsBeforeSelection.every(Boolean), `controles antes, viewport ${width}px`).toBe(
      true
    );
    expect(ratingBounds, `avaliações, viewport ${width}px`).not.toBeNull();
    expect(ratingRowBounds, `linha de preço, viewport ${width}px`).not.toBeNull();
    expect(ratingBounds!.x + ratingBounds!.width).toBeCloseTo(
      ratingRowBounds!.x + ratingRowBounds!.width,
      0
    );

    await editionOption.click();
    const scrollAfterSelection = await page.evaluate(() => window.scrollY);
    const documentPositionsAfterSelection = await Promise.all([
      quantityButton.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
      buyButton.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
      favoriteButton.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
    ]);
    expect(scrollAfterSelection, `scroll da página, viewport ${width}px`).toBe(
      scrollBeforeSelection
    );
    expect(documentPositionsAfterSelection).toEqual(documentPositionsBeforeSelection);
    const controlsAfterSelection = await Promise.all([
      quantityButton.boundingBox(),
      buyButton.boundingBox(),
      favoriteButton.boundingBox(),
    ]);

    expect(controlsAfterSelection.every(Boolean), `controles depois, viewport ${width}px`).toBe(
      true
    );
    for (let index = 0; index < controlsBeforeSelection.length; index += 1) {
      expect(
        controlsAfterSelection[index]!.y,
        `posição do controle ${index}, viewport ${width}px`
      ).toBeCloseTo(controlsBeforeSelection[index]!.y, 0);
    }
  }
});

test('selecionar uma edição por toque não desloca a página', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/market/nft-001');
  const editionOption = page.getByRole('button', { name: '1/50', exact: true });
  await editionOption.scrollIntoViewIfNeeded();
  const scrollBeforeSelection = await page.evaluate(() => window.scrollY);
  const controls = [
    page.getByRole('button', { name: 'Diminuir quantidade' }),
    page.getByRole('button', { name: 'Comprar', exact: true }),
    page.getByRole('button', { name: 'Adicionar aos favoritos', exact: true }),
  ];
  const positionsBeforeSelection = await Promise.all(
    controls.map((control) => control.evaluate((element) => element.getBoundingClientRect().top))
  );
  const optionBounds = await editionOption.boundingBox();
  await page.touchscreen.tap(
    optionBounds!.x + optionBounds!.width / 2,
    optionBounds!.y + optionBounds!.height / 2
  );
  await expect(editionOption).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBeforeSelection);
  const positionsAfterSelection = await Promise.all(
    controls.map((control) => control.evaluate((element) => element.getBoundingClientRect().top))
  );
  expect(positionsAfterSelection).toEqual(positionsBeforeSelection);
});

test('o menu do Mercado navega para Início e para o catálogo', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile');

  await page.goto('/market/nft-001');
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' });

  await navigation.getByRole('link', { name: 'Início' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /OWN THE FUTURE OF DIGITAL ART|SEJA DONO DA CULTURA DIGITAL/,
    })
  ).toBeVisible();

  await navigation.getByRole('link', { name: 'Mercado' }).click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#catalogo');
  await expect(page.locator('#catalogo')).toBeVisible();
});

test('exibe a navegação inferior no mobile e permite abrir o catálogo e o carrinho', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');

  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Navegação inferior' });
  await expect(navigation).toBeVisible();
  const navigationBounds = await navigation.boundingBox();
  const viewport = page.viewportSize();
  expect(navigationBounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(navigationBounds!.y + navigationBounds!.height).toBeCloseTo(viewport!.height, 0);
  await expect(navigation.getByRole('link', { name: 'Início' })).toHaveAttribute(
    'aria-current',
    'page'
  );

  await navigation.getByRole('link', { name: 'Explorar NFTs' }).click();
  await expect(page).toHaveURL(/#catalogo$/);
  await expect(page.locator('#catalogo')).toBeVisible();

  await navigation.getByRole('link', { name: /^Carrinho,/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('alinha a largura do menu e do conteúdo com a largura do footer', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile');

  for (const route of ['/', '/market/nft-001']) {
    await page.goto(route);
    const header = await page.locator('header').first().boundingBox();
    const footer = await page.locator('#footer').boundingBox();
    const content = await (route === '/'
      ? page.locator('#catalogo > div > div').first()
      : page.getByRole('navigation', { name: 'Trilha de navegação' }).locator('xpath=..')
    ).boundingBox();
    const expectedWidth = footer?.width;

    expect(header).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(content).not.toBeNull();
    expect(header!.x).toBeCloseTo(footer!.x, 0);
    expect(header!.width).toBeCloseTo(expectedWidth!, 0);
    expect(content!.x).toBeCloseTo(footer!.x, 0);
    expect(content!.width).toBeCloseTo(expectedWidth!, 0);
  }
});

test('mostra somente as edições disponíveis para o NFT selecionado', async ({ page }) => {
  await page.goto('/market/nft-002');

  await expect(page.getByRole('button', { name: '1/10', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '1/1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '1/50', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ABERTA', exact: true })).toHaveCount(0);
  await expect(page.getByText('0.02 ETH')).toBeVisible();
  await page.getByRole('button', { name: '1/1', exact: true }).click();
  await expect(page.getByText('2.02 ETH')).toBeVisible();
});

test('mostra estado de não encontrado para um NFT removido', async ({ page }) => {
  await page.goto('/market/missing');
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao catálogo' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
});

test('usa somente a arte do NFT selecionado e exibe avaliações de colecionadores', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'Galeria, avaliações e compartilhamento pertencem ao layout desktop.'
  );
  await page.goto('/market/nft-023');
  const artwork = page.getByRole('img', { name: 'GreenMint #023, arte digital colecionável' });
  await expect(artwork).toHaveAttribute(
    'src',
    '/images/9df2ff42dd27ba657621c304557d1a855a4be6a5.webp'
  );
  const thumbnails = page.getByRole('button', { name: /^Ver imagem/ });
  await expect(thumbnails).toHaveCount(4);
  for (const thumbnail of await thumbnails.all()) {
    await expect(thumbnail.locator('img')).toHaveAttribute(
      'src',
      '/images/9df2ff42dd27ba657621c304557d1a855a4be6a5.webp'
    );
  }

  await page.getByRole('tab', { name: 'Avaliações de colecionadores (19)' }).click();
  await expect(page.getByRole('heading', { name: 'Marina Costa' })).toBeVisible();
  await expect(
    page.getByText('A arte chegou com procedência verificada e o processo de compra foi simples.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compartilhar no LinkedIn' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compartilhar por e-mail' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Compartilhar no Twitter' })).toBeVisible();
  await expect(page.getByText('(5.0)')).toHaveCount(0);
});

test('migra uma edição Standard salva anteriormente para opções selecionáveis', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'greenmint:mocks:v1',
      JSON.stringify({
        schemaVersion: 1,
        scenario: 'default',
        sequence: 0,
        nfts: [
          {
            id: 'nft-001',
            name: 'Emerald Ape #042',
            description: 'NFT fictício para os cenários de demonstração.',
            imageUrl: '/images/8459204731e6eba9d474cbc8ebc37071360d3ba5.png',
            artist: 'Nova Sato',
            collection: 'Kurio Apes',
            category: 'art',
            network: 'ethereum',
            editions: [{ id: 'standard', name: 'Standard', priceEth: '1.19', available: 7 }],
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
    );
  });
  await page.goto('/market/nft-001');

  await expect(page.getByRole('button', { name: 'Standard', exact: true })).toHaveCount(0);
  for (const edition of ['1/1', '1/10', '1/50', 'ABERTA']) {
    await expect(page.getByRole('button', { name: edition, exact: true })).toBeVisible();
  }
  await expect(page.getByText('1.19 ETH')).toBeVisible();
  await page.getByRole('button', { name: '1/50', exact: true }).click();
  await expect(page.getByRole('button', { name: '1/50', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.getByText('0.01 ETH')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
});

test('recupera uma rota inexistente após acesso direto e refresh', async ({ page }) => {
  await page.goto('/rota-inexistente');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao início' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /OWN THE FUTURE OF DIGITAL ART|SEJA DONO DA CULTURA DIGITAL/,
    })
  ).toBeVisible();
});
