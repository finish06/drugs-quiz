import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context.js";
import type { AuthUser } from "./auth-context.js";
import { ACHIEVEMENTS_STORAGE_KEY } from "@/hooks/useAchievements";

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
          // AC-011: Migrate guest achievements to server on first sign-in
          migrateGuestAchievementsIfAny();
        }
      } catch {
        // Not authenticated or network error — that's fine
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    /** Migrate guest localStorage achievements to server (AC-011) */
    async function migrateGuestAchievementsIfAny() {
      try {
        const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw) as Record<string, string>;
        const badges = Object.entries(data).map(([badgeId, earnedAt]) => ({ badgeId, earnedAt }));
        if (badges.length === 0) return;

        const res = await fetch("/api/achievements/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ badges }),
        });
        if (res.ok) {
          localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
        }
      } catch {
        // Best effort — don't block auth
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
