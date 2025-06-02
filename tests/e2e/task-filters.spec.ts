import { expect, test } from "@playwright/test";
import { testTasks, testUsers } from "../fixtures/test-data";
import { AuthHelper } from "../utils/auth-helpers";
import { DatabaseHelper } from "../utils/db-helpers";
import { TaskHelper } from "../utils/task-helpers";

test.describe("タスクフィルタ機能", () => {
	let authHelper: AuthHelper;
	let taskHelper: TaskHelper;
	let dbHelper: DatabaseHelper;

	// テスト用のタスクデータ（フィルタテスト用に特別に設計）
	const filterTestTasks = [
		{
			title: "高優先度の未着手タスク",
			description: "重要な緊急タスクです",
			priority: "HIGH" as const,
			status: "TODO" as const,
		},
		{
			title: "中優先度の進行中タスク",
			description: "現在作業中のタスクです",
			priority: "MEDIUM" as const,
			status: "IN_PROGRESS" as const,
		},
		{
			title: "低優先度の完了タスク",
			description: "すでに完了したタスクです",
			priority: "LOW" as const,
			status: "DONE" as const,
		},
		{
			title: "ショッピングリスト作成",
			description: "買い物の準備をします",
			priority: "MEDIUM" as const,
			status: "TODO" as const,
		},
		{
			title: "会議の議事録作成",
			description: "今日の会議の記録を取ります",
			priority: "HIGH" as const,
			status: "IN_PROGRESS" as const,
		},
	];

	test.beforeEach(async ({ page }) => {
		// データベースヘルパーを初期化
		dbHelper = new DatabaseHelper();

		console.log("[Test Setup] Starting database cleanup...");

		// テスト前にデータベースを強制的にクリーンアップ
		let cleanupSuccess = false;
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				console.log(`[Test Setup] Database cleanup attempt ${attempt}/2`);

				if (attempt === 1) {
					await dbHelper.cleanDatabase();
				} else {
					console.log("[Test Setup] Using force truncate method...");
					await dbHelper.forceTruncateAll();
				}

				const stats = await dbHelper.getStats();
				console.log(
					`[Test Setup] Post-cleanup stats (attempt ${attempt}):`,
					stats,
				);

				if (
					stats.tasks === 0 &&
					stats.users === 0 &&
					stats.sessions === 0 &&
					stats.accounts === 0
				) {
					cleanupSuccess = true;
					console.log("[Test Setup] Database cleanup verified successful");
					break;
				}

				console.log(
					`[Test Setup] Cleanup attempt ${attempt} incomplete, remaining:`,
					stats,
				);
			} catch (error: unknown) {
				console.error(`[Test Setup] Cleanup attempt ${attempt} failed:`, error);
			}

			if (attempt < 2) {
				await new Promise((resolve) => setTimeout(resolve, 3000));
			}
		}

		if (!cleanupSuccess) {
			throw new Error("Failed to clean database after multiple attempts");
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));

		// テスト用ヘルパーを初期化
		authHelper = new AuthHelper(page);
		taskHelper = new TaskHelper(page);

		// テストユーザーを作成してサインイン
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// フロントエンド状態をリセット
		console.log(
			"[Test Setup] Navigating to home page first to reset frontend state...",
		);
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
			if ("caches" in window) {
				caches.keys().then((names) => {
					for (const name of names) {
						caches.delete(name);
					}
				});
			}
		});

		// タスクページに移動
		console.log("[Test Setup] Navigating to tasks page...");
		await page.goto("/tasks", { waitUntil: "networkidle" });

		// 認証が完了してタスク管理ページが表示されるまで待機
		await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible({
			timeout: 15000,
		});
		await expect(page).toHaveURL("/tasks");

		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// 初期状態の確認
		await expect(async () => {
			const existingTasks = await page
				.locator('[data-testid="task-item"]')
				.count();
			console.log(`[Test Setup] Current tasks on page: ${existingTasks}`);
			expect(existingTasks).toBe(0);
		}).toPass({ timeout: 25000 });

		console.log(
			"[Test Setup] Setup completed - page is clean and ready for testing",
		);
	});

	test.afterEach(async ({ page }) => {
		try {
			console.log("[Test Cleanup] Starting post-test cleanup");

			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});

			const stats = await dbHelper.getStats();
			console.log("[Test Cleanup] Database stats after test:", stats);

			await dbHelper.disconnect();

			console.log("[Test Cleanup] Post-test cleanup completed");
		} catch (error: unknown) {
			console.error("[Test Cleanup] Error during cleanup:", error);
		}
	});

	test("検索フィルタが正しく動作する", async ({ page }) => {
		console.log("[Test] Starting search filter test");

		// テスト用タスクを作成
		for (const task of filterTestTasks) {
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		// 全タスクが作成されたことを確認
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		// 検索フィルタのテスト
		console.log('[Test] Testing search filter: "ショッピング"');
		await taskHelper.filterTasks({ search: "ショッピング" });
		await taskHelper.waitForFilterResults(1);

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(1);
		expect(visibleTasks[0]).toContain("ショッピングリスト");

		// 別の検索語でテスト
		console.log('[Test] Testing search filter: "会議"');
		await taskHelper.filterTasks({ search: "会議" });
		await taskHelper.waitForFilterResults(1);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(1);
		expect(visibleTasks[0]).toContain("会議の議事録");

		// 部分マッチのテスト
		console.log('[Test] Testing search filter: "タスク"');
		await taskHelper.filterTasks({ search: "タスク" });
		await taskHelper.waitForFilterResults(3);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(3);
		expect(visibleTasks.some((title) => title.includes("高優先度"))).toBe(true);
		expect(visibleTasks.some((title) => title.includes("中優先度"))).toBe(true);
		expect(visibleTasks.some((title) => title.includes("低優先度"))).toBe(true);

		// 検索結果なしのケース
		console.log(
			'[Test] Testing search filter with no results: "存在しないタスク"',
		);
		await taskHelper.filterTasks({ search: "存在しないタスク" });
		await taskHelper.waitForFilterResults(0);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(0);

		// 空の検索状態の表示確認
		const isEmpty = await taskHelper.isEmptyFilterStateVisible();
		expect(isEmpty).toBe(true);

		// フィルタをクリア
		await taskHelper.clearFilters();
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		console.log("[Test] Search filter test completed successfully");
	});

	test("ステータスフィルタが正しく動作する", async ({ page }) => {
		console.log("[Test] Starting status filter test");

		// テスト用タスクを作成
		for (const task of filterTestTasks) {
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		// いくつかのタスクのステータスを変更
		await taskHelper.editTask("中優先度の進行中タスク", {
			status: "IN_PROGRESS",
		});
		await taskHelper.editTask("低優先度の完了タスク", { status: "DONE" });
		await taskHelper.editTask("会議の議事録作成", { status: "IN_PROGRESS" });

		// 未着手タスクでフィルタ
		console.log('[Test] Testing status filter: "未着手"');
		await taskHelper.filterTasks({ status: "未着手" });
		await taskHelper.waitForFilterResults();

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with status "未着手": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.some((title) => title.includes("高優先度の未着手")),
		).toBe(true);
		expect(
			visibleTasks.some((title) => title.includes("ショッピングリスト")),
		).toBe(true);

		// 進行中タスクでフィルタ
		console.log('[Test] Testing status filter: "進行中"');
		await taskHelper.filterTasks({ status: "進行中" });
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with status "進行中": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.some((title) => title.includes("中優先度の進行中")),
		).toBe(true);
		expect(visibleTasks.some((title) => title.includes("会議の議事録"))).toBe(
			true,
		);

		// 完了タスクでフィルタ
		console.log('[Test] Testing status filter: "完了"');
		await taskHelper.filterTasks({ status: "完了" });
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with status "完了": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(visibleTasks.some((title) => title.includes("低優先度の完了"))).toBe(
			true,
		);

		// すべてに戻す
		console.log('[Test] Testing status filter: "すべて"');
		await taskHelper.filterTasks({ status: "すべて" });
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(filterTestTasks.length);

		console.log("[Test] Status filter test completed successfully");
	});

	test("優先度フィルタが正しく動作する", async ({ page }) => {
		console.log("[Test] Starting priority filter test");

		// テスト用タスクを作成
		for (const task of filterTestTasks) {
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		await taskHelper.waitForFilterResults(filterTestTasks.length);

		// 高優先度でフィルタ
		console.log('[Test] Testing priority filter: "高"');
		await taskHelper.filterTasks({ priority: "高" });
		await taskHelper.waitForFilterResults();

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with priority "高": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.some((title) => title.includes("高優先度の未着手")),
		).toBe(true);
		expect(visibleTasks.some((title) => title.includes("会議の議事録"))).toBe(
			true,
		);

		// 中優先度でフィルタ
		console.log('[Test] Testing priority filter: "中"');
		await taskHelper.filterTasks({ priority: "中" });
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with priority "中": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.some((title) => title.includes("中優先度の進行中")),
		).toBe(true);
		expect(
			visibleTasks.some((title) => title.includes("ショッピングリスト")),
		).toBe(true);

		// 低優先度でフィルタ
		console.log('[Test] Testing priority filter: "低"');
		await taskHelper.filterTasks({ priority: "低" });
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(
			`[Test] Visible tasks with priority "低": ${visibleTasks.length}`,
		);
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(visibleTasks.some((title) => title.includes("低優先度の完了"))).toBe(
			true,
		);

		// すべてに戻す
		console.log('[Test] Testing priority filter: "すべて"');
		await taskHelper.filterTasks({ priority: "すべて" });
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(filterTestTasks.length);

		console.log("[Test] Priority filter test completed successfully");
	});

	test("ソート機能が正しく動作する", async ({ page }) => {
		console.log("[Test] Starting sort functionality test");

		// ソート用のタスクを作成（時間差を作るため）
		const sortTestTasks = [
			{ title: "Zタスク（最後のアルファベット）", priority: "LOW" as const },
			{ title: "Aタスク（最初のアルファベット）", priority: "HIGH" as const },
			{ title: "Mタスク（中間のアルファベット）", priority: "MEDIUM" as const },
		];

		for (let i = 0; i < sortTestTasks.length; i++) {
			const task = sortTestTasks[i];
			if (!task) continue;
			await taskHelper.createTask(task.title, {
				description: `ソートテスト用のタスク ${i + 1}`,
				priority: task.priority,
			});
			// 作成時間に差をつけるため少し待機
			await page.waitForTimeout(100);
		}

		await taskHelper.waitForFilterResults(sortTestTasks.length);

		// タイトルで昇順ソート
		console.log("[Test] Testing sort by title: ascending");
		await taskHelper.filterTasks({
			sortBy: "タイトル",
			sortOrder: "古い順", // タイトルの場合は昇順がA→Z
		});
		await taskHelper.waitForFilterResults();

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks[0]).toContain("Aタスク");
		expect(visibleTasks[2]).toContain("Zタスク");

		// タイトルで降順ソート
		console.log("[Test] Testing sort by title: descending");
		await taskHelper.filterTasks({
			sortBy: "タイトル",
			sortOrder: "新しい順", // タイトルの場合は降順がZ→A
		});
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks[0]).toContain("Zタスク");
		expect(visibleTasks[2]).toContain("Aタスク");

		// 作成日でソート（新しい順）
		console.log("[Test] Testing sort by creation date: newest first");
		await taskHelper.filterTasks({
			sortBy: "作成日",
			sortOrder: "新しい順",
		});
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		// 最後に作成されたタスクが最初に表示される
		expect(visibleTasks[0]).toContain("Mタスク");

		// 作成日でソート（古い順）
		console.log("[Test] Testing sort by creation date: oldest first");
		await taskHelper.filterTasks({
			sortBy: "作成日",
			sortOrder: "古い順",
		});
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		// 最初に作成されたタスクが最初に表示される
		expect(visibleTasks[0]).toContain("Zタスク");

		console.log("[Test] Sort functionality test completed successfully");
	});

	test("複数フィルタの組み合わせが正しく動作する", async ({ page }) => {
		console.log("[Test] Starting combined filters test");

		// テスト用タスクを作成
		for (const task of filterTestTasks) {
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		await taskHelper.waitForFilterResults(filterTestTasks.length);

		// 検索 + 優先度フィルタ
		console.log("[Test] Testing search + priority filter");
		await taskHelper.filterTasks({
			search: "タスク",
			priority: "高",
		});
		await taskHelper.waitForFilterResults();

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.every(
				(title) => title.includes("タスク") && title.includes("高優先度"),
			),
		).toBe(true);

		// 検索 + ステータス + 優先度フィルタ
		console.log("[Test] Testing search + status + priority filter");
		await taskHelper.clearFilters();
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		await taskHelper.filterTasks({
			search: "タスク",
			status: "未着手",
			priority: "高",
		});
		await taskHelper.waitForFilterResults();

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		console.log(`[Test] Combined filter results: ${visibleTasks.length} tasks`);
		// 高優先度の未着手タスクのみが表示される
		expect(visibleTasks.length).toBeGreaterThan(0);
		expect(
			visibleTasks.some((title) => title.includes("高優先度の未着手")),
		).toBe(true);

		// フィルタクリア機能のテスト
		console.log("[Test] Testing filter clear functionality");
		await taskHelper.clearFilters();
		await taskHelper.waitForFilterResults(filterTestTasks.length);

		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(filterTestTasks.length);

		console.log("[Test] Combined filters test completed successfully");
	});

	test("フィルタ後の空状態が正しく表示される", async ({ page }) => {
		console.log("[Test] Starting empty state after filtering test");

		// テスト用タスクを作成
		for (const task of filterTestTasks.slice(0, 2)) {
			// 2つのタスクのみ作成
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		await taskHelper.waitForFilterResults(2);

		// 存在しない条件でフィルタ
		console.log("[Test] Testing filter with no matching results");
		await taskHelper.filterTasks({
			search: "存在しないキーワード",
			priority: "高",
		});
		await taskHelper.waitForFilterResults(0);

		// 空状態のメッセージが表示されることを確認
		const isEmptyFilterState = await taskHelper.isEmptyFilterStateVisible();
		expect(isEmptyFilterState).toBe(true);

		// フィルタをクリアすると元のタスクが表示される
		await taskHelper.clearFilters();
		await taskHelper.waitForFilterResults(2);

		const visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(2);

		console.log(
			"[Test] Empty state after filtering test completed successfully",
		);
	});

	test("フィルタ状態がページリロード後も保持されない（適切にリセットされる）", async ({
		page,
	}) => {
		console.log("[Test] Starting filter state reset test");

		// テスト用タスクを作成
		for (const task of filterTestTasks.slice(0, 3)) {
			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
			});
		}

		await taskHelper.waitForFilterResults(3);

		// フィルタを適用
		await taskHelper.filterTasks({
			search: "高優先度",
			priority: "高",
		});
		await taskHelper.waitForFilterResults();

		let visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks.length).toBeLessThan(3);

		// ページをリロード
		console.log("[Test] Reloading page to test filter reset");
		await page.reload({ waitUntil: "networkidle" });

		// ページが再読み込みされるまで待機
		await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible({
			timeout: 15000,
		});
		await taskHelper.waitForFilterResults(3);

		// フィルタがリセットされて全タスクが表示される
		visibleTasks = await taskHelper.getVisibleTaskTitles();
		expect(visibleTasks).toHaveLength(3);

		console.log("[Test] Filter state reset test completed successfully");
	});
});
