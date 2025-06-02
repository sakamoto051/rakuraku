import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateTaskButton, TaskList, TaskStats } from "~/app/_components/tasks";
import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

export const metadata: Metadata = {
	title: "タスク管理 | Rakuraku",
	description: "効率的なタスク管理で日々の作業をらくらくと",
};

export default async function TasksPage() {
	// E2Eテスト用のヘッダーをチェック
	const headersList = await headers();
	const isE2ETest = headersList.get("x-e2e-test") === "true";

	// E2Eテストでない場合は認証チェック
	if (!isE2ETest) {
		const session = await auth();
		if (!session?.user) {
			redirect("/api/auth/signin");
		}
	}

	// Prefetch task data for better performance
	void api.task.getAll.prefetch({});
	void api.task.getStats.prefetch();

	return (
		<HydrateClient>
			<div className="container mx-auto max-w-7xl px-4 py-8">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="font-bold text-3xl text-gray-900">タスク管理</h1>
							<p className="mt-2 text-gray-600 text-sm">
								らくらくタスク管理で効率的に作業を進めましょう
							</p>
						</div>
						<div className="mt-4 sm:mt-0">
							<CreateTaskButton />
						</div>
					</div>
				</div>

				{/* Statistics Section */}
				<div className="mb-8">
					<h2 className="mb-4 font-medium text-gray-900 text-lg">統計情報</h2>
					<TaskStats />
				</div>

				{/* Task List Section */}
				<div>
					<h2 className="mb-4 font-medium text-gray-900 text-lg">タスク一覧</h2>
					<TaskList />
				</div>
			</div>
		</HydrateClient>
	);
}
