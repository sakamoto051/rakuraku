import { PrismaClient } from "@prisma/client";

/**
 * E2Eテスト用のデータベースヘルパー
 * テストデータのクリーンアップと初期化を行う
 */
export class DatabaseHelper {
	private prisma: PrismaClient;

	constructor() {
		// E2Eテスト専用のデータベース接続を作成
		const databaseUrl =
			process.env.DATABASE_URL_E2E || process.env.DATABASE_URL;

		this.prisma = new PrismaClient({
			datasources: {
				db: {
					url: databaseUrl,
				},
			},
			// ログレベルを設定してデバッグを容易にする
			log: ["warn", "error"],
		});
	}

	/**
	 * データベースを完全にクリーンアップ
	 * 全てのテーブルのデータを削除
	 */
	async cleanDatabase() {
		const maxRetries = 3;
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				console.log(
					`[DatabaseHelper] Starting database cleanup (attempt ${attempt + 1}/${maxRetries})`,
				);

				// トランザクション内で一括削除を実行
				await this.prisma.$transaction(
					async (tx) => {
						// 外部キー制約を考慮して順序良く削除
						await tx.task.deleteMany();
						await tx.post.deleteMany();
						await tx.session.deleteMany();
						await tx.account.deleteMany();
						await tx.verificationToken.deleteMany();
						await tx.user.deleteMany();
						console.log(
							"[DatabaseHelper] All tables cleaned within transaction",
						);
					},
					{
						timeout: 10000, // 10秒のタイムアウト
					},
				);

				// クリーンアップ完了の確認
				await this.verifyCleanup();

				console.log("[DatabaseHelper] Database cleaned successfully");
				return; // 成功した場合はループを抜ける
			} catch (error: unknown) {
				attempt++;
				console.error(
					`[DatabaseHelper] Failed to clean database (attempt ${attempt}):`,
					error,
				);

				if (attempt >= maxRetries) {
					console.error("[DatabaseHelper] Max cleanup retries exceeded");
					throw error;
				}

				// リトライ前に少し待機
				await this.sleep(1000 * attempt);
			}
		}
	}

	/**
	 * クリーンアップ完了の確認
	 */
	private async verifyCleanup(): Promise<void> {
		try {
			const stats = await this.getStats();
			console.log("[DatabaseHelper] Post-cleanup stats:", stats);

			// 全てのテーブルが空であることを確認
			if (stats.users > 0 || stats.tasks > 0 || stats.sessions > 0) {
				throw new Error(
					`Cleanup verification failed. Remaining records: ${JSON.stringify(stats)}`,
				);
			}

			console.log("[DatabaseHelper] Cleanup verification passed");
		} catch (error) {
			console.error("[DatabaseHelper] Cleanup verification failed:", error);
			throw error;
		}
	}

	/**
	 * 指定時間待機するヘルパーメソッド
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * テスト用ユーザーを作成
	 */
	async createTestUser(userData: {
		email: string;
		name: string;
	}) {
		try {
			return await this.prisma.user.create({
				data: {
					email: userData.email,
					name: userData.name,
					emailVerified: new Date(),
				},
			});
		} catch (error: unknown) {
			console.error("Failed to create test user:", error);
			throw error;
		}
	}

	/**
	 * 特定のユーザーのタスクをすべて削除
	 */
	async deleteUserTasks(userId: string) {
		try {
			await this.prisma.task.deleteMany({
				where: {
					createdById: userId,
				},
			});
			console.log(`Deleted all tasks for user ${userId}`);
		} catch (error: unknown) {
			console.error("Failed to delete user tasks:", error);
			throw error;
		}
	}

	/**
	 * データベース接続を閉じる
	 */
	async disconnect() {
		try {
			console.log("[DatabaseHelper] Disconnecting from database");
			await this.prisma.$disconnect();
			console.log("[DatabaseHelper] Database disconnected successfully");
		} catch (error: unknown) {
			console.error("[DatabaseHelper] Error during disconnect:", error);
			// 接続終了エラーは致命的ではないので、ログのみ出力
		}
	}

	/**
	 * テストユーザーを取得または作成
	 */
	async getOrCreateTestUser(userData: {
		email: string;
		name: string;
	}) {
		try {
			let user = await this.prisma.user.findUnique({
				where: { email: userData.email },
			});

			if (!user) {
				user = await this.createTestUser(userData);
			}

			return user;
		} catch (error: unknown) {
			console.error("Failed to get or create test user:", error);
			throw error;
		}
	}

	/**
	 * データベース統計を取得（デバッグ用）
	 */
	async getStats() {
		try {
			const [userCount, taskCount, sessionCount, accountCount, postCount] =
				await Promise.all([
					this.prisma.user.count(),
					this.prisma.task.count(),
					this.prisma.session.count(),
					this.prisma.account.count(),
					this.prisma.post.count(),
				]);

			return {
				users: userCount,
				tasks: taskCount,
				sessions: sessionCount,
				accounts: accountCount,
				posts: postCount,
			};
		} catch (error: unknown) {
			console.error("[DatabaseHelper] Failed to get database stats:", error);
			throw error;
		}
	}

	/**
	 * 最強のデータベースクリーンアップ（テーブルを完全に削除して再作成）
	 */
	async forceResetDatabase() {
		try {
			console.log("[DatabaseHelper] Starting force database reset...");

			// 全てのテーブルを完全に削除
			await this.prisma.$executeRawUnsafe(`
				DROP SCHEMA IF EXISTS public CASCADE;
				CREATE SCHEMA public;
				GRANT ALL ON SCHEMA public TO postgres;
				GRANT ALL ON SCHEMA public TO public;
			`);

			console.log("[DatabaseHelper] Database schema reset completed");

			// Prismaマイグレーションを実行してテーブルを再作成
			const { spawn } = require("node:child_process");

			return new Promise((resolve, reject) => {
				const migrate = spawn("npx", ["prisma", "migrate", "deploy"], {
					cwd: process.cwd(),
					env: {
						...process.env,
						DATABASE_URL:
							process.env.DATABASE_URL_E2E || process.env.DATABASE_URL,
					},
					stdio: "pipe",
				});

				let output = "";
				migrate.stdout.on("data", (data: Buffer) => {
					output += data.toString();
				});

				migrate.stderr.on("data", (data: Buffer) => {
					output += data.toString();
				});

				migrate.on("close", (code: number) => {
					if (code === 0) {
						console.log("[DatabaseHelper] Migration completed successfully");
						console.log("[DatabaseHelper] Migration output:", output);
						resolve(true);
					} else {
						console.error("[DatabaseHelper] Migration failed with code:", code);
						console.error("[DatabaseHelper] Migration output:", output);
						reject(new Error(`Migration failed with code ${code}`));
					}
				});
			});
		} catch (error: unknown) {
			console.error("[DatabaseHelper] Force reset failed:", error);
			throw error;
		}
	}

	/**
	 * 最終手段としてのクリーンアップ（TRUNCATE使用）
	 */
	async forceTruncateAll() {
		try {
			console.log("[DatabaseHelper] Starting force truncate...");

			// 外部キー制約を一時的に無効化して全テーブルをクリア
			await this.prisma.$executeRawUnsafe(
				"SET session_replication_role = replica;",
			);

			const tableNames = [
				"Task",
				"Post",
				"Session",
				"Account",
				"VerificationToken",
				"User",
			];

			for (const tableName of tableNames) {
				try {
					await this.prisma.$executeRawUnsafe(
						`TRUNCATE TABLE "${tableName}" CASCADE;`,
					);
					console.log(`[DatabaseHelper] Truncated table: ${tableName}`);
				} catch (error: unknown) {
					console.log(
						`[DatabaseHelper] Failed to truncate ${tableName}:`,
						error instanceof Error ? error.message : String(error),
					);
				}
			}

			// 外部キー制約を再有効化
			await this.prisma.$executeRawUnsafe(
				"SET session_replication_role = DEFAULT;",
			);

			console.log("[DatabaseHelper] Force truncate completed");
		} catch (error: unknown) {
			console.error("[DatabaseHelper] Force truncate failed:", error);
			throw error;
		}
	}
}
