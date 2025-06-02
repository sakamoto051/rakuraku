"use client";

import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { CreateTaskButton } from "./CreateTaskButton";

interface EmptyStateProps {
	hasFilters?: boolean;
	onClearFilters?: () => void;
}

export function EmptyState({
	hasFilters = false,
	onClearFilters,
}: EmptyStateProps) {
	if (hasFilters) {
		return (
			<div className="py-12 text-center">
				<ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-4 font-medium text-gray-900 text-lg">
					該当するタスクがありません
				</h3>
				<p className="mt-2 text-gray-500 text-sm">
					検索条件やフィルターを変更してみてください
				</p>
				<div className="mt-6">
					<button
						type="button"
						onClick={onClearFilters}
						className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						フィルターをクリア
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="py-12 text-center">
			<ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
			<h3 className="mt-4 font-medium text-gray-900 text-lg">
				タスクがありません
			</h3>
			<p className="mt-2 text-gray-500 text-sm">
				最初のタスクを作成して、らくらく管理を始めましょう！
			</p>
			<div className="mt-6">
				<CreateTaskButton />
			</div>
		</div>
	);
}
