// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NFT_IMAGE_URLS, createNftFixtures } from './fixtures';
import { MOCK_STORAGE_KEY, createMockStore } from './store';

describe('mock persistence', () => {
  it('recupera alterações após recriar o runtime e restaura fixtures no reset', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const first = createMockStore(storage);
    const state = first.read();
    state.nfts[0].editions[0].priceEth = '1.000000000000000001';
    state.nfts[0].version = 2;
    first.write(state);
    const second = createMockStore(storage);
    expect(second.read().nfts[0]).toEqual(state.nfts[0]);
    second.reset();
    expect(createMockStore(storage).read().nfts[0].editions[0].priceEth).toBe('1.19');
    values.set(MOCK_STORAGE_KEY, '{broken');
    expect(createMockStore(storage).read().nfts).toHaveLength(36);
  });

  it('preenche as imagens das fixtures antigas que ficaram salvas sem imageUrl', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const previousState = {
      schemaVersion: 1,
      scenario: 'default',
      sequence: 0,
      nfts: createNftFixtures().map((nft) => ({ ...nft, imageUrl: null })),
    };
    values.set(MOCK_STORAGE_KEY, JSON.stringify(previousState));

    const restoredNfts = createMockStore(storage).read().nfts;

    expect(restoredNfts.slice(0, NFT_IMAGE_URLS.length).map((nft) => nft.imageUrl)).toEqual(
      NFT_IMAGE_URLS
    );
  });

  it('migra edições antigas para as opções selecionáveis sem perder preço e disponibilidade', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const previousState = {
      schemaVersion: 1,
      scenario: 'default',
      sequence: 0,
      nfts: createNftFixtures().map((nft) => ({
        ...nft,
        editions: [{ id: 'standard', name: 'Standard', priceEth: '1.19', available: 7 }],
      })),
    };
    values.set(MOCK_STORAGE_KEY, JSON.stringify(previousState));

    const restoredNft = createMockStore(storage).read().nfts[0];

    expect(restoredNft.editions.map((edition) => edition.name)).toEqual([
      '1/10',
      '1/1',
      '1/50',
      'ABERTA',
    ]);
    expect(restoredNft.editions[0]).toMatchObject({
      id: 'standard',
      priceEth: '1.19',
      available: 7,
    });
  });
});

describe('NFT mock fixtures', () => {
  it('varia edições, preços e disponibilidade entre NFTs', () => {
    const nfts = createNftFixtures();

    expect(nfts[0].editions.map((edition) => edition.name)).toEqual([
      '1/10',
      '1/1',
      '1/50',
      'ABERTA',
    ]);
    expect(nfts[1].editions.map((edition) => edition.name)).toEqual(['1/10', '1/1']);
    expect(nfts[2].editions.map((edition) => edition.name)).toEqual(['1/50', '1/10']);
    expect(nfts[3].editions.map((edition) => edition.name)).toEqual(['ABERTA', '1/50']);
    expect(nfts[5].editions.map((edition) => edition.name)).toEqual(['1/1']);
    expect(nfts[0].editions[0].priceEth).not.toBe(nfts[1].editions[0].priceEth);
    expect(nfts[0].editions[0].available).not.toBe(nfts[1].editions[0].available);
  });
});
