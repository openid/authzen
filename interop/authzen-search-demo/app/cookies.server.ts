import { createCookie } from "react-router";

export const pdpCookie = createCookie("pdp", {
  maxAge: 604_800, // one week
});
