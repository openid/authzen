/** biome-ignore-all lint/style/noNonNullAssertion: Init */
import * as client from "openid-client";
import { createCookie, redirect } from "react-router";
import { clearAuditLog, pushAuditLog } from "~/lib/auditLog";
import { AuditType } from "~/types/audit";
import type { Route } from "./+types/auth0";

const callbackUrl = `${process.env.BASE_URL!}/idp/auth0/callback`;

const issuerIdentifier = process.env.AUTH0_DOMAIN!.startsWith("http")
	? process.env.AUTH0_DOMAIN!
	: `https://${process.env.AUTH0_DOMAIN!}`;

const issuerUrl = new URL(issuerIdentifier);

let configurationPromise: Promise<client.Configuration> | null = null;

const getAuth0Configuration = () => {
	if (!configurationPromise) {
		configurationPromise = client.discovery(
			issuerUrl,
			process.env.AUTH0_CLIENT_ID!,
			process.env.AUTH0_CLIENT_SECRET!,
		);
	}
	return configurationPromise;
};

const pkceCookie = createCookie("authzen:auth0:pkce", {
	httpOnly: true,
	path: "/",
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production",
	maxAge: 300,
});

const parseSession = async (cookieHeader: string | null) => {
	if (!cookieHeader) {
		return null;
	}
	const raw = await pkceCookie.parse(cookieHeader);
	if (!raw || typeof raw !== "string") {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as {
			codeVerifier?: unknown;
			nonce?: unknown;
		};
		if (typeof parsed.codeVerifier !== "string") {
			return null;
		}
		return {
			codeVerifier: parsed.codeVerifier,
			nonce: typeof parsed.nonce === "string" ? parsed.nonce : undefined,
		};
	} catch {
		// ignore parse errors and treat as missing PKCE session
	}
	return null;
};

const setSessionCookie = (session: {
	codeVerifier: string;
	nonce?: string;
}) => pkceCookie.serialize(JSON.stringify(session));

const clearSessionCookie = () => pkceCookie.serialize("", { maxAge: 0 });

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);

	if (url.pathname.endsWith("/login")) {
		clearAuditLog();
		pushAuditLog(AuditType.AuthN, {
			message: "Initiating Auth0 login",
			idp: "auth0",
		});

		const config = await getAuth0Configuration();
		const codeVerifier = client.randomPKCECodeVerifier();
		const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

		const parameters: Record<string, string> = {
			redirect_uri: callbackUrl,
			scope: "openid profile email",
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
			prompt: "login",
		};

		let nonce: string | undefined;
		if (!config.serverMetadata().supportsPKCE()) {
			nonce = client.randomNonce();
			parameters.nonce = nonce;
		}

		const authorizationUrl = client.buildAuthorizationUrl(config, parameters);

		return redirect(authorizationUrl.href, {
			headers: {
				"Set-Cookie": await setSessionCookie({ codeVerifier, nonce }),
			},
		});
	}

	if (url.pathname.endsWith("/callback")) {
		pushAuditLog(AuditType.AuthN, {
			message: "Handling Auth0 callback",
			idp: "auth0",
		});

		const pkceSession = await parseSession(request.headers.get("Cookie"));

		if (!pkceSession) {
			pushAuditLog(AuditType.AuthN, {
				message: "Missing PKCE verifier data during Auth0 callback",
				idp: "auth0",
				ok: false,
			});
			return redirect("/", {
				headers: {
					"Set-Cookie": await clearSessionCookie(),
				},
			});
		}

		try {
			const config = await getAuth0Configuration();
			const checks: client.AuthorizationCodeGrantChecks = {
				pkceCodeVerifier: pkceSession.codeVerifier,
				idTokenExpected: true,
			};

			if (pkceSession.nonce) {
				checks.expectedNonce = pkceSession.nonce;
			}

			const tokens = await client.authorizationCodeGrant(config, url, checks);

			if (!tokens.id_token) {
				throw new Error("Auth0 response did not include an ID token");
			}

			pushAuditLog(AuditType.AuthN, {
				message: "Successfully obtained OAuth2 token from Auth0",
				idp: "auth0",
				response: {
					accessTokenIssued: Boolean(tokens.access_token),
					idTokenIssued: true,
				},
				ok: true,
			});

			return redirect(`/#id_token=${tokens.id_token}`, {
				headers: {
					"Set-Cookie": await clearSessionCookie(),
				},
			});
		} catch (error) {
			pushAuditLog(AuditType.AuthN, {
				message: `Error obtaining OAuth2 token: ${(error as Error).message}`,
				idp: "auth0",
				ok: false,
			});
			return redirect("/", {
				headers: {
					"Set-Cookie": await clearSessionCookie(),
				},
			});
		}
	}

	return redirect("/");
}
