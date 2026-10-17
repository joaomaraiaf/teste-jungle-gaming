import type { NftDto, NftEditionDto } from '@/features/catalog/data/dtos/catalog.dto';

export const NFT_IMAGE_URLS = [
  '/images/2986a7cb16d09de8970824d2dd58bf0bb021702c.webp',
  '/images/87580f2def9af0ce13f4b6f6ce17bb2449bcfc16.webp',
  '/images/9df2ff42dd27ba657621c304557d1a855a4be6a5.webp',
  '/images/8459204731e6eba9d474cbc8ebc37071360d3ba5.webp',
] as const;

const editionProfiles = [
  ['standard', 'edition-one', 'edition-fifty', 'edition-open'],
  ['standard', 'edition-one'],
  ['edition-fifty', 'standard'],
  ['edition-open', 'edition-fifty'],
  ['standard', 'edition-open', 'edition-one'],
  ['edition-one'],
] as const;

function createNftEditions(index: number): NftEditionDto[] {
  const unavailable = index === 23;
  const profile = editionProfiles[index % editionProfiles.length];
  const editions: Record<(typeof editionProfiles)[number][number], NftEditionDto> = {
    standard: {
      id: 'standard',
      name: '1/10',
      priceEth: index === 0 ? '1.19' : `0.${String(index + 1).padStart(2, '0')}`,
      available: unavailable ? 0 : 10 - (index % 7),
    },
    'edition-one': {
      id: 'edition-one',
      name: '1/1',
      priceEth: `2.${String(index + 1).padStart(2, '0')}`,
      available: unavailable ? 0 : 1,
    },
    'edition-fifty': {
      id: 'edition-fifty',
      name: '1/50',
      priceEth: `0.${String(index + 1).padStart(2, '0')}`,
      available: unavailable ? 0 : 50 - (index % 11),
    },
    'edition-open': {
      id: 'edition-open',
      name: 'ABERTA',
      priceEth: `0.${String(index + 20).padStart(2, '0')}`,
      available: unavailable ? 0 : 100 - (index % 21),
    },
  };

  return profile.map((editionId) => editions[editionId]);
}

export function createNftFixtures(): NftDto[] {
  return Array.from({ length: 36 }, (_, index) => ({
    id: `nft-${String(index + 1).padStart(3, '0')}`,
    name:
      index === 0
        ? 'Emerald Ape #042'
        : index < 12
          ? `Kurio Ape #${String(42 + index).padStart(3, '0')}`
          : `GreenMint #${String(index + 1).padStart(3, '0')}`,
    description: 'NFT fictício para os cenários de demonstração.',
    imageUrl: index === 0 ? NFT_IMAGE_URLS[3] : NFT_IMAGE_URLS[index % NFT_IMAGE_URLS.length],
    artist: index < 6 ? 'Nova Sato' : index % 2 === 0 ? 'Luna' : 'Kai',
    collection: index < 12 ? 'Kurio Apes' : index % 2 === 0 ? 'Genesis' : 'Jungle',
    category: (['art', 'photography', 'gaming'] as const)[index % 3],
    network: index % 6 === 5 ? 'solana' : index % 2 === 0 ? 'ethereum' : 'polygon',
    editions: createNftEditions(index),
    version: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }));
}
