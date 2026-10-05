import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
// import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { db } from "~/server/db";
import { isE2ETestMode } from "./e2e-mode";

const isE2EMode = isE2ETestMode(process.env);

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			// ...other properties
			// role: UserRole;
		} & DefaultSession["user"];
	}

	// interface User {
	//   // ...other properties
	//   // role: UserRole;
	// }
}

// E2Eテスト用のモックプロバイダー
const E2ETestProvider = CredentialsProvider({
	id: "e2e-test",
	name: "E2E Test",
	credentials: {
		email: { label: "Email", type: "email" },
		name: { label: "Name", type: "text" },
	},
	async authorize(credentials) {
		// サーバー側で明示した非本番のテスト環境だけを許可する。

		if (!isE2EMode) {
			return null;
		}

		if (!credentials?.email || !credentials?.name) {
			return null;
		}

		const email =
			typeof credentials.email === "string" ? credentials.email : "";
		const name = typeof credentials.name === "string" ? credentials.name : "";

		// E2Eテスト用のモックユーザーを返す
		return {
			id: "e2e-test-user",
			email,
			name,
			image: null,
		};
	},
});

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		// 非本番のテスト環境にのみプロバイダーを登録する。
		...(isE2EMode ? [E2ETestProvider] : []),
		// DiscordProvider,
		GoogleProvider({
			clientId: env.AUTH_GOOGLE_ID,
			clientSecret: env.AUTH_GOOGLE_SECRET,
		}),
		/**
		 * ...add more providers here.
		 *
		 * Most other providers require a bit more work than the Discord provider. For example, the
		 * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
		 * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
		 *
		 * @see https://next-auth.js.org/providers/github
		 */
	],
	adapter: isE2EMode ? undefined : PrismaAdapter(db),
	callbacks: {
		session: ({ session, user, token }) => {
			if (isE2EMode && token) {
				// E2Eテストモードでは、tokenから情報を取得
				return {
					...session,
					user: {
						...session.user,
						id: token.sub ?? "e2e-test-user",
					},
				};
			}

			return {
				...session,
				user: {
					...session.user,
					id: user.id,
				},
			};
		},
		jwt: ({ token, user }) => {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
	},
} satisfies NextAuthConfig;
