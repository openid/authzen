import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuth as useOidcAuth } from "oidc-react";

interface UserProfile {
  email: string;
  sub: string;
}

interface AuthUser {
  id_token: string;
  profile: UserProfile;
}

interface AuthContextType {
  headers: Headers;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  signIn: () => void;
  userData?: AuthUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const oidcAuth = useOidcAuth();

  const createHeaders = useCallback(() => {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (oidcAuth.userData?.id_token) {
      headers.set("Authorization", `Bearer ${oidcAuth.userData.id_token}`);
    }

    return headers;
  }, [oidcAuth.userData?.id_token]);

  const getUserData = useCallback((): AuthUser | undefined => {
    if (!oidcAuth.userData?.id_token) {
      return undefined;
    }

    return {
      id_token: oidcAuth.userData.id_token,
      profile: {
        email: oidcAuth.userData.profile.email ?? "",
        sub: oidcAuth.userData.profile.sub,
      },
    };
  }, [oidcAuth.userData]);

  const value = useMemo(
    () => ({
      headers: createHeaders(),
      isAuthenticated: !!oidcAuth.userData?.id_token,
      signOut: oidcAuth.signOut,
      signIn: oidcAuth.signIn,
      isLoading: oidcAuth.isLoading,
      userData: getUserData(),
    }),
    [oidcAuth, createHeaders, getUserData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
