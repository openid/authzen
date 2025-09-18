/** biome-ignore-all lint/style/noNonNullAssertion: Init */
import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import { redirect } from "react-router";
import { AuditType, pushAuditLog } from "~/lib/auditLog";
import type { Route } from "./+types/auth0";

const codeVerifier = await generateCodeVerifier();

const client = new OAuth2Client({
	server: process.env.AUTH0_DOMAIN!,
	clientId: process.env.AUTH0_CLIENT_ID!,
	clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

const callbackUrl = `${process.env.BASE_URL!}/idp/auth0/callback`;

export async function loader({ request }: Route.LoaderArgs) {
	if (request.url.includes("/login")) {
		pushAuditLog(AuditType.AuthN, {
			message: "Initiating Auth0 login",
			idp: "auth0",
		});
		const url = await client.authorizationCode.getAuthorizeUri({
			redirectUri: callbackUrl,
			codeVerifier,
			scope: ["openid", "profile", "email"],
			extraParams: {
				prompt: "login",
			},
		});
		return redirect(url);
	}

	if (request.url.includes("/callback")) {
		pushAuditLog(AuditType.AuthN, {
			message: "Handling Auth0 callback",
			idp: "auth0",
		});

		try {
			const oauth2Token =
				await client.authorizationCode.getTokenFromCodeRedirect(request.url, {
					redirectUri: callbackUrl,
					codeVerifier,
				});

			pushAuditLog(AuditType.AuthN, {
				message: "Successfully obtained OAuth2 token from Auth0",
				idp: "auth0",
				response: {
					accessTokenIssued: !oauth2Token.accessToken,
					idTokenIssued: !!oauth2Token.idToken,
				},
				ok: true,
			});

			return redirect(`/`);
		} catch (error) {
			pushAuditLog(AuditType.AuthN, {
				message: `Error obtaining OAuth2 token: ${(error as Error).message}`,
				idp: "auth0",
				ok: false,
			});
			return redirect(`/`);
		}
	}
	return redirect("/");
}
