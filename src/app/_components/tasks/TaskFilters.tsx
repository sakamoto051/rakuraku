"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TaskPriority, TaskStatus } from "@prisma/client";

interface TaskFiltersProps {
	search: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	sortBy: "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
	sortOrder: "asc" | "desc";
	onSearchChange: (search: string) => void;
	onStatusChange: (status?: TaskStatus) => void;
	onPriorityChange: (priority?: TaskPriority) => void;
	onSortChange: (
		sortBy: "createdAt" | "updatedAt" | "dueDate" | "priority" | "title",
		sortOrder: "asc" | "desc",
	) => void;
}

export function TaskFilters({
	search,
	status,
	priority,
	sortBy,
	sortOrder,
	onSearchChange,
	onStatusChange,
	onPriorityChange,
	onSortChange,
}: TaskFiltersProps) {
	const statusOptions = [
		{ value: undefined, label: "すべて" },
		{ value: TaskStatus.TODO, label: "未着手" },
		{ value: TaskStatus.IN_PROGRESS, label: "進行中" },
		{ value: TaskStatus.DONE, label: "完了" },
	];

	const priorityOptions = [
		{ value: undefined, label: "すべて" },
		{ value: TaskPriority.HIGH, label: "高" },
		{ value: TaskPriority.MEDIUM, label: "中" },
		{ value: TaskPriority.LOW, label: "低" },
	];

	const sortOptions = [
		{ value: "createdAt", label: "作成日" },
		{ value: "updatedAt", label: "更新日" },
		{ value: "dueDate", label: "期限" },
		{ value: "priority", label: "優先度" },
		{ value: "title", label: "タイトル" },
	] as const;

	const handleSortByChange = (newSortBy: string) => {
		onSortChange(newSortBy as typeof sortBy, sortOrder);
	};

	const handleSortOrderChange = (newSortOrder: string) => {
		onSortChange(sortBy, newSortOrder as "asc" | "desc");
	};

	return (
		<div className="space-y-4 lg:flex lg:items-center lg:space-x-4 lg:space-y-0">
			{/* Search */}
			<div className="max-w-md flex-1">
				<div className="relative">
					<MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="タスクを検索..."
						className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>
			</div>

			{/* Status Filter */}
			<div className="min-w-0 lg:w-32">
				<select
					value={status ?? ""}
					onChange={(e) =>
						onStatusChange(
							e.target.value ? (e.target.value as TaskStatus) : undefined,
						)
					}
					className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					{statusOptions.map((option) => (
						<option key={option.value ?? "all"} value={option.value ?? ""}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* Priority Filter */}
			<div className="min-w-0 lg:w-32">
				<select
					value={priority ?? ""}
					onChange={(e) =>
						onPriorityChange(
							e.target.value ? (e.target.value as TaskPriority) : undefined,
						)
					}
					className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					{priorityOptions.map((option) => (
						<option key={option.value ?? "all"} value={option.value ?? ""}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* Sort By */}
			<div className="min-w-0 lg:w-32">
				<select
					value={sortBy}
					onChange={(e) => handleSortByChange(e.target.value)}
					className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					{sortOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* Sort Order */}
			<div className="min-w-0 lg:w-24">
				<select
					value={sortOrder}
					onChange={(e) => handleSortOrderChange(e.target.value)}
					className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					<option value="desc">新しい順</option>
					<option value="asc">古い順</option>
				</select>
			</div>
		</div>
	);
}
