export interface CollectorProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  ensName: string;
  walletAlias: string;
  avatarDataUrl: string | null;
}

export interface UpdateProfileInput extends Omit<CollectorProfile, 'id'> {
  passwordChange?: { currentPassword: string; newPassword: string };
}
