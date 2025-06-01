import { expect, test } from "@playwright/test";
import { testUsers } from "../fixtures/test-data";
import { AuthHelper } from "../utils/auth-helpers";

test.describe("認証フロー", () => {
	let authHelper: AuthHelper;

	test.beforeEach(async ({ page }) => {
		authHelper = new AuthHelper(page);
	});

	test("未認証ユーザーはタスクページにアクセスできない", async ({
		browser,
	}) => {
		// E2Eヘッダーなしの新しいコンテキストを作成（認証チェックを有効にするため）
		const context = await browser.newContext({
			extraHTTPHeaders: {}, // E2Eヘッダーを明示的に除外
		});
		const page = await context.newPage();

		// Try to access tasks page without authentication
		await page.goto("/tasks");

		// Wait for the page to load completely
		await page.waitForLoadState("domcontentloaded");

		// リダイレクトを待機
		await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// Should be redirected to sign in page
		await expect(page).toHaveURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// GoogleプロバイダーのサインインボタンまたはE2Eテストプロバイダーが表示されることを確認
		const hasGoogleSignIn = await page
			.locator('button:has-text("Sign in with Google")')
			.isVisible({ timeout: 3000 });
		const hasE2ETestForm = await page
			.locator('form[action*="e2e-test"]')
			.isVisible({ timeout: 3000 });

		// どちらかのサインイン方法が表示されていることを確認
		expect(hasGoogleSignIn || hasE2ETestForm).toBe(true);

		await context.close();
	});

	test("ユーザーがサインインできる", async ({ page }) => {
		// Start at home page
		await page.goto("/");

		// Should see sign in button (either サインイン or 始める)
		await expect(
			page.locator("text=サインイン").or(page.locator("text=始める")).first(),
		).toBeVisible();

		// Sign in using the mock authentication
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// After sign in, we should be redirected away from signin page
		await expect(page).not.toHaveURL(/\/api\/auth\/signin/);

		// Verify that we are signed in by checking the session
		const isSignedIn = await authHelper.isSignedIn();
		expect(isSignedIn).toBe(true);
	});

	test("認証後にタスクページにアクセスできる", async ({ page }) => {
		// Sign in first
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// Navigate to tasks page
		await page.goto("/tasks");

		// Should be able to access tasks page without redirect
		await expect(page).toHaveURL("/tasks");

		// Wait for page content to load and verify we can see task-related content
		await page.waitForLoadState("domcontentloaded");

		// Check for task page elements (could be heading, create button, or empty state)
		const hasTaskHeading = await page
			.locator('h1:has-text("タスク管理")')
			.isVisible({ timeout: 5000 });
		const hasCreateButton = await page
			.locator(
				'button:has-text("作成"), button:has-text("新規"), a:has-text("作成")',
			)
			.first()
			.isVisible({ timeout: 5000 });
		const hasTaskList = await page
			.locator('[data-testid*="task"], [class*="task"]')
			.first()
			.isVisible({ timeout: 5000 });

		// At least one task-related element should be visible
		expect(hasTaskHeading || hasCreateButton || hasTaskList).toBe(true);
	});

	test("ユーザーがサインアウトできる", async ({ page }) => {
		// Sign in first
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// Verify we are signed in
		const initialSignInState = await authHelper.isSignedIn();
		expect(initialSignInState).toBe(true);

		// Sign out
		await authHelper.signOut();

		// Verify we are signed out
		const finalSignInState = await authHelper.isSignedIn();
		expect(finalSignInState).toBe(false);

		// Navigate to home page to check UI state
		await page.goto("/");

		// Should see sign in button again (indicating we're back to signed out state)
		await expect(
			page.locator("text=サインイン").or(page.locator("text=始める")).first(),
		).toBeVisible({ timeout: 10000 });
	});

	test("サインアウト後はタスクページにアクセスできない", async ({
		browser,
	}) => {
		// 通常のページでサインイン・サインアウト
		const normalContext = await browser.newContext();
		const normalPage = await normalContext.newPage();
		const authHelperNormal = new AuthHelper(normalPage);

		// Sign in and then sign out
		await authHelperNormal.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);
		await authHelperNormal.signOut();
		await normalContext.close();

		// E2Eヘッダーなしの新しいコンテキストを作成（認証チェックを有効にするため）
		const context = await browser.newContext({
			extraHTTPHeaders: {}, // E2Eヘッダーを明示的に除外
		});
		const page = await context.newPage();

		// Try to access tasks page after sign out
		await page.goto("/tasks");

		// Wait for the page to load completely
		await page.waitForLoadState("domcontentloaded");

		// Should be redirected to sign in page
		await page.waitForURL(/\/api\/auth\/signin/, { timeout: 10000 });
		await expect(page).toHaveURL(/\/api\/auth\/signin/, { timeout: 10000 });

		// GoogleプロバイダーのサインインボタンまたはE2Eテストプロバイダーが表示されることを確認
		const hasGoogleSignIn = await page
			.locator('button:has-text("Sign in with Google")')
			.isVisible({ timeout: 3000 });
		const hasE2ETestForm = await page
			.locator('form[action*="e2e-test"]')
			.isVisible({ timeout: 3000 });

		// どちらかのサインイン方法が表示されていることを確認
		expect(hasGoogleSignIn || hasE2ETestForm).toBe(true);

		await context.close();
	});

	test("サインイン状態が維持される", async ({ page }) => {
		// Sign in
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// Navigate to different pages and verify sign in state is maintained
		await page.goto("/");
		expect(await authHelper.isSignedIn()).toBe(true);

		await page.goto("/tasks");
		expect(await authHelper.isSignedIn()).toBe(true);

		// Should not be redirected to signin page
		await expect(page).not.toHaveURL(/\/api\/auth\/signin/);
	});
});
