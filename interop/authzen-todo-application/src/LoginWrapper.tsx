import React, { useState, useEffect } from "react";
import { useAuth } from "oidc-react";
import { App } from "./App";
import TodoService from "./todoService";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

export function LoginWrapper() {
  const auth = useAuth();
  const { userData } = auth;
  const isAuthenticated = userData?.id_token ? true : false;
  const [loggedIn, setLoggedIn] = useState(false);
  const [specVersion, setSpecVersion] = useState<string>("");
  const [pdp, setPdp] = useState<string>("");

  useEffect(() => {
    if (!auth.isLoading && !isAuthenticated) {
      auth.signIn();
    } else {
      setLoggedIn(true);
    }
  }, [auth, isAuthenticated]);

  //Only load the app if the user is logged in, and user data is available
  if (loggedIn && userData?.profile.email) {
    return (
      <QueryClientProvider client={queryClient}>
        <TodoService
          token={userData.id_token}
          pdp={pdp}
          specVersion={specVersion}
          setPdp={setPdp}
          setSpecVersion={setSpecVersion}
        >
          <App
            user={{
              email: userData.profile.email,
              sub: userData.profile.sub,
            }}
          ></App>
        </TodoService>
      </QueryClientProvider>
    );
  } else {
    return null;
  }
}
