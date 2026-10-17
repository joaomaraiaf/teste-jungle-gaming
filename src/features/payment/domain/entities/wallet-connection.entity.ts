export type WalletProvider = 'metamask' | 'coinbase' | 'walletconnect';
export type WalletNetwork = 'ethereum' | 'polygon' | 'solana';
export interface WalletConnectionInput {
  walletSlot: 'primary' | 'secondary';
  network: WalletNetwork;
  provider: WalletProvider;
}
export interface WalletConnection extends WalletConnectionInput {
  id: string;
  userId: string;
  walletAddress: string;
  status: 'connected' | 'refused' | 'disconnected';
  version: number;
}
