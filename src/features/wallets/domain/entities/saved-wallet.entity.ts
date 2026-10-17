export type WalletSlot = 'primary' | 'secondary';

export interface SavedWallet {
  displayName: string;
  walletAlias: string;
  network: 'ethereum' | 'polygon' | 'solana';
  profileName: string;
  walletAddress: string;
  secondaryWallet: string;
  walletType: 'metamask' | 'coinbase' | 'walletconnect';
  referralCode: string;
  email: string;
  ensName: string;
}

export interface SavedWallets {
  primary: SavedWallet | null;
  secondary: SavedWallet | null;
  secondarySameAsPrimary: boolean;
}
