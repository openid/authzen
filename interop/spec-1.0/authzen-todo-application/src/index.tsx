import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { LoginWrapper } from "./LoginWrapper";
import { AuthProvider } from "oidc-react";

const configuration = {
  authority: `https://${process.env.REACT_APP_OIDC_DOMAIN}/dex`,
  clientId: process.env.REACT_APP_OIDC_CLIENT_ID,
  autoSignIn: true,
  responseType: "id_token",
  scope: "openid profile email",
  redirectUri: window.location.origin,
  audience: process.env.REACT_APP_OIDC_AUDIENCE,
  onSignIn: () => {
    window.location.replace(window.location.origin);
  },
};

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider {...configuration}>
      <LoginWrapper />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
