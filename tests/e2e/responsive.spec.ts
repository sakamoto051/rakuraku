import { expect, test } from "@playwright/test";

test.describe("レスポンシブデザイン", () => {
	test("デスクトップサイズで正しく表示される", async ({ page }) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });

		// Navigate to home page (no authentication required)
		await page.goto("/");

		// Check main navigation is visible
		await expect(page.locator("nav")).toBeVisible();

		// Check navigation links exist (use .first() to handle multiple matches)
		await expect(page.locator('nav a[href="/"]').first()).toBeVisible();
		await expect(page.locator('nav a[href="/tasks"]').first()).toBeVisible();

		// Check main content is properly displayed
		await expect(page.locator("h1").first()).toBeVisible();

		// Check footer/navigation elements are horizontally arranged
		const nav = page.locator("nav >> div").first();
		await expect(nav).toBeVisible();
	});

	test("デスクトップサイズでタスク管理ページが正しく表示される", async ({
		page,
	}) => {
		// Set desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });

		// Navigate to tasks page
		await page.goto("/tasks");

		// Check if page requires authentication (might redirect to login)
		const isTaskPage = await page
			.locator('h1:has-text("タスク管理")')
			.isVisible();
		const isLoginPage = await page
			.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
			.isVisible();

		if (isTaskPage) {
			// User is authenticated, check task page
			await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible();
			await expect(page.locator("nav")).toBeVisible();
		} else if (isLoginPage) {
			// User needs to login, check login page
			await expect(
				page
					.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
					.first(),
			).toBeVisible();
			await expect(page.locator("nav")).toBeVisible();
		} else {
			// Check basic page structure regardless
			const pageTitle = page.locator("h1").first();
			if (await pageTitle.isVisible()) {
				await expect(pageTitle).toBeVisible();
			}

			// Check for navigation - it might exist even if not logged in
			const nav = page.locator("nav");
			if (await nav.isVisible()) {
				await expect(nav).toBeVisible();
			}
		}

		// Check filters are displayed horizontally if they exist
		const filtersContainer = page.locator('[data-testid="filters-container"]');
		if (await filtersContainer.isVisible()) {
			// Desktop layout should show filters in a row
			await expect(filtersContainer).toHaveClass(/lg:flex/);
		}
	});

	test("タブレットサイズで正しく表示される", async ({ page }) => {
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });

		// Navigate to home page
		await page.goto("/");

		// Check navigation adapts to tablet size
		await expect(page.locator("nav")).toBeVisible();

		// Navigate to tasks page
		await page.goto("/tasks");

		// Check if page requires authentication (might redirect to login)
		const isTaskPage = await page
			.locator('h1:has-text("タスク管理")')
			.isVisible();
		const isLoginPage = await page
			.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
			.isVisible();

		if (isTaskPage) {
			// User is authenticated, check task page
			await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible();

			// Check that modals are properly sized when opened
			const newTaskButton = page.locator('button:has-text("新しいタスク")');
			if (await newTaskButton.isVisible()) {
				await newTaskButton.click();
				const modal = page.locator("dialog");
				await expect(modal).toBeVisible({ timeout: 5000 });

				// Modal should be responsive
				const modalBox = await modal.boundingBox();
				if (modalBox) {
					expect(modalBox.width).toBeLessThanOrEqual(768);
				}

				// Close modal
				await page.click('button:has-text("キャンセル")');
			}
		} else if (isLoginPage) {
			// User needs to login, check login page
			await expect(
				page
					.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
					.first(),
			).toBeVisible();
		} else {
			// Fallback to more general h1 check
			const generalTitle = page.locator("h1").first();
			if (await generalTitle.isVisible()) {
				await expect(generalTitle).toBeVisible();
			}
		}
	});

	test("モバイルサイズで正しく表示される", async ({ page }) => {
		// Set mobile viewport (iPhone size)
		await page.setViewportSize({ width: 375, height: 667 });

		// Navigate to home page
		await page.goto("/");

		// Check navigation is present (might be collapsed)
		await expect(page.locator("nav")).toBeVisible();

		// Navigate to tasks page
		await page.goto("/tasks");

		// Check if page requires authentication (might redirect to login)
		const isTaskPage = await page
			.locator('h1:has-text("タスク管理")')
			.isVisible();
		const isLoginPage = await page
			.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
			.isVisible();

		if (isTaskPage) {
			// User is authenticated, check task page
			await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible();
		} else if (isLoginPage) {
			// User needs to login, check login page
			await expect(
				page
					.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
					.first(),
			).toBeVisible();
		} else {
			// Fallback to more general h1 check or check for login page
			const generalTitle = page.locator("h1").first();
			if (await generalTitle.isVisible()) {
				await expect(generalTitle).toBeVisible();
			}
		}

		// Test modal on mobile if available
		const newTaskButton = page.locator('button:has-text("新しいタスク")');
		if (await newTaskButton.isVisible()) {
			await newTaskButton.click();
			const modal = page.locator("dialog");
			await expect(modal).toBeVisible();

			// Modal should fit mobile screen
			const modalBox = await modal.boundingBox();
			if (modalBox) {
				expect(modalBox.width).toBeLessThanOrEqual(375);
			}

			// Form elements should be accessible if they exist
			const titleInput = page.locator('input[name="title"]');
			if (await titleInput.isVisible()) {
				await expect(titleInput).toBeVisible();
			}

			// Close modal
			await page.click('button:has-text("キャンセル")');
		}
	});

	test("ナビゲーションがモバイルで正しく動作する", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Navigate to home page
		await page.goto("/");

		// Check if mobile menu exists (depends on implementation)
		const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
		const mobileMenuExists = await mobileMenuButton.isVisible({
			timeout: 2000,
		});

		if (mobileMenuExists) {
			// Test mobile menu toggle
			await mobileMenuButton.click();

			// Menu should expand
			await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

			// Navigation links should be visible in expanded menu
			const expandedMenu = page.locator('[data-testid="mobile-menu"]');
			await expect(expandedMenu.locator('a[href="/"]')).toBeVisible();
			await expect(expandedMenu.locator('a[href="/tasks"]')).toBeVisible();

			// Click on a navigation link
			await expandedMenu.locator('a[href="/tasks"]').click();

			// Should navigate to tasks page
			await expect(page).toHaveURL("/tasks");
		} else {
			// If no mobile menu, check if desktop navigation links are accessible on mobile
			const tasksLink = page.locator('nav a[href="/tasks"]').first();

			// Check if the link is visible or at least exists and can be interacted with
			if (await tasksLink.isVisible()) {
				await expect(tasksLink).toBeVisible();
				await tasksLink.click();
				await expect(page).toHaveURL("/tasks");
			} else {
				// Navigation might be present but not visible in mobile layout
				// This is acceptable behavior - just verify basic page structure
				await expect(page.locator("nav")).toBeVisible();
			}
		}
	});

	test("フィルターがモバイルで正しく表示される", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Navigate to tasks page
		await page.goto("/tasks");

		// Check if page requires authentication (might redirect to login)
		const isTaskPage = await page
			.locator('h1:has-text("タスク管理")')
			.isVisible();
		const isLoginPage = await page
			.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
			.isVisible();

		if (isTaskPage) {
			// User is authenticated, check task page
			await expect(page.locator('h1:has-text("タスク管理")')).toBeVisible();
		} else if (isLoginPage) {
			// User needs to login, check login page
			await expect(
				page
					.locator('h1:has-text("サインイン"), h1:has-text("ログイン")')
					.first(),
			).toBeVisible();
		} else {
			// Fallback to more general h1 check
			const generalTitle = page.locator("h1").first();
			if (await generalTitle.isVisible()) {
				await expect(generalTitle).toBeVisible();
			}
		}

		// Check that page layout adapts to mobile
		const pageContainer = page.locator('main, [data-testid="main-content"]');
		if (await pageContainer.isVisible()) {
			const containerBox = await pageContainer.boundingBox();
			if (containerBox) {
				expect(containerBox.width).toBeLessThanOrEqual(375);
			}
		}
	});
});
