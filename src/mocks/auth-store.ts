import { activityListSchema } from '@/features/activity/data/schemas/activity.schema';
import { collectorSchema } from '@/features/auth/data/schemas/auth-session.schema';
import { storedProfileSchema } from '@/features/profile/data/schemas/profile.schema';
import { savedWalletsSchema } from '@/features/wallets/data/schemas/wallet.schema';
import { z } from 'zod';
import { DEMO_ACCOUNTS } from './demo-accounts';

export const AUTH_STORAGE_KEY = 'kurio:mock-auth:v1';
export const ACCOUNT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1_000;
export const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1_000;

const accountSchema = z.object({
  user: collectorSchema,
  activity: activityListSchema.default([]),
  wallets: savedWalletsSchema.default({
    primary: null,
    secondary: null,
    secondarySameAsPrimary: false,
  }),
  profile: storedProfileSchema.default({
    displayName: '',
    ensName: '',
    walletAlias: '',
    avatarDataUrl: null,
  }),
  salt: z.string().regex(/^[a-f0-9]{32}$/),
  passwordHash: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int().positive(),
});
export const TAB_SESSION_STORAGE_KEY = 'kurio:mock-session:v1';
const sessionSchema = z.object({ userId: z.uuid(), expiresAt: z.number().int().positive() });
const sharedSchema = z.object({
  schemaVersion: z.literal(2),
  sessionEpoch: z.uuid(),
  demoSeedVersion: z.number().int().nonnegative().default(0),
  guestActivity: activityListSchema.default([]),
  accounts: z.array(accountSchema),
});
const legacySchema = sharedSchema.omit({ schemaVersion: true, sessionEpoch: true });
const stateSchema = sharedSchema.extend({ session: sessionSchema.nullable() });
const tabSessionSchema = sessionSchema.extend({ sessionEpoch: z.uuid() });
type AuthState = z.infer<typeof stateSchema>;
type SharedState = z.infer<typeof sharedSchema>;
type TabSession = z.infer<typeof tabSessionSchema>;
type AuthStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createAuthStore(
  storage?: AuthStorage,
  now = Date.now,
  seedDemoAccounts = false,
  sessionStorage?: AuthStorage
) {
  const freshState = (): SharedState => ({
    schemaVersion: 2,
    sessionEpoch: crypto.randomUUID(),
    accounts: [],
    guestActivity: [],
    demoSeedVersion: 0,
  });
  let shared = freshState();
  let tabSession: TabSession | null = null;
  const saveShared = (next: SharedState) => {
    const validated = sharedSchema.parse(next);
    const serialized = JSON.stringify(validated);
    if (storage && storage.getItem(AUTH_STORAGE_KEY) !== serialized)
      storage.setItem(AUTH_STORAGE_KEY, serialized);
    shared = validated;
  };
  const saveSession = (next: TabSession | null) => {
    const serialized = JSON.stringify(next);
    if (sessionStorage && sessionStorage.getItem(TAB_SESSION_STORAGE_KEY) !== serialized)
      sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, serialized);
    tabSession = next;
  };
  const readShared = () => {
    const raw = storage?.getItem(AUTH_STORAGE_KEY);
    if (!storage) return shared;
    if (!raw) {
      saveShared(freshState());
      return shared;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      saveShared(freshState());
      return shared;
    }
    const current = sharedSchema.safeParse(parsed);
    if (current.success) shared = current.data;
    else {
      const legacy = legacySchema.safeParse(parsed);
      saveShared(legacy.success ? { ...freshState(), ...legacy.data } : freshState());
    }
    return shared;
  };
  const write = (next: AuthState) => {
    const validated = stateSchema.parse(next);
    const previousSession = tabSession;
    const session = validated.session
      ? { ...validated.session, sessionEpoch: validated.sessionEpoch }
      : null;
    saveSession(session);
    try {
      saveShared(validated);
    } catch (error) {
      saveSession(previousSession);
      throw error;
    }
  };
  const read = (): AuthState => {
    readShared();
    if (seedDemoAccounts && shared.demoSeedVersion < 1) {
      const next = structuredClone(shared);
      for (const demo of DEMO_ACCOUNTS) {
        if (
          next.accounts.some(
            (account) =>
              account.user.email === demo.email ||
              account.user.username.toLowerCase() === demo.username.toLowerCase() ||
              account.user.id === demo.id
          )
        )
          continue;
        next.accounts.push(
          accountSchema.parse({
            user: { id: demo.id, username: demo.username, email: demo.email },
            salt: demo.salt,
            passwordHash: demo.passwordHash,
            expiresAt: now() + ACCOUNT_LIFETIME_MS,
          })
        );
      }
      next.demoSeedVersion = 1;
      saveShared(next);
    }
    const accounts = shared.accounts.filter((account) => account.expiresAt > now());
    if (accounts.length !== shared.accounts.length) saveShared({ ...shared, accounts });
    if (sessionStorage) {
      const raw = sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);
      try {
        tabSession = raw ? tabSessionSchema.parse(JSON.parse(raw)) : null;
      } catch {
        saveSession(null);
      }
    }
    if (
      tabSession &&
      (tabSession.sessionEpoch !== shared.sessionEpoch ||
        tabSession.expiresAt <= now() ||
        !accounts.some((account) => account.user.id === tabSession?.userId))
    )
      saveSession(null);
    const session = tabSession
      ? { userId: tabSession.userId, expiresAt: tabSession.expiresAt }
      : null;
    return structuredClone({ ...shared, session });
  };
  return {
    read,
    write,
    reset: () => {
      saveShared(freshState());
      saveSession(null);
      read();
    },
    now,
  };
}

export type AuthStore = ReturnType<typeof createAuthStore>;

export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export async function hashMockPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}
