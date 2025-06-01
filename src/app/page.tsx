import {
	ArrowRightIcon,
	CheckCircleIcon,
	ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { CreateTaskButton } from "~/app/_components/tasks";
import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

export default async function Home() {
	const session = await auth();

	// Prefetch task stats if user is logged in
	if (session?.user) {
		void api.task.getStats.prefetch();
	}

	return (
		<HydrateClient>
			<div className="container mx-auto max-w-7xl px-4 py-8">
				{/* Hero Section */}
				<div className="mb-16 text-center">
					<h1 className="mb-6 font-bold text-4xl text-gray-900 sm:text-6xl">
						<span className="text-blue-600">らくらく</span>タスク管理
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-gray-600 text-xl">
						効率的なタスク管理で日々の作業をもっと楽に。
						直感的なインターフェースで、あなたの生産性を向上させます。
					</p>

					{session?.user ? (
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Link
								href="/tasks"
								className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 font-medium text-base text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<ClipboardDocumentListIcon className="mr-2 h-5 w-5" />
								タスク管理を開始
								<ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
							<CreateTaskButton />
						</div>
					) : (
						<Link
							href="/api/auth/signin"
							className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 font-medium text-base text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							始める
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Link>
					)}
				</div>

				{/* Features Section */}
				<div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="rounded-full bg-blue-100 p-3">
								<ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
							</div>
						</div>
						<h3 className="mb-2 font-semibold text-gray-900 text-lg">
							シンプルなタスク管理
						</h3>
						<p className="text-gray-600">
							直感的なUIでタスクの作成、編集、完了が簡単に行えます。
						</p>
					</div>

					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="rounded-full bg-green-100 p-3">
								<CheckCircleIcon className="h-8 w-8 text-green-600" />
							</div>
						</div>
						<h3 className="mb-2 font-semibold text-gray-900 text-lg">
							進捗の可視化
						</h3>
						<p className="text-gray-600">
							統計情報とダッシュボードで、あなたの進捗を一目で確認できます。
						</p>
					</div>

					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<div className="rounded-full bg-purple-100 p-3">
								<ArrowRightIcon className="h-8 w-8 text-purple-600" />
							</div>
						</div>
						<h3 className="mb-2 font-semibold text-gray-900 text-lg">
							効率的なワークフロー
						</h3>
						<p className="text-gray-600">
							優先度設定や期限管理で、重要なタスクに集中できます。
						</p>
					</div>
				</div>

				{/* Call to Action */}
				{!session?.user && (
					<div className="rounded-lg bg-blue-50 p-8 text-center">
						<h2 className="mb-4 font-bold text-2xl text-gray-900">
							今すぐ始めましょう
						</h2>
						<p className="mb-6 text-gray-600">
							無料でアカウントを作成して、らくらくタスク管理を体験してください。
						</p>
						<Link
							href="/api/auth/signin"
							className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 font-medium text-base text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							サインアップ
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Link>
					</div>
				)}
			</div>
		</HydrateClient>
	);
}
