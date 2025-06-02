"use client";

import {
	CheckIcon,
	ClockIcon,
	FlagIcon,
	PencilIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckIconSolid } from "@heroicons/react/24/solid";
import { type Task, TaskPriority, TaskStatus } from "@prisma/client";
import { format, isAfter, isBefore, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { api } from "~/trpc/react";
import { EditTaskModal } from "./EditTaskModal";

interface TaskItemProps {
	task: Task;
	onTaskUpdated?: () => void;
}

export function TaskItem({ task, onTaskUpdated }: TaskItemProps) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const utils = api.useUtils();

	const toggleStatus = api.task.toggleStatus.useMutation({
		onSuccess: () => {
			onTaskUpdated?.();
			void utils.task.getAll.invalidate();
			void utils.task.getStats.invalidate();
		},
	});

	const deleteTask = api.task.delete.useMutation({
		onSuccess: () => {
			onTaskUpdated?.();
			void utils.task.getAll.invalidate();
			void utils.task.getStats.invalidate();
		},
	});

	const handleToggleStatus = async () => {
		await toggleStatus.mutateAsync({ id: task.id });
	};

	const handleDelete = async () => {
		if (window.confirm("このタスクを削除しますか？")) {
			setIsDeleting(true);
			try {
				await deleteTask.mutateAsync({ id: task.id });
			} catch (error) {
				console.error("Error deleting task:", error);
			} finally {
				setIsDeleting(false);
			}
		}
	};

	const getPriorityDisplay = (priority: TaskPriority) => {
		switch (priority) {
			case TaskPriority.HIGH:
				return {
					label: "高",
					color: "text-red-600",
					bgColor: "bg-red-50",
					borderColor: "border-red-200",
				};
			case TaskPriority.MEDIUM:
				return {
					label: "中",
					color: "text-yellow-600",
					bgColor: "bg-yellow-50",
					borderColor: "border-yellow-200",
				};
			case TaskPriority.LOW:
				return {
					label: "低",
					color: "text-green-600",
					bgColor: "bg-green-50",
					borderColor: "border-green-200",
				};
		}
	};

	const getStatusDisplay = (status: TaskStatus) => {
		switch (status) {
			case TaskStatus.TODO:
				return {
					label: "未着手",
					color: "text-gray-600",
					bgColor: "bg-gray-50",
					borderColor: "border-gray-200",
				};
			case TaskStatus.IN_PROGRESS:
				return {
					label: "進行中",
					color: "text-blue-600",
					bgColor: "bg-blue-50",
					borderColor: "border-blue-200",
				};
			case TaskStatus.DONE:
				return {
					label: "完了",
					color: "text-green-600",
					bgColor: "bg-green-50",
					borderColor: "border-green-200",
				};
		}
	};

	const getDueDateDisplay = (dueDate: Date | null) => {
		if (!dueDate) return null;

		const now = new Date();
		const isOverdue = isBefore(dueDate, now) && task.status !== TaskStatus.DONE;
		const isDueToday = isToday(dueDate);

		return {
			text: format(dueDate, "yyyy年MM月dd日", { locale: ja }),
			isOverdue,
			isDueToday,
			color: isOverdue
				? "text-red-600"
				: isDueToday
					? "text-orange-600"
					: "text-gray-600",
		};
	};

	const priorityDisplay = getPriorityDisplay(task.priority);
	const statusDisplay = getStatusDisplay(task.status);
	const dueDateDisplay = getDueDateDisplay(task.dueDate);

	const isCompleted = task.status === TaskStatus.DONE;

	return (
		<>
			<div
				data-testid="task-item"
				className={`rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
					isCompleted ? "opacity-75" : ""
				}`}
			>
				<div className="flex items-start justify-between">
					<div className="min-w-0 flex-1">
						{/* Title and checkbox */}
						<div className="flex items-center space-x-3">
							<button
								type="button"
								onClick={handleToggleStatus}
								disabled={toggleStatus.isPending}
								className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
									isCompleted
										? "border-green-500 bg-green-500 text-white"
										: "border-gray-300 hover:border-green-500 hover:bg-green-50"
								}`}
							>
								{isCompleted && <CheckIconSolid className="h-4 w-4" />}
							</button>
							<h3
								className={`font-medium text-lg ${isCompleted ? "text-gray-500 line-through" : "text-gray-900"}`}
							>
								{task.title}
							</h3>
						</div>

						{/* Description */}
						{task.description && (
							<p
								className={`mt-2 text-sm ${isCompleted ? "text-gray-400" : "text-gray-600"}`}
							>
								{task.description}
							</p>
						)}

						{/* Meta information */}
						<div className="mt-3 flex flex-wrap items-center gap-3">
							{/* Priority */}
							<span
								className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
									priorityDisplay.color
								} ${priorityDisplay.bgColor} ${priorityDisplay.borderColor} border`}
							>
								<FlagIcon className="mr-1 h-3 w-3" />
								{priorityDisplay.label}
							</span>

							{/* Status */}
							<span
								className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
									statusDisplay.color
								} ${statusDisplay.bgColor} ${statusDisplay.borderColor} border`}
							>
								{statusDisplay.label}
							</span>

							{/* Due date */}
							{dueDateDisplay && (
								<span
									className={`inline-flex items-center text-xs ${dueDateDisplay.color}`}
								>
									<ClockIcon className="mr-1 h-3 w-3" />
									{dueDateDisplay.text}
									{dueDateDisplay.isOverdue && (
										<span className="ml-1 font-medium">(期限切れ)</span>
									)}
									{dueDateDisplay.isDueToday && (
										<span className="ml-1 font-medium">(今日期限)</span>
									)}
								</span>
							)}
						</div>

						{/* Timestamps */}
						<div className="mt-2 text-gray-500 text-xs">
							作成:{" "}
							{format(task.createdAt, "yyyy年MM月dd日 HH:mm", { locale: ja })}
							{task.updatedAt.getTime() !== task.createdAt.getTime() && (
								<span className="ml-2">
									更新:{" "}
									{format(task.updatedAt, "yyyy年MM月dd日 HH:mm", {
										locale: ja,
									})}
								</span>
							)}
						</div>
					</div>

					{/* Action buttons */}
					<div className="ml-4 flex items-center space-x-2">
						<button
							type="button"
							onClick={() => setIsEditModalOpen(true)}
							className="rounded-md p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
							title="編集"
						>
							<PencilIcon className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isDeleting}
							className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
							title="削除"
						>
							<TrashIcon className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Edit Modal */}
			<EditTaskModal
				task={task}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onTaskUpdated={onTaskUpdated}
			/>
		</>
	);
}
