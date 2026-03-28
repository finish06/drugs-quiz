import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextValue } from "@/contexts/AuthContext";

const DEFAULT_AUTH: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  // Return safe defaults when used outside AuthProvider
  // (e.g., during hook initialization before provider mounts)
  return ctx ?? DEFAULT_AUTH;
}
