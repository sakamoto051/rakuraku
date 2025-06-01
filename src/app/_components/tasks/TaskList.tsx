"use client";

import type { TaskPriority, TaskStatus } from "@prisma/client";
import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { EmptyState } from "./EmptyState";
import { TaskFilters } from "./TaskFilters";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
	onTaskUpdated?: () => void;
}

export function TaskList({ onTaskUpdated }: TaskListProps) {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<TaskStatus | undefined>(undefined);
	const [priority, setPriority] = useState<TaskPriority | undefined>(undefined);
	const [sortBy, setSortBy] = useState<
		"createdAt" | "updatedAt" | "dueDate" | "priority" | "title"
	>("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Debounced search to avoid too many API calls
	const [debouncedSearch, setDebouncedSearch] = useState(search);

	// Simple debounce implementation
	useMemo(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);

		return () => clearTimeout(timer);
	}, [search]);

	const {
		data: tasks,
		isLoading,
		error,
		refetch,
	} = api.task.getAll.useQuery({
		status,
		priority,
		sortBy,
		sortOrder,
		search: debouncedSearch || undefined,
	});

	const handleSortChange = (
		newSortBy: typeof sortBy,
		newSortOrder: typeof sortOrder,
	) => {
		setSortBy(newSortBy);
		setSortOrder(newSortOrder);
	};

	const handleClearFilters = () => {
		setSearch("");
		setStatus(undefined);
		setPriority(undefined);
		setSortBy("createdAt");
		setSortOrder("desc");
	};

	const hasFilters = search || status || priority;

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4">
				<div className="flex items-center justify-between">
					<p className="text-red-800 text-sm">タスクの取得に失敗しました</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="font-medium text-red-600 text-sm hover:text-red-800"
					>
						再試行
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			<TaskFilters
				search={search}
				status={status}
				priority={priority}
				sortBy={sortBy}
				sortOrder={sortOrder}
				onSearchChange={setSearch}
				onStatusChange={setStatus}
				onPriorityChange={setPriority}
				onSortChange={handleSortChange}
			/>

			{/* Loading State */}
			{isLoading && (
				<div className="space-y-4">
					{["task-skeleton-1", "task-skeleton-2", "task-skeleton-3"].map(
						(key) => (
							<div
								key={key}
								className="animate-pulse rounded-lg border bg-white p-4"
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="mb-2 flex items-center space-x-3">
											<div className="h-6 w-6 rounded-full bg-gray-200" />
											<div className="h-6 w-1/2 rounded bg-gray-200" />
										</div>
										<div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
										<div className="flex space-x-2">
											<div className="h-6 w-16 rounded bg-gray-200" />
											<div className="h-6 w-16 rounded bg-gray-200" />
										</div>
									</div>
									<div className="flex space-x-2">
										<div className="h-8 w-8 rounded bg-gray-200" />
										<div className="h-8 w-8 rounded bg-gray-200" />
									</div>
								</div>
							</div>
						),
					)}
				</div>
			)}

			{/* Task List or Empty State */}
			{!isLoading &&
				(tasks && tasks.length > 0 ? (
					<div className="space-y-4">
						{tasks.map((task) => (
							<TaskItem
								key={task.id}
								task={task}
								onTaskUpdated={onTaskUpdated}
							/>
						))}
					</div>
				) : (
					<EmptyState
						hasFilters={!!hasFilters}
						onClearFilters={handleClearFilters}
					/>
				))}
		</div>
	);
}
