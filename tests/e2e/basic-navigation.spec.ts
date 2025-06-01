import { expect, test } from "@playwright/test";

test.describe("基本的なナビゲーション", () => {
	test("ホームページが読み込める", async ({ page }) => {
		await page.goto("/");
		// h1タグには「らくらくタスク管理」と表示される
		await expect(page.locator("h1")).toContainText("らくらくタスク管理");

		// ナビゲーションリンクが存在する
		await expect(page.locator('a[href="/"]').first()).toBeVisible();
		await expect(page.locator('a[href="/tasks"]').first()).toBeVisible();
	});

	test("未認証ユーザーはタスクページにアクセスできない", async ({
		browser,
	}) => {
		// E2Eヘッダーなしの新しいコンテキストを作成
		const context = await browser.newContext({
			extraHTTPHeaders: {}, // E2Eヘッダーを明示的に除外
		});
		const page = await context.newPage();

		// 直接タスクページにアクセス
		await page.goto("/tasks");

		// リダイレクトを待機
		await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// サインインページにリダイレクトされる
		await expect(page.url()).toContain("/api/auth/signin");
		await expect(
			page.locator('button:has-text("Sign in with Google")'),
		).toBeVisible();

		await context.close();
	});

	test("ホームページからタスクリンクをクリックすると認証ページへ", async ({
		browser,
	}) => {
		// E2Eヘッダーなしの新しいコンテキストを作成
		const context = await browser.newContext({
			extraHTTPHeaders: {}, // E2Eヘッダーを明示的に除外
		});
		const page = await context.newPage();

		await page.goto("/");
		await page.locator('a[href="/tasks"]').first().click();

		// リダイレクトを待機
		await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// 未認証の場合、サインインページにリダイレクトされる
		await expect(page.url()).toContain("/api/auth/signin");
		await expect(
			page.locator('button:has-text("Sign in with Google")'),
		).toBeVisible();

		await context.close();
	});

	test("ホームページの「始める」ボタンが動作する", async ({ browser }) => {
		// E2Eヘッダーなしの新しいコンテキストを作成
		const context = await browser.newContext({
			extraHTTPHeaders: {}, // E2Eヘッダーを明示的に除外
		});
		const page = await context.newPage();

		await page.goto("/");

		// 「始める」ボタンが表示されていることを確認
		await expect(page.locator('a:has-text("始める")')).toBeVisible();

		// 「始める」ボタンをクリック
		await page.click('a:has-text("始める")');

		// リダイレクトを待機
		await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// サインインページに遷移
		await expect(page.url()).toContain("/api/auth/signin");

		await context.close();
	});

	test("ホームページのレスポンシブデザインが正しく表示される", async ({
		page,
		viewport,
	}) => {
		await page.goto("/");

		// デスクトップサイズでの表示確認
		if (viewport && viewport.width >= 640) {
			// sm:text-6xl が適用される
			const h1 = page.locator("h1");
			await expect(h1).toHaveCSS("font-size", "60px");
		} else {
			// text-4xl が適用される
			const h1 = page.locator("h1");
			await expect(h1).toHaveCSS("font-size", "36px");
		}
	});
});
