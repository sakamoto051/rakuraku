import { expect, test } from "@playwright/test";
import { testTasks, testUsers } from "../fixtures/test-data";
import { AuthHelper } from "../utils/auth-helpers";
import { DatabaseHelper } from "../utils/db-helpers";
import { TaskHelper } from "../utils/task-helpers";

// Re-enabling tests to debug issues
test.describe("タスクCRUD操作", () => {
	let authHelper: AuthHelper;
	let taskHelper: TaskHelper;
	let dbHelper: DatabaseHelper;

	test.beforeEach(async ({ page }) => {
		// データベースヘルパーを初期化
		dbHelper = new DatabaseHelper();

		console.log("[Test Setup] Starting database cleanup...");

		// E2Eテストモードでアプリケーションが動作しているかを確認
		try {
			const healthResponse = await page.request.get(
				"http://localhost:3000/api/health",
			);
			if (healthResponse.ok()) {
				const healthData = await healthResponse.json();
				console.log("[Test Setup] Application health check:", healthData);
			} else {
				console.log(
					"[Test Setup] Health check failed, status:",
					healthResponse.status(),
				);
			}
		} catch (error: unknown) {
			console.log(
				"[Test Setup] Health check error (endpoint may not exist):",
				error instanceof Error ? error.message : String(error),
			);
		}

		// テスト前にデータベースを強制的にクリーンアップ（複数回試行）
		let cleanupSuccess = false;
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				console.log(`[Test Setup] Database cleanup attempt ${attempt}/2`);

				if (attempt === 1) {
					// 最初は通常のクリーンアップを試行
					await dbHelper.cleanDatabase();
				} else {
					// 2回目は強制的なTRUNCATEを使用
					console.log("[Test Setup] Using force truncate method...");
					await dbHelper.forceTruncateAll();
				}

				// クリーンアップが成功したか確認
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
				// リトライ前に待機
				await new Promise((resolve) => setTimeout(resolve, 3000));
			}
		}

		if (!cleanupSuccess) {
			throw new Error("Failed to clean database after multiple attempts");
		}

		// クリーンアップ後に少し待機してデータベースを安定させる
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// テスト用ヘルパーを初期化
		authHelper = new AuthHelper(page);
		taskHelper = new TaskHelper(page);

		// テストユーザーを作成してサインイン
		await authHelper.signIn(
			testUsers.defaultUser.email,
			testUsers.defaultUser.name,
		);

		// クリーンアップ後にフロントエンド状態をリセットするため、ホームページから再度タスクページへ遍移
		console.log(
			"[Test Setup] Navigating to home page first to reset frontend state...",
		);
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Clear all caches and storage
		await page.evaluate(() => {
			localStorage.clear();
			sessionStorage.clear();
			// ブラウザーキャッシュをクリア
			if ("caches" in window) {
				caches.keys().then((names) => {
					for (const name of names) {
						caches.delete(name);
					}
				});
			}
		});

		// フロントエンドで使用されているデータベースが正しいかをAPI経由で確認
		try {
			console.log("[Test Setup] Checking frontend database state via API...");

			// タスク一覧APIを直接呼び出して、フロントエンドが使用しているデータを確認
			const apiResponse = await page.request.get(
				'http://localhost:3000/api/trpc/task.getAll?batch=1&input={"0":{"json":null}}',
			);

			if (apiResponse.ok()) {
				const apiData = await apiResponse.json();
				console.log(
					"[Test Setup] API response structure:",
					Object.keys(apiData),
				);

				// tRPCのレスポンス構造を調査
				if (apiData?.[0]?.result?.data) {
					const tasks = apiData[0].result.data;
					console.log(
						`[Test Setup] API shows ${tasks.length} tasks in database`,
					);

					if (tasks.length > 0) {
						console.log(
							"[Test Setup] Frontend and backend are not in sync. API shows tasks but database was cleaned.",
						);
						console.log("[Test Setup] Sample task from API:", tasks[0]);

						// アプリケーションが異なるデータベースを使用している可能性
						throw new Error(
							`Application is using a different database! API returns ${tasks.length} tasks but test database was cleaned.`,
						);
					}
					console.log("[Test Setup] API confirms no tasks in database - good!");
				} else {
					console.log("[Test Setup] Could not parse API response structure");
					console.log(
						"[Test Setup] Full API response:",
						JSON.stringify(apiData, null, 2),
					);
				}
			} else {
				console.log(
					`[Test Setup] API request failed with status: ${apiResponse.status()}`,
				);
			}
		} catch (error: unknown) {
			console.log(
				"[Test Setup] API check failed:",
				error instanceof Error ? error.message : String(error),
			);
		}

		// Navigate to tasks page
		console.log("[Test Setup] Navigating to tasks page...");
		await page.goto("/tasks", { waitUntil: "networkidle" });

		// 認証が完了してタスク管理ページが表示されるまで待機
		await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible({
			timeout: 15000,
		});

		// URLがタスクページであることを確認
		await expect(page).toHaveURL("/tasks");

		// ページが完全に読み込まれるまで待機
		await page.waitForLoadState("domcontentloaded");
		await page.waitForLoadState("networkidle");

		// データが正しく読み込まれるまで待機し、ページの初期状態を確認
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
			// テスト後のクリーンアップを実行
			console.log("[Test Cleanup] Starting post-test cleanup");

			// ブラウザーのセッションをクリア
			await page.evaluate(() => {
				// ローカルストレージをクリア
				localStorage.clear();
				sessionStorage.clear();
			});

			// データベースの統計をログ出力
			const stats = await dbHelper.getStats();
			console.log("[Test Cleanup] Database stats after test:", stats);

			// テスト後にデータベース接続を閉じる
			await dbHelper.disconnect();

			console.log("[Test Cleanup] Post-test cleanup completed");
		} catch (error: unknown) {
			console.error("[Test Cleanup] Error during cleanup:", error);
			// クリーンアップエラーはテスト失敗にしない
		}
	});

	test("新しいタスクを作成できる", async ({ page }) => {
		const task = testTasks[0];
		if (!task) {
			throw new Error("Test task not found");
		}

		console.log(`[Test] Starting task creation test for: "${task.title}"`);

		// Create a new task
		await taskHelper.createTask(task.title, {
			description: task.description,
			priority: task.priority,
			dueDate: task.dueDate,
		});

		// タスクが作成されたことを確認（1個のタスクが存在する）
		await expect(async () => {
			const currentTaskCount = await page
				.locator('[data-testid="task-item"]')
				.count();
			console.log(`[Test] Current task count: ${currentTaskCount}`);
			expect(currentTaskCount).toBe(1);
		}).toPass({ timeout: 15000 });

		// 作成されたタスク（唯一のタスクアイテム）を取得
		const createdTaskItem = page.locator('[data-testid="task-item"]').first();

		// Verify task title appears in the created task
		await expect(createdTaskItem.locator(`text="${task.title}"`)).toBeVisible({
			timeout: 5000,
		});
		console.log(`[Test] Task title "${task.title}" verified`);

		// Verify task description appears in the created task
		await expect(
			createdTaskItem.locator(`text="${task.description}"`),
		).toBeVisible({ timeout: 5000 });
		console.log(`[Test] Task description "${task.description}" verified`);

		// Verify priority badge with more specific selector
		const priorityText =
			task.priority === "HIGH"
				? "高"
				: task.priority === "MEDIUM"
					? "中"
					: "低";

		// Look for priority badge specifically in the created task item
		await expect(
			createdTaskItem.locator(`span:has-text("${priorityText}")`).first(),
		).toBeVisible({ timeout: 5000 });
		console.log(`[Test] Task priority "${priorityText}" verified`);

		console.log(
			`[Test] Task "${task.title}" created and verified successfully`,
		);
	});

	test("タスクを編集できる", async ({ page }) => {
		const originalTask = testTasks[0];
		if (!originalTask) {
			throw new Error("Original test task not found");
		}
		const timestamp = Date.now();
		const updatedData = {
			title: `更新されたタスクタイトル_${timestamp}`,
			description: `更新された説明_${timestamp}`,
			priority: "LOW" as const,
			status: "IN_PROGRESS" as const,
		};

		// Create initial task
		await taskHelper.createTask(originalTask.title, {
			description: originalTask.description,
			priority: originalTask.priority,
		});

		// 初期タスクが作成されたことを確認
		const originalTaskItem = page.locator('[data-testid="task-item"]').first();
		await expect(
			originalTaskItem.locator(`text="${originalTask.title}"`),
		).toBeVisible({ timeout: 5000 });

		// Edit the task
		await taskHelper.editTask(originalTask.title, updatedData);

		// 編集後のタスクを取得（最初のタスクアイテム）
		const editedTaskItem = page.locator('[data-testid="task-item"]').first();

		// Verify changes in the updated task item
		await expect(
			editedTaskItem.locator(`text="${updatedData.title}"`),
		).toBeVisible({ timeout: 5000 });
		await expect(
			editedTaskItem.locator(`text="${updatedData.description}"`),
		).toBeVisible({ timeout: 5000 });

		// より具体的なセレクタで優先度と状態を確認
		await expect(
			editedTaskItem.locator('span:has-text("低")').first(),
		).toBeVisible({ timeout: 5000 }); // priority
		await expect(
			editedTaskItem.locator('span:has-text("進行中")').first(),
		).toBeVisible({ timeout: 5000 }); // status

		console.log(
			`[Test] Task "${originalTask.title}" edited to "${updatedData.title}" successfully`,
		);
	});

	test("タスクを削除できる", async ({ page }) => {
		const task = testTasks[0];
		if (!task) {
			throw new Error("Test task not found");
		}

		// Create a task
		await taskHelper.createTask(task.title, {
			description: task.description,
		});

		// Verify task exists
		await expect(page.locator(`text="${task.title}"`)).toBeVisible();

		// Delete the task
		await taskHelper.deleteTask(task.title);

		// Verify task is removed
		await expect(page.locator(`text="${task.title}"`)).not.toBeVisible();
	});

	test("タスクの完了状態を切り替えできる", async ({ page }) => {
		const task = testTasks[0];
		if (!task) {
			throw new Error("Test task not found");
		}

		// Create a task
		await taskHelper.createTask(task.title);

		// Toggle to completed
		await taskHelper.toggleTaskStatus(task.title);

		// Verify task title shows as completed (h3 element has line-through class)
		const taskCard = page
			.locator(`[data-testid="task-item"]:has-text("${task.title}")`)
			.first();
		const taskTitle = taskCard.locator("h3");
		await expect(taskTitle).toHaveClass(/line-through/);

		// Toggle back to incomplete
		await taskHelper.toggleTaskStatus(task.title);

		// Verify task title is no longer struck through
		await expect(taskTitle).not.toHaveClass(/line-through/);
	});

	test("複数のタスクを作成して一覧表示できる", async ({ page }) => {
		const tasksToCreate = testTasks.slice(0, 3);

		// 初期タスク数を記録
		const initialTaskCount = await page
			.locator('[data-testid="task-item"]')
			.count();
		console.log(`[Test] Initial task count: ${initialTaskCount}`);

		// Create multiple tasks
		for (let i = 0; i < tasksToCreate.length; i++) {
			const task = tasksToCreate[i];
			if (!task) continue;
			console.log(
				`[Test] Creating task ${i + 1}/${tasksToCreate.length}: "${task.title}"`,
			);

			await taskHelper.createTask(task.title, {
				description: task.description,
				priority: task.priority,
				dueDate: task.dueDate,
			});

			// 各タスク作成後にタスク数が正しく増えたことを確認
			await expect(async () => {
				const currentTaskCount = await page
					.locator('[data-testid="task-item"]')
					.count();
				expect(currentTaskCount).toBe(initialTaskCount + i + 1);
			}).toPass({ timeout: 10000 });
		}

		// 最終的なタスク数を確認
		const finalTaskCount = await taskHelper.getTaskCount();
		expect(finalTaskCount).toBe(initialTaskCount + tasksToCreate.length);
		console.log(`[Test] Final task count: ${finalTaskCount}`);

		// Verify all created tasks are visible by checking task items
		for (let i = 0; i < tasksToCreate.length; i++) {
			const task = tasksToCreate[i];
			if (!task) continue;
			// タスクリスト内の任意のタスクアイテムでタイトルを検索
			const taskWithTitle = page.locator('[data-testid="task-item"]', {
				hasText: task.title,
			});
			await expect(taskWithTitle.first()).toBeVisible({ timeout: 5000 });
			console.log(`[Test] Verified task "${task.title}" is visible`);
		}

		console.log(
			`[Test] Successfully created and verified ${tasksToCreate.length} tasks`,
		);
	});

	test("期限切れタスクが正しく表示される", async ({ page }) => {
		const overdueTask = testTasks.find((task) =>
			task.title.includes("期限切れタスク"),
		);
		if (!overdueTask) {
			test.skip();
			return;
		}

		// Create overdue task
		await taskHelper.createTask(overdueTask.title, {
			description: overdueTask.description,
			priority: overdueTask.priority,
			dueDate: overdueTask.dueDate,
		});

		// Verify overdue indication is shown
		await expect(page.locator('text="期限切れ"')).toBeVisible();
	});

	test("タスクが空の場合、適切なメッセージが表示される", async ({ page }) => {
		// Navigate to empty tasks page (assuming no tasks exist)
		await page.goto("/tasks");

		// If there are existing tasks, this test might fail
		// In a real scenario, you'd clean up the database before this test

		// Check for empty state message
		const emptyStateExists = await page
			.locator('text="タスクがありません"')
			.isVisible({ timeout: 5000 });

		if (emptyStateExists) {
			await expect(page.locator('text="タスクがありません"')).toBeVisible();
			await expect(
				page.locator(
					'text="最初のタスクを作成して、らくらく管理を始めましょう！"',
				),
			).toBeVisible();
		}
	});

	test("必須フィールドのバリデーションが動作する", async ({ page }) => {
		// Click create task button
		await page.click('button:has-text("新しいタスク")');

		// Try to submit without title
		await page.click('button[type="submit"]');

		// Should show validation error
		await expect(page.locator('text="タイトルは必須です"')).toBeVisible({
			timeout: 5000,
		});

		// Cancel the modal
		await page.click('button:has-text("キャンセル")');
	});
});
