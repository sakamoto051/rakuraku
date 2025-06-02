"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import type { TaskPriority } from "@prisma/client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { TaskForm } from "./TaskForm";

interface CreateTaskButtonProps {
	onTaskCreated?: () => void;
}

export function CreateTaskButton({ onTaskCreated }: CreateTaskButtonProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const utils = api.useUtils();
	const createTask = api.task.create.useMutation({
		onSuccess: () => {
			setIsModalOpen(false);
			onTaskCreated?.();
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
	}) => {
		await createTask.mutateAsync({
			title: data.title,
			description: data.description,
			priority: data.priority,
			dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
		});
	};

	const handleCancel = () => {
		setIsModalOpen(false);
	};

	return (
		<>
			{/* Create Task Button */}
			<button
				type="button"
				onClick={() => setIsModalOpen(true)}
				className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				<PlusIcon className="mr-2 h-4 w-4" />
				新しいタスク
			</button>

			{/* Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						{/* Backdrop */}
						<div
							className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
							onClick={handleCancel}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									handleCancel();
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
							aria-labelledby="create-task-title"
						>
							<div>
								<h3
									id="create-task-title"
									className="font-medium text-gray-900 text-lg leading-6"
								>
									新しいタスクを作成
								</h3>
								<div className="mt-6">
									<TaskForm
										onSubmit={handleSubmit}
										onCancel={handleCancel}
										isLoading={createTask.isPending}
									/>
								</div>
							</div>
						</dialog>
					</div>
				</div>
			)}
		</>
	);
}
