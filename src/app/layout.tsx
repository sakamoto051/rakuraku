import "~/styles/globals.css";

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist } from "next/font/google";

import { MainNavigation } from "~/app/_components/navigation";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Rakuraku - らくらくタスク管理",
	description: "効率的なタスク管理で日々の作業をらくらくと",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="ja" className={`${geist.variable}`}>
			<body>
				<TRPCReactProvider>
					<SessionProvider>
						<div className="min-h-screen bg-gray-50">
							<MainNavigation />
							<main className="py-6">{children}</main>
						</div>
					</SessionProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
