export interface Collector {
  id: string;
  username: string;
  email: string;
}

export interface AuthSession {
  user: Collector;
  expiresAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  username: string;
}
