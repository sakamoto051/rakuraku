import { expect, test } from "@playwright/test";
import { AuthHelper } from "../utils/auth-helpers";

test.describe("タスク作成フォーム", () => {
	let auth: AuthHelper;

	test.beforeEach(async ({ page }) => {
		auth = new AuthHelper(page);

		// E2Eテスト用のモックユーザーでサインイン
		await auth.signIn("e2e@example.com", "E2E Test User");

		// タスクページに移動
		await page.goto("/tasks");

		// 認証が完了してタスク管理ページが表示されるまで待機
		await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible({
			timeout: 10000,
		});

		// URLがタスクページであることを確認
		await expect(page).toHaveURL("/tasks");

		// ページが完全に読み込まれるまで待機
		await page.waitForLoadState("domcontentloaded");
	});

	test.afterEach(async ({ page }) => {
		// テスト後のクリーンアップ
		await auth.signOut();
	});

	test("タスクを作成してモーダルが閉じる", async ({ page }) => {
		// モーダルを開く
		await page.click('button:has-text("新しいタスク")');
		await expect(page.locator("form")).toBeVisible({ timeout: 5000 });

		// タスク情報を入力
		await page.fill('input[name="title"]', "テストタスク");
		await page.fill('textarea[name="description"]', "テスト用の説明");

		// フォームを送信
		await page.click('button[type="submit"]');

		// ネットワーク応答を待つ（TRPCの応答）
		await page.waitForResponse(
			(response) =>
				response.url().includes("/api/trpc/task.create") &&
				response.status() === 200,
			{ timeout: 10000 },
		);

		// モーダルが閉じるか確認
		await expect(page.locator("form")).not.toBeVisible({ timeout: 8000 });

		// タスクがリストに表示される
		await expect(page.locator('text="テストタスク"')).toBeVisible({
			timeout: 5000,
		});
	});

	test("必須フィールドのバリデーション", async ({ page }) => {
		// モーダルを開く
		await page.click('button:has-text("新しいタスク")');
		await expect(page.locator("form")).toBeVisible({ timeout: 5000 });

		// タイトルを入力せずに送信
		await page.click('button[type="submit"]');

		// バリデーションエラーが表示される
		await expect(page.locator('text="タイトルは必須です"')).toBeVisible({
			timeout: 5000,
		});

		// フォームがまだ開いている
		await expect(page.locator("form")).toBeVisible();
	});
});
