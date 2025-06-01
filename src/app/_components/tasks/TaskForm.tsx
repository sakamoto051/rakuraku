"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type Task, TaskPriority, TaskStatus } from "@prisma/client";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

// Validation schema
const taskFormSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルは必須です")
		.max(100, "タイトルは100文字以内で入力してください"),
	description: z.string().optional(),
	priority: z.nativeEnum(TaskPriority),
	dueDate: z.string().optional(), // Use string for HTML date input
	status: z.nativeEnum(TaskStatus).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
	task?: Task;
	onSubmit: (data: TaskFormData) => Promise<void>;
	onCancel: () => void;
	isEditing?: boolean;
	isLoading?: boolean;
}

export function TaskForm({
	task,
	onSubmit,
	onCancel,
	isEditing = false,
	isLoading = false,
}: TaskFormProps) {
	const [submitError, setSubmitError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<TaskFormData>({
		resolver: zodResolver(taskFormSchema),
		defaultValues: {
			title: task?.title ?? "",
			description: task?.description ?? "",
			priority: task?.priority ?? TaskPriority.MEDIUM,
			dueDate: task?.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
			status: task?.status ?? TaskStatus.TODO,
		},
	});

	const onSubmitHandler: SubmitHandler<TaskFormData> = async (data) => {
		try {
			setSubmitError(null);
			await onSubmit(data);
			if (!isEditing) {
				reset(); // Reset form after creating new task
			}
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : "エラーが発生しました",
			);
		}
	};

	const priorityOptions = [
		{ value: TaskPriority.LOW, label: "低" },
		{ value: TaskPriority.MEDIUM, label: "中" },
		{ value: TaskPriority.HIGH, label: "高" },
	];

	const statusOptions = [
		{ value: TaskStatus.TODO, label: "未着手" },
		{ value: TaskStatus.IN_PROGRESS, label: "進行中" },
		{ value: TaskStatus.DONE, label: "完了" },
	];

	return (
		<form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
			{/* Title */}
			<div>
				<label
					htmlFor="title"
					className="block font-medium text-gray-700 text-sm"
				>
					タイトル <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="title"
					{...register("title")}
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
						errors.title ? "border-red-300" : "border-gray-300"
					}`}
					placeholder="タスクのタイトルを入力してください"
				/>
				{errors.title && (
					<p className="mt-1 text-red-600 text-sm">{errors.title.message}</p>
				)}
			</div>

			{/* Description */}
			<div>
				<label
					htmlFor="description"
					className="block font-medium text-gray-700 text-sm"
				>
					説明
				</label>
				<textarea
					id="description"
					rows={3}
					{...register("description")}
					className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					placeholder="タスクの詳細を入力してください（任意）"
				/>
			</div>

			{/* Priority */}
			<div>
				<label
					htmlFor="priority"
					className="block font-medium text-gray-700 text-sm"
				>
					優先度
				</label>
				<select
					id="priority"
					{...register("priority")}
					className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				>
					{priorityOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{/* Due Date */}
			<div>
				<label
					htmlFor="dueDate"
					className="block font-medium text-gray-700 text-sm"
				>
					期限
				</label>
				<input
					type="date"
					id="dueDate"
					{...register("dueDate")}
					className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Status (only show for editing) */}
			{isEditing && (
				<div>
					<label
						htmlFor="status"
						className="block font-medium text-gray-700 text-sm"
					>
						ステータス
					</label>
					<select
						id="status"
						{...register("status")}
						className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Error Message */}
			{submitError && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-red-800 text-sm">{submitError}</p>
				</div>
			)}

			{/* Action Buttons */}
			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting || isLoading}
					className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isSubmitting || isLoading}
					className="rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isSubmitting || isLoading ? (
						<span className="flex items-center">
							<svg
								className="mr-2 h-4 w-4 animate-spin"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							{isEditing ? "更新中..." : "作成中..."}
						</span>
					) : isEditing ? (
						"更新"
					) : (
						"作成"
					)}
				</button>
			</div>
		</form>
	);
}
