import { createContext, useContext, ReactNode, useEffect } from "react";
import { useAuth as useOidcAuth } from "oidc-react";

interface AuthContextType {
  headers: Headers;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  signIn: () => void;
  userData?: {
    id_token: string;
    profile: {
      email: string;
      sub: string;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const oidcAuth = useOidcAuth();
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  if (oidcAuth.userData?.id_token) {
    headers.append("Authorization", `Bearer ${oidcAuth.userData.id_token}`);
  }

  const value = {
    headers,
    isAuthenticated: !!oidcAuth.userData?.id_token,
    signOut: oidcAuth.signOut,
    signIn: oidcAuth.signIn,
    isLoading: oidcAuth.isLoading,
    userData:
      oidcAuth.userData && oidcAuth.userData.id_token
        ? {
            id_token: oidcAuth.userData.id_token,
            profile: {
              email: oidcAuth.userData.profile.email ?? "",
              sub: oidcAuth.userData.profile.sub,
            },
          }
        : undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
