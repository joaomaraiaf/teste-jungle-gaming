import type { CommerceStore } from './commerce-store';
import { createNftFixtures, NFT_IMAGE_URLS } from './fixtures';
import { type MockScenario, type MockState, mockStateSchema } from './mock-state.schema';

export const MOCK_STORAGE_KEY = 'greenmint:mocks:v1';

export function createMockStore(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  const freshState = (scenario: MockScenario = 'default'): MockState => ({
    schemaVersion: 1,
    scenario,
    sequence: 0,
    nfts: createNftFixtures(),
  });
  const restore = (): MockState => {
    const raw = storage?.getItem(MOCK_STORAGE_KEY);
    if (!raw) return freshState();
    try {
      const parsed = mockStateSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return freshState();

      // Local mock state can outlive fixture changes between development runs.
      const fixtures = createNftFixtures();
      const fixturesById = new Map(fixtures.map((nft) => [nft.id, nft]));
      parsed.data.nfts = parsed.data.nfts.map((nft, index) => {
        const fixture = fixturesById.get(nft.id);
        const savedEditions = new Map(nft.editions.map((edition) => [edition.id, edition]));
        const hasAllEditionOptions = fixture?.editions.every((edition) =>
          savedEditions.has(edition.id)
        );

        return {
          ...nft,
          imageUrl: nft.imageUrl ?? NFT_IMAGE_URLS[index % NFT_IMAGE_URLS.length],
          editions:
            fixture && !hasAllEditionOptions
              ? fixture.editions.map((edition) => {
                  const savedEdition = savedEditions.get(edition.id);
                  return savedEdition
                    ? {
                        ...edition,
                        priceEth: savedEdition.priceEth,
                        available: savedEdition.available,
                      }
                    : edition;
                })
              : nft.editions,
        };
      });
      return parsed.data;
    } catch {
      return freshState();
    }
  };
  let state = restore();
  let commerce: CommerceStore | undefined;
  const save = () => storage?.setItem(MOCK_STORAGE_KEY, JSON.stringify(state));
  save();
  return {
    exclusive: <T>(action: () => T | Promise<T>): Promise<T> =>
      commerce ? commerce.exclusive(action) : Promise.resolve().then(action),
    attachCommerce: (store: CommerceStore) => {
      commerce = store;
      const shared = store.read();
      if (!shared.catalog) {
        shared.catalog = structuredClone(state.nfts);
        store.write(shared);
      }
    },
    read: () => {
      if (storage) state = restore();
      return {
        ...structuredClone(state),
        nfts: commerce?.read().catalog ?? structuredClone(state.nfts),
      };
    },
    write: (next: MockState) => {
      const parsed = mockStateSchema.parse(next);
      if (commerce) {
        const shared = commerce.read();
        shared.catalog = parsed.nfts;
        commerce.write(shared);
      }
      state = parsed;
      save();
    },
    reset: (scenario: MockScenario = 'default') => {
      state = freshState(scenario);
      if (commerce) {
        const shared = commerce.read();
        shared.catalog = structuredClone(state.nfts);
        commerce.write(shared);
      }
      save();
    },
  };
}
export type MockStore = ReturnType<typeof createMockStore>;
