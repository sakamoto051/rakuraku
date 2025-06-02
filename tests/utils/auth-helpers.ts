import type { Page } from "@playwright/test";

export class AuthHelper {
	constructor(private page: Page) {}

	async signIn(email = "e2e@example.com", name = "E2E Test User") {
		// E2Eテストモードでの認証は、NextAuth.jsのCredentialsプロバイダーを使用
		console.log(`[AuthHelper] Starting sign in process for: ${email}`);

		// サインインページに移動
		await this.page.goto("/api/auth/signin");
		await this.page.waitForLoadState("domcontentloaded");

		console.log(
			`[AuthHelper] Current URL after navigation: ${this.page.url()}`,
		);

		// E2Eテストプロバイダーが表示されるまで待機
		try {
			await this.page.waitForSelector('form[action*="e2e-test"]', {
				timeout: 15000,
			});
			console.log("[AuthHelper] E2E test provider form found");
		} catch (error: unknown) {
			// E2Eプロバイダーが見つからない場合は、詳細な診断を実行
			console.log(
				"[AuthHelper] E2E provider form not found. Running diagnostics...",
			);
			console.log("Current URL:", this.page.url());

			// ページ上の全てのフォームを確認
			const forms = await this.page.locator("form").all();
			console.log(`Found ${forms.length} forms on the page:`);
			for (let i = 0; i < forms.length; i++) {
				const form = forms[i];
				if (!form) continue;
				const action = await form.getAttribute("action");
				console.log(`  Form ${i + 1}: action="${action}"`);
			}

			// 利用可能なプロバイダーボタンをチェック
			const providerButtons = await this.page
				.locator('button:has-text("Sign in with")')
				.all();
			console.log(`Found ${providerButtons.length} provider buttons`);
			for (let i = 0; i < providerButtons.length; i++) {
				const button = providerButtons[i];
				if (!button) continue;
				const buttonText = await button.textContent();
				console.log(`  Button ${i + 1}: "${buttonText}"`);
			}

			throw new Error(
				"E2E test provider form not found. Make sure E2E_TEST_MODE is enabled and the application is running with the correct environment variables.",
			);
		}

		// E2Eテスト用のフォームに情報を入力
		console.log("[AuthHelper] Filling in credentials...");
		await this.page.fill('input[name="email"]', email);
		await this.page.fill('input[name="name"]', name);

		// フォームに値が正しく入力されたことを確認
		const emailValue = await this.page.inputValue('input[name="email"]');
		const nameValue = await this.page.inputValue('input[name="name"]');
		console.log(
			`[AuthHelper] Values entered - Email: ${emailValue}, Name: ${nameValue}`,
		);

		// サインインボタンをクリック
		console.log("[AuthHelper] Clicking sign in button...");
		await this.page.click('button[type="submit"]');

		// サインイン処理の完了を待機（複数の方法で確認）
		try {
			// まず、サインインページから離れることを確認
			await this.page.waitForURL(/(?!.*signin)/, { timeout: 15000 });
			console.log(`[AuthHelper] Redirected to: ${this.page.url()}`);
		} catch (urlError: unknown) {
			// URLの変更を待機できなかった場合、現在のURLを確認
			const currentUrl = this.page.url();
			console.log(
				`[AuthHelper] URL change timeout. Current URL: ${currentUrl}`,
			);

			// エラーメッセージが表示されているかチェック
			const errorMessages = await this.page
				.locator('text="Sign in failed"')
				.all();
			if (errorMessages.length > 0) {
				const errorText = await this.page.textContent("body");
				throw new Error(`Sign in failed. Error message on page: ${errorText}`);
			}

			// まだサインインページにいる場合はエラー
			if (currentUrl.includes("/signin")) {
				throw new Error(`Sign in failed - still on signin page: ${currentUrl}`);
			}
		}

		// セッションが確立されるまで少し待機
		await this.page.waitForTimeout(2000);
		console.log("[AuthHelper] Sign in process completed");
	}

	async signOut() {
		// NextAuth.jsのサインアウト機能を使用
		await this.page.goto("/api/auth/signout");

		// サインアウトボタンが表示されるまで待機
		try {
			await this.page.waitForSelector("form", { timeout: 5000 });
		} catch (error: unknown) {
			// 既にサインアウト済みの可能性
			console.log("Sign out form not found, may already be signed out");
			return;
		}

		// サインアウトボタンをクリック
		await this.page.click('button[type="submit"]');

		// サインアウト完了まで待機（ホームページまたはサインインページに戻る）
		await this.page.waitForURL(/\/$|\/api\/auth\/signin/, { timeout: 10000 });

		// 少し待機して変更が反映されるまで待つ
		await this.page.waitForTimeout(1000);
	}

	async isSignedIn(): Promise<boolean> {
		try {
			// セッション情報をAPIから取得して確認
			const response = await this.page.request.get("/api/auth/session");
			const sessionData = await response.json();

			console.log(
				"[AuthHelper] Session check response:",
				JSON.stringify(sessionData, null, 2),
			);

			// ユーザー情報があるかどうかで認証状態を判断
			const isAuthenticated = !!sessionData?.user;
			console.log(`[AuthHelper] Is authenticated via API: ${isAuthenticated}`);

			return isAuthenticated;
		} catch (error: unknown) {
			console.log("[AuthHelper] Session check failed:", error);
			// UIベースの確認にフォールバック
			try {
				console.log(
					"[AuthHelper] Falling back to UI-based authentication check...",
				);

				// 現在のページを記録
				const originalUrl = this.page.url();
				console.log(`[AuthHelper] Original URL: ${originalUrl}`);

				// タスクページにアクセスしてリダイレクトされるかテスト
				await this.page.goto("/tasks");
				await this.page.waitForLoadState("domcontentloaded");

				// 現在のURLを確認
				const currentUrl = this.page.url();
				console.log(`[AuthHelper] URL after accessing /tasks: ${currentUrl}`);

				// サインインページにリダイレクトされていないかチェック
				const canAccessTasks =
					currentUrl.includes("/tasks") && !currentUrl.includes("/signin");

				// 元のページに戻る（ただし、/tasksでないページの場合のみ）
				if (originalUrl !== "/tasks" && !originalUrl.includes("/tasks")) {
					await this.page.goto(originalUrl);
					await this.page.waitForLoadState("domcontentloaded");
				}

				console.log(`[AuthHelper] Can access tasks page: ${canAccessTasks}`);
				return canAccessTasks;
			} catch (uiError: unknown) {
				console.log("[AuthHelper] UI-based check also failed:", uiError);
				return false;
			}
		}
	}

	async ensureSignedIn() {
		const isSignedIn = await this.isSignedIn();
		if (!isSignedIn) {
			await this.signIn();
		}
	}

	async waitForAuthState(authenticated: boolean, timeout = 10000) {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			const currentState = await this.isSignedIn();
			if (currentState === authenticated) {
				return;
			}
			await this.page.waitForTimeout(500);
		}
		throw new Error(`Timeout waiting for auth state: ${authenticated}`);
	}
}
