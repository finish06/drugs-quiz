import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context.js";
import type { AuthUser } from "./auth-context.js";

export { AuthContext } from "./auth-context.js";
export type { AuthContextValue, AuthUser } from "./auth-context.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        // Not authenticated or network error — that's fine
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/auth/google";
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Best effort — clear local state regardless
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
