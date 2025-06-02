"use client";

import {
	CheckCircleIcon,
	ClipboardDocumentListIcon,
	ClockIcon,
	ExclamationTriangleIcon,
	PlayIcon,
} from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";

export function TaskStats() {
	const { data: stats, isLoading, error } = api.task.getStats.useQuery();

	if (isLoading) {
		const loadingKeys = [
			"total-stats",
			"completed-stats",
			"progress-stats",
			"overdue-stats",
			"today-stats",
		];
		return (
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				{loadingKeys.map((key) => (
					<div
						key={key}
						className="animate-pulse rounded-lg border bg-white p-4"
					>
						<div className="mb-2 h-4 rounded bg-gray-200" />
						<div className="h-8 rounded bg-gray-200" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4">
				<p className="text-red-800 text-sm">統計情報の取得に失敗しました</p>
			</div>
		);
	}

	if (!stats) return null;

	const statItems = [
		{
			label: "総タスク数",
			value: stats.totalTasks,
			icon: ClipboardDocumentListIcon,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			label: "完了タスク",
			value: stats.completedTasks,
			icon: CheckCircleIcon,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			label: "進行中",
			value: stats.inProgressTasks,
			icon: PlayIcon,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
		},
		{
			label: "期限切れ",
			value: stats.overdueTasks,
			icon: ExclamationTriangleIcon,
			color: "text-red-600",
			bgColor: "bg-red-50",
		},
		{
			label: "今日期限",
			value: stats.todayTasks,
			icon: ClockIcon,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
			{statItems.map((item) => (
				<div
					key={item.label}
					className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
				>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-gray-600 text-sm">{item.label}</p>
							<p className="font-bold text-2xl text-gray-900">{item.value}</p>
						</div>
						<div className={`rounded-full p-3 ${item.bgColor}`}>
							<item.icon className={`h-6 w-6 ${item.color}`} />
						</div>
					</div>
				</div>
			))}

			{/* Completion Rate */}
			{stats.totalTasks > 0 && (
				<div className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md md:col-span-5">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-medium text-gray-600 text-sm">完了率</span>
						<span className="font-bold text-gray-900 text-sm">
							{stats.completionRate}%
						</span>
					</div>
					<div className="h-2 w-full rounded-full bg-gray-200">
						<div
							className="h-2 rounded-full bg-green-600 transition-all duration-300"
							style={{ width: `${stats.completionRate}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
