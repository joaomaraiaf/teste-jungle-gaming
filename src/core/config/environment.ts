const mocksFlag = import.meta.env.VITE_MOCKS_ENABLED;
if (mocksFlag !== undefined && mocksFlag !== 'true' && mocksFlag !== 'false') {
  throw new Error('VITE_MOCKS_ENABLED deve ser true ou false.');
}

export const environment = {
  mocksEnabled: mocksFlag === 'true',
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || window.location.origin,
};
