"use client";

import type { Task, TaskPriority, TaskStatus } from "@prisma/client";
import { api } from "~/trpc/react";
import { TaskForm } from "./TaskForm";

interface EditTaskModalProps {
	task: Task;
	isOpen: boolean;
	onClose: () => void;
	onTaskUpdated?: () => void;
}

export function EditTaskModal({
	task,
	isOpen,
	onClose,
	onTaskUpdated,
}: EditTaskModalProps) {
	const utils = api.useUtils();
	const updateTask = api.task.update.useMutation({
		onSuccess: () => {
			onClose();
			onTaskUpdated?.();
			// Invalidate queries to refresh the task list
			void utils.task.getAll.invalidate();
			void utils.task.getStats.invalidate();
		},
	});

	const handleSubmit = async (data: {
		title: string;
		description?: string;
		priority: TaskPriority;
		dueDate?: string;
		status?: TaskStatus;
	}) => {
		await updateTask.mutateAsync({
			id: task.id,
			title: data.title,
			description: data.description,
			priority: data.priority,
			dueDate: data.dueDate ? new Date(data.dueDate) : null,
			status: data.status,
		});
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
				{/* Backdrop */}
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
					onClick={onClose}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							onClose();
						}
					}}
					tabIndex={0}
					role="button"
					aria-label="モーダルを閉じる"
				/>

				{/* Modal Content */}
				<dialog
					open
					className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
					aria-labelledby="edit-task-title"
				>
					<div>
						<h3
							id="edit-task-title"
							className="font-medium text-gray-900 text-lg leading-6"
						>
							タスクを編集
						</h3>
						<div className="mt-6">
							<TaskForm
								task={task}
								onSubmit={handleSubmit}
								onCancel={onClose}
								isEditing={true}
								isLoading={updateTask.isPending}
							/>
						</div>
					</div>
				</dialog>
			</div>
		</div>
	);
}
