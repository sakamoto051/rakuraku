import { type Page, expect } from "@playwright/test";

export class TaskHelper {
	constructor(private page: Page) {}

	async createTask(
		title: string,
		options?: {
			description?: string;
			priority?: "LOW" | "MEDIUM" | "HIGH";
			dueDate?: string;
		},
	) {
		console.log(`[TaskHelper] Creating task: ${title}`);

		// まず、ページが正しく読み込まれているかを確認
		await this.page.waitForLoadState("domcontentloaded");

		// 認証エラーや権限エラーがないかチェック
		const unauthorizedText = await this.page
			.locator('text="UNAUTHORIZED"')
			.isVisible({ timeout: 1000 });
		if (unauthorizedText) {
			throw new Error(
				"UNAUTHORIZED error detected. User may not be properly authenticated.",
			);
		}

		// タスク作成ボタンをクリック
		console.log("[TaskHelper] Clicking create task button...");
		try {
			await this.page.click('button:has-text("新しいタスク")', {
				timeout: 15000,
			});
		} catch (error: unknown) {
			// ボタンが見つからない場合、ページの状態を診断
			console.log(
				"[TaskHelper] Create task button not found. Current page state:",
			);
			const currentUrl = this.page.url();
			console.log(`  URL: ${currentUrl}`);

			// 利用可能なボタンを確認
			const buttons = await this.page.locator("button").all();
			console.log(`  Found ${buttons.length} buttons:`);
			for (let i = 0; i < Math.min(buttons.length, 5); i++) {
				const button = buttons[i];
				if (!button) continue;
				const buttonText = await button.textContent();
				console.log(`    Button ${i + 1}: "${buttonText}"`);
			}

			throw new Error(
				`Create task button not found: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// モーダルが開くまで待機
		console.log("[TaskHelper] Waiting for modal to open...");
		try {
			await this.page.waitForSelector("form", { timeout: 10000 });
			console.log("[TaskHelper] Task creation modal opened");
		} catch (error: unknown) {
			throw new Error(
				`Task creation modal did not open: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// フォームフィールドを入力
		console.log("[TaskHelper] Filling form fields...");
		try {
			// タイトルを入力
			await this.page.fill('input[name="title"]', title);

			// 入力値を確認
			const titleValue = await this.page.inputValue('input[name="title"]');
			console.log(`[TaskHelper] Title entered: "${titleValue}"`);

			// オプションフィールドを入力
			if (options?.description) {
				await this.page.fill(
					'textarea[name="description"]',
					options.description,
				);
				console.log(
					`[TaskHelper] Description entered: "${options.description}"`,
				);
			}

			if (options?.priority) {
				await this.page.selectOption(
					'select[name="priority"]',
					options.priority,
				);
				console.log(`[TaskHelper] Priority set to: ${options.priority}`);
			}

			if (options?.dueDate) {
				await this.page.fill('input[name="dueDate"]', options.dueDate);
				console.log(`[TaskHelper] Due date set to: ${options.dueDate}`);
			}
		} catch (error: unknown) {
			throw new Error(
				`Failed to fill form fields: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// フォームを送信
		console.log("[TaskHelper] Submitting form...");
		try {
			await this.page.click('button[type="submit"]');
		} catch (error: unknown) {
			throw new Error(
				`Failed to submit form: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// タスク作成の成功を複数の方法で確認
		console.log("[TaskHelper] Waiting for task creation to complete...");
		let taskCreated = false;

		// 方法1: API レスポンスを待機
		try {
			await this.page.waitForResponse(
				(response) =>
					response.url().includes("/api/trpc/task.create") &&
					response.status() === 200,
				{ timeout: 15000 },
			);
			console.log("[TaskHelper] Task creation API response received");
			taskCreated = true;
		} catch (apiError: unknown) {
			console.log(
				"[TaskHelper] API response timeout, checking alternative methods...",
			);
		}

		// 方法2: タスクリストに表示されるかを確認
		if (!taskCreated) {
			try {
				await this.page.waitForSelector(`text="${title}"`, { timeout: 10000 });
				console.log("[TaskHelper] Task found in task list");
				taskCreated = true;
			} catch (listError: unknown) {
				console.log(
					"[TaskHelper] Task not found in list, checking for errors...",
				);
			}
		}

		// エラー状態をチェック
		if (!taskCreated) {
			// フォームにエラーメッセージがないかチェック
			const errorElements = await this.page
				.locator('[role="alert"], .error, text="エラー"')
				.all();
			if (errorElements.length > 0) {
				const firstError = errorElements[0];
				if (firstError) {
					const errorText = await firstError.textContent();
					throw new Error(`Task creation failed with error: ${errorText}`);
				}
			}

			// UNAUTHORIZEDエラーをチェック
			const unauthorizedError = await this.page
				.locator('text="UNAUTHORIZED"')
				.isVisible({ timeout: 2000 });
			if (unauthorizedError) {
				throw new Error(
					"Task creation failed: UNAUTHORIZED - User authentication issue",
				);
			}

			throw new Error(
				`Failed to create task "${title}": Task was not created within the expected time`,
			);
		}

		// モーダルが閉じるまで待機（オプション）
		try {
			await this.page.waitForSelector("form", {
				state: "detached",
				timeout: 8000,
			});
			console.log("[TaskHelper] Modal closed successfully");
		} catch {
			// モーダルが閉じない場合でも、タスクが作成されていれば成功とみなす
			console.log(
				"[TaskHelper] Modal may still be visible, but task was created successfully",
			);

			// 手動でモーダルを閉じてみる
			try {
				const closeButton = this.page
					.locator(
						'button:has-text("キャンセル"), button:has-text("閉じる"), button[aria-label="Close"]',
					)
					.first();
				if (await closeButton.isVisible({ timeout: 2000 })) {
					await closeButton.click();
					console.log("[TaskHelper] Manually closed modal");
				}
			} catch {
				// モーダルが閉じられない場合は無視
			}
		}

		console.log(`[TaskHelper] Task "${title}" created successfully`);
	}

	async editTask(
		originalTitle: string,
		newData: {
			title?: string;
			description?: string;
			priority?: "LOW" | "MEDIUM" | "HIGH";
			status?: "TODO" | "IN_PROGRESS" | "DONE";
			dueDate?: string;
		},
	) {
		// Find task card by title using data-testid and click edit button
		const taskCard = this.page.locator(
			`[data-testid="task-item"]:has-text("${originalTitle}")`,
		);

		await taskCard.locator('button[title="編集"]').click();

		// Wait for modal to open
		await this.page.waitForSelector("form", { timeout: 5000 });

		// Update fields
		if (newData.title) {
			await this.page.fill('input[name="title"]', newData.title);
		}

		if (newData.description !== undefined) {
			await this.page.fill('textarea[name="description"]', newData.description);
		}

		if (newData.priority) {
			await this.page.selectOption('select[name="priority"]', newData.priority);
		}

		if (newData.status) {
			await this.page.selectOption('select[name="status"]', newData.status);
		}

		if (newData.dueDate !== undefined) {
			await this.page.fill('input[name="dueDate"]', newData.dueDate);
		}

		// Submit form
		await this.page.click('button[type="submit"]:has-text("更新")');

		// Wait for modal to close
		await this.page.waitForSelector("form", {
			state: "detached",
			timeout: 5000,
		});
	}

	async deleteTask(title: string) {
		console.log(`[TaskHelper] Deleting task: ${title}`);

		// ダイアログリスナーを設定
		this.page.once("dialog", async (dialog) => {
			console.log(
				`[TaskHelper] Confirmation dialog appeared: ${dialog.message()}`,
			);
			expect(dialog.message()).toContain("削除しますか");
			await dialog.accept();
			console.log("[TaskHelper] Deletion confirmed");
		});

		// タスクカードを見つけて削除ボタンをクリック
		try {
			const taskCard = this.page.locator(
				`[data-testid="task-item"]:has-text("${title}")`,
			);

			// タスクカードが存在するかを確認
			await taskCard.waitFor({ timeout: 10000 });
			console.log(`[TaskHelper] Found task card for: ${title}`);

			// 削除ボタンをクリック
			await taskCard.locator('button[title="削除"]').click();
			console.log("[TaskHelper] Clicked delete button");
		} catch (error: unknown) {
			throw new Error(
				`Failed to find or click delete button for task "${title}": ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		// 削除APIの完了を待機
		let deleteCompleted = false;
		try {
			await this.page.waitForResponse(
				(response) =>
					response.url().includes("/api/trpc/task.delete") &&
					response.status() === 200,
				{ timeout: 15000 },
			);
			console.log("[TaskHelper] Delete API response received");
			deleteCompleted = true;
		} catch (error: unknown) {
			console.log(
				"[TaskHelper] Delete API response timeout, checking if task was removed...",
			);
		}

		// タスクがリストから削除されるまで待機
		try {
			await this.page.waitForSelector(
				`[data-testid="task-item"]:has-text("${title}")`,
				{
					state: "detached",
					timeout: 12000,
				},
			);
			console.log(`[TaskHelper] Task "${title}" removed from list`);
		} catch (error: unknown) {
			// タスクがまだ存在するかを最終確認
			const taskStillExists = await this.page
				.locator(`[data-testid="task-item"]:has-text("${title}")`)
				.isVisible({ timeout: 3000 });
			if (taskStillExists) {
				throw new Error(
					`Failed to delete task "${title}": Task still exists in the list`,
				);
			}
			console.log(
				`[TaskHelper] Task "${title}" deletion completed (task no longer visible)`,
			);
		}

		console.log(`[TaskHelper] Task "${title}" deleted successfully`);
	}

	async toggleTaskStatus(title: string) {
		// Find task using data-testid and click checkbox
		const taskCard = this.page.locator(
			`[data-testid="task-item"]:has-text("${title}")`,
		);
		await taskCard.locator("button").first().click(); // First button is the checkbox

		// Wait for status update API call to complete
		try {
			await this.page.waitForResponse(
				(response) =>
					response.url().includes("/api/trpc/task.toggleStatus") &&
					response.status() === 200,
				{ timeout: 5000 },
			);
		} catch (error: unknown) {
			console.log("Toggle status API timeout, continuing...");
		}

		// Wait a moment for the UI to update
		await this.page.waitForTimeout(1000);
	}

	async filterTasks(options: {
		search?: string;
		status?: "すべて" | "未着手" | "進行中" | "完了";
		priority?: "すべて" | "高" | "中" | "低";
		sortBy?: "作成日" | "更新日" | "期限" | "優先度" | "タイトル";
		sortOrder?: "新しい順" | "古い順";
	}) {
		console.log("[TaskHelper] Applying filters:", options);

		if (options.search !== undefined) {
			await this.page.fill(
				'input[placeholder*="タスクを検索"]',
				options.search,
			);
			console.log(`[TaskHelper] Search filter applied: "${options.search}"`);
			// Wait for debounced search
			await this.page.waitForTimeout(500);
		}

		if (options.status) {
			// Find status selector (should be the first select after search)
			const statusSelect = this.page.locator("select").nth(0);
			await statusSelect.selectOption({ label: options.status });
			console.log(`[TaskHelper] Status filter applied: "${options.status}"`);
		}

		if (options.priority) {
			// Find priority selector (should be the second select after search)
			const prioritySelect = this.page.locator("select").nth(1);
			await prioritySelect.selectOption({ label: options.priority });
			console.log(
				`[TaskHelper] Priority filter applied: "${options.priority}"`,
			);
		}

		if (options.sortBy) {
			// Find sort by selector (should be the third select after search)
			const sortBySelect = this.page.locator("select").nth(2);
			await sortBySelect.selectOption({ label: options.sortBy });
			console.log(`[TaskHelper] Sort by applied: "${options.sortBy}"`);
		}

		if (options.sortOrder) {
			// Find sort order selector (should be the fourth select after search)
			const sortOrderSelect = this.page.locator("select").nth(3);
			await sortOrderSelect.selectOption({ label: options.sortOrder });
			console.log(`[TaskHelper] Sort order applied: "${options.sortOrder}"`);
		}

		// Wait for filter to be applied
		await this.page.waitForTimeout(1000);
		console.log("[TaskHelper] Filters applied successfully");
	}

	async clearFilters() {
		console.log("[TaskHelper] Clearing all filters");

		// Clear search input
		await this.page.fill('input[placeholder*="タスクを検索"]', "");

		// Reset status to "すべて"
		const statusSelect = this.page.locator("select").nth(0);
		await statusSelect.selectOption({ label: "すべて" });

		// Reset priority to "すべて"
		const prioritySelect = this.page.locator("select").nth(1);
		await prioritySelect.selectOption({ label: "すべて" });

		// Reset sort by to "作成日"
		const sortBySelect = this.page.locator("select").nth(2);
		await sortBySelect.selectOption({ label: "作成日" });

		// Reset sort order to "新しい順"
		const sortOrderSelect = this.page.locator("select").nth(3);
		await sortOrderSelect.selectOption({ label: "新しい順" });

		// Wait for filters to be cleared
		await this.page.waitForTimeout(1000);
		console.log("[TaskHelper] All filters cleared");
	}

	async getVisibleTaskTitles(): Promise<string[]> {
		await this.page.waitForTimeout(500); // Wait for any filtering to complete
		const taskItems = this.page.locator('[data-testid="task-item"]');
		const count = await taskItems.count();
		const titles: string[] = [];

		for (let i = 0; i < count; i++) {
			const taskItem = taskItems.nth(i);
			const titleElement = taskItem.locator("h3");
			const title = await titleElement.textContent();
			if (title) {
				titles.push(title.trim());
			}
		}

		return titles;
	}

	async isEmptyStateVisible(): Promise<boolean> {
		return await this.page
			.locator('text="タスクがありません"')
			.isVisible({ timeout: 3000 });
	}

	async isEmptyFilterStateVisible(): Promise<boolean> {
		return await this.page
			.locator('text="該当するタスクがありません"')
			.isVisible({ timeout: 3000 });
	}

	async waitForFilterResults(expectedCount?: number) {
		// Wait for debounced search and API calls to complete
		await this.page.waitForTimeout(800);

		if (expectedCount !== undefined) {
			await expect(async () => {
				const currentTaskCount = await this.page
					.locator('[data-testid="task-item"]')
					.count();
				expect(currentTaskCount).toBe(expectedCount);
			}).toPass({ timeout: 10000 });
		}
	}

	async getTaskCount(): Promise<number> {
		await this.page.waitForTimeout(1000); // Wait for tasks to load
		const tasks = await this.page.locator('[data-testid="task-item"]').count();
		return tasks;
	}

	async getStats() {
		const stats: Record<string, string> = {};

		// Get all stat cards
		const statCards = this.page.locator('[data-testid="stat-card"]');
		const count = await statCards.count();

		for (let i = 0; i < count; i++) {
			const card = statCards.nth(i);
			const label = await card.locator("p").first().textContent();
			const value = await card.locator("p").nth(1).textContent();

			if (label && value) {
				stats[label] = value;
			}
		}

		return stats;
	}
}
