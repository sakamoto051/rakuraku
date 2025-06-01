import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// E2Eテスト用のヘッダーをチェック
	const isE2ETest = request.headers.get("x-e2e-test") === "true";

	// E2Eテストの場合、認証をバイパスするためのヘッダーを追加
	if (isE2ETest) {
		const response = NextResponse.next();
		response.headers.set("x-e2e-test", "true");
		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
