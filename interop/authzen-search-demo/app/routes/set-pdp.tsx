import { redirect } from "react-router";
import type { Route } from "./+types/set-pdp";
import { pdpCookie } from "~/cookies.server";

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const formData = await request.formData();
  const selectedPDP = formData.get("pdp");
  const returnTo = formData.get("returnTo")?.toString() || "/";
  console.log("Selected PDP:", selectedPDP);

  // Now set the cookie with the selected PDP
  const cookie = (await pdpCookie.parse(cookieHeader)) || {};
  cookie.selectedPdp = selectedPDP;

  return redirect(returnTo, {
    headers: {
      "Set-Cookie": await pdpCookie.serialize(cookie),
    },
  });
}
