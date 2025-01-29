import { useEffect } from "react";
import { useAuth as useOidcAuth } from "oidc-react";
import { ToastContainer } from "react-toastify";

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export function AuthenticatedApp({ children }: AuthenticatedAppProps) {
  const { userData, isLoading, signIn } = useOidcAuth();
  const isAuthenticated = !!userData?.id_token;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {children}
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
    </>
  );
}
