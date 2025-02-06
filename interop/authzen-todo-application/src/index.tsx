import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  AuthProviderProps,
  AuthProvider as OidcAuthProvider,
} from "oidc-react";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { ConfigProvider } from "./context/ConfigContext";
import { App } from "./App";
import { queryClient } from "./utils/queryClient";
import { AuthenticatedApp } from "./components/AuthenticatedApp";

const oidcConfig: AuthProviderProps = {
  authority: `https://${import.meta.env.VITE_OIDC_DOMAIN}/dex`,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  autoSignIn: true,
  responseType: "id_token",
  scope: "openid profile email",
  redirectUri: window.location.origin,
  onSignIn: () => {
    window.location.replace(window.location.origin);
  },
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <OidcAuthProvider {...oidcConfig}>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ConfigProvider>
            <AuthenticatedApp>
              <App />
            </AuthenticatedApp>
          </ConfigProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  </OidcAuthProvider>
);
