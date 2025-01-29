import { toast } from "react-toastify";
import { ErrorWithLink } from "../components/ErrorWithLink";

export const errorHandler = (errorText: string, close?: number | false) => {
  const autoClose = close === undefined ? 3000 : close;
  const msg = close === false ? ErrorWithLink : "Error: " + errorText;
  toast.error(msg, {
    position: "top-center",
    autoClose,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};
