import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  AuthProviderProps,
  AuthProvider as OidcAuthProvider,
  useAuth as useOidcAuth,
} from "oidc-react";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { ConfigProvider } from "./context/ConfigContext";
import { App } from "./App";
import { ToastContainer } from "react-toastify";
import { queryClient } from "./utils/queryClient";

const configuration: AuthProviderProps = {
  authority: `https://${import.meta.env.VITE_OIDC_DOMAIN}/dex`,
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  autoSignIn: true,
  responseType: "id_token",
  scope: "openid profile email",
  redirectUri: window.location.origin,
  onSignIn: () => {
    // window.location.replace(window.location.origin);
  },
};

function LoginWrapper() {
  const auth = useOidcAuth();
  const { userData, isLoading } = auth;
  const isAuthenticated = userData?.id_token ? true : false;
  console.log({ isLoading, isAuthenticated });

  useEffect(() => {
    if (!auth.isLoading && !isAuthenticated) {
      auth.signIn();
    }
  }, [isLoading, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }
  return (
    <ConfigProvider>
      <App />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ConfigProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <OidcAuthProvider {...configuration}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LoginWrapper />
        </AuthProvider>
        <ReactQueryDevtools client={queryClient} />
      </QueryClientProvider>
    </OidcAuthProvider>
  </React.StrictMode>
);
