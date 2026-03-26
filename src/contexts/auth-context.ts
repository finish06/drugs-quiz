import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
