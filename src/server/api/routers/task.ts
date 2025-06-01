import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Zod schemas for validation
const TaskStatusEnum = z.nativeEnum(TaskStatus);
const TaskPriorityEnum = z.nativeEnum(TaskPriority);

// Type definitions for Prisma where clauses
interface TaskWhereInput {
	createdById: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	OR?: Array<{
		title?: { contains: string; mode: "insensitive" };
		description?: { contains: string; mode: "insensitive" };
	}>;
}

interface TaskOrderByInput {
	[key: string]: "asc" | "desc";
}

interface TaskUpdateInput {
	title?: string;
	description?: string | null;
	priority?: TaskPriority;
	dueDate?: Date | null;
	status?: TaskStatus;
}

export const taskRouter = createTRPCRouter({
	// Create a new task
	create: protectedProcedure
		.input(
			z.object({
				title: z
					.string()
					.min(1, "タイトルは必須です")
					.max(100, "タイトルは100文字以内で入力してください"),
				description: z.string().optional(),
				priority: TaskPriorityEnum.default(TaskPriority.MEDIUM),
				dueDate: z.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const task = await ctx.db.task.create({
					data: {
						title: input.title,
						description: input.description,
						priority: input.priority,
						dueDate: input.dueDate,
						createdById: ctx.session.user.id,
					},
				});
				return task;
			} catch {
				throw new Error("タスクの作成に失敗しました");
			}
		}),

	// Get all tasks for the authenticated user
	getAll: protectedProcedure
		.input(
			z.object({
				status: TaskStatusEnum.optional(),
				priority: TaskPriorityEnum.optional(),
				sortBy: z
					.enum(["createdAt", "updatedAt", "dueDate", "priority", "title"])
					.default("createdAt"),
				sortOrder: z.enum(["asc", "desc"]).default("desc"),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			try {
				const where: TaskWhereInput = {
					createdById: ctx.session.user.id,
				};

				// Add filters
				if (input.status) {
					where.status = input.status;
				}

				if (input.priority) {
					where.priority = input.priority;
				}

				// Add search filter
				if (input.search) {
					where.OR = [
						{ title: { contains: input.search, mode: "insensitive" } },
						{ description: { contains: input.search, mode: "insensitive" } },
					];
				}

				// Build orderBy
				const orderBy: TaskOrderByInput = {};
				orderBy[input.sortBy] = input.sortOrder;

				const tasks = await ctx.db.task.findMany({
					where,
					orderBy,
				});

				return tasks;
			} catch {
				throw new Error("タスクの取得に失敗しました");
			}
		}),

	// Get a specific task by ID
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			try {
				const task = await ctx.db.task.findFirst({
					where: {
						id: input.id,
						createdById: ctx.session.user.id,
					},
				});

				if (!task) {
					throw new Error("タスクが見つかりません");
				}

				return task;
			} catch {
				throw new Error("タスクの取得に失敗しました");
			}
		}),

	// Update a task
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z
					.string()
					.min(1, "タイトルは必須です")
					.max(100, "タイトルは100文字以内で入力してください")
					.optional(),
				description: z.string().nullable().optional(),
				priority: TaskPriorityEnum.optional(),
				dueDate: z.date().nullable().optional(),
				status: TaskStatusEnum.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				// Verify the task belongs to the user
				const existingTask = await ctx.db.task.findFirst({
					where: {
						id: input.id,
						createdById: ctx.session.user.id,
					},
				});

				if (!existingTask) {
					throw new Error("タスクが見つかりません");
				}

				// Create update data object, excluding undefined values
				const updateData: TaskUpdateInput = {};

				if (input.title !== undefined) updateData.title = input.title;
				if (input.description !== undefined)
					updateData.description = input.description;
				if (input.priority !== undefined) updateData.priority = input.priority;
				if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
				if (input.status !== undefined) updateData.status = input.status;

				const updatedTask = await ctx.db.task.update({
					where: { id: input.id },
					data: updateData,
				});

				return updatedTask;
			} catch {
				throw new Error("タスクの更新に失敗しました");
			}
		}),

	// Delete a task
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				// Verify the task belongs to the user
				const existingTask = await ctx.db.task.findFirst({
					where: {
						id: input.id,
						createdById: ctx.session.user.id,
					},
				});

				if (!existingTask) {
					throw new Error("タスクが見つかりません");
				}

				await ctx.db.task.delete({
					where: { id: input.id },
				});

				return { success: true };
			} catch {
				throw new Error("タスクの削除に失敗しました");
			}
		}),

	// Get task statistics
	getStats: protectedProcedure.query(async ({ ctx }) => {
		try {
			const userId = ctx.session.user.id;

			const [
				totalTasks,
				completedTasks,
				inProgressTasks,
				overdueTasks,
				todayTasks,
			] = await Promise.all([
				// Total tasks
				ctx.db.task.count({
					where: { createdById: userId },
				}),

				// Completed tasks
				ctx.db.task.count({
					where: {
						createdById: userId,
						status: TaskStatus.DONE,
					},
				}),

				// In progress tasks
				ctx.db.task.count({
					where: {
						createdById: userId,
						status: TaskStatus.IN_PROGRESS,
					},
				}),

				// Overdue tasks
				ctx.db.task.count({
					where: {
						createdById: userId,
						dueDate: { lt: new Date() },
						status: { not: TaskStatus.DONE },
					},
				}),

				// Tasks due today
				ctx.db.task.count({
					where: {
						createdById: userId,
						dueDate: {
							gte: new Date(new Date().setHours(0, 0, 0, 0)),
							lt: new Date(new Date().setHours(23, 59, 59, 999)),
						},
						status: { not: TaskStatus.DONE },
					},
				}),
			]);

			const completionRate =
				totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

			return {
				totalTasks,
				completedTasks,
				inProgressTasks,
				overdueTasks,
				todayTasks,
				completionRate,
			};
		} catch {
			throw new Error("統計情報の取得に失敗しました");
		}
	}),

	// Toggle task status (for quick complete/uncomplete)
	toggleStatus: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				// Get current task
				const task = await ctx.db.task.findFirst({
					where: {
						id: input.id,
						createdById: ctx.session.user.id,
					},
				});

				if (!task) {
					throw new Error("タスクが見つかりません");
				}

				// Toggle status
				const newStatus =
					task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;

				const updatedTask = await ctx.db.task.update({
					where: { id: input.id },
					data: { status: newStatus },
				});

				return updatedTask;
			} catch {
				throw new Error("タスクの状態変更に失敗しました");
			}
		}),
});
