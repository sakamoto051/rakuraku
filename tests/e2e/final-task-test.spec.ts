import { expect, test } from "@playwright/test";

test.describe("最終タスク作成テスト", () => {
	test("タスクを作成して確認", async ({ page }) => {
		await page.goto("/tasks");

		// モーダルを開く
		await page.click('button:has-text("新しいタスク")');
		await expect(page.locator("form")).toBeVisible({ timeout: 5000 });

		// タスク情報を入力
		await page.fill('input[name="title"]', "E2Eテストタスク");
		await page.fill('textarea[name="description"]', "E2Eテストの説明");

		// フォームを送信
		await page.click('button[type="submit"]');

		// ネットワーク応答を待つ
		await page.waitForResponse(
			(response) =>
				response.url().includes("/api/trpc/task.create") &&
				response.status() === 200,
			{ timeout: 10000 },
		);

		// タスクがリストに表示されることを確認
		await expect(page.locator('text="E2Eテストタスク"')).toBeVisible({
			timeout: 8000,
		});

		// 説明も表示されることを確認
		await expect(page.locator('text="E2Eテストの説明"')).toBeVisible({
			timeout: 5000,
		});
	});
});
