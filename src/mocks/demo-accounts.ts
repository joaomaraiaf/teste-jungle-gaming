// Public, fictitious evaluation accounts. Only salted PBKDF2 hashes enter persistence.
export const DEMO_ACCOUNTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'AliceDemo',
    email: 'alice@kurio.test',
    salt: '00112233445566778899aabbccddeeff',
    passwordHash: '07191d48a82331cf05349a3bac54e86e8bfcb755196b22e4bcb98074db76e5fa',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    username: 'BrunoDemo',
    email: 'bruno@kurio.test',
    salt: 'ffeeddccbbaa99887766554433221100',
    passwordHash: '8c8f9b9fc60c99b3795b88f7e832818ea5e249decea3941f7f25d2dc64c2f11f',
  },
] as const;
