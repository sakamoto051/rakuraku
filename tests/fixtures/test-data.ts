// ユニークなテストデータ生成のためのヘルパー
const generateUniqueTaskData = (baseName: string, index = 0) => {
	const timestamp = Date.now();
	const uniqueId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
	return {
		title: `${baseName}_${uniqueId}`,
		uniqueId, // デバッグ用
	};
};

export const testTasks = [
	{
		...generateUniqueTaskData("テストタスク1"),
		description: "これは最初のテストタスクです",
		priority: "HIGH" as const,
		dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 1 week from now
	},
	{
		...generateUniqueTaskData("テストタスク2"),
		description: "これは2番目のテストタスクです",
		priority: "MEDIUM" as const,
		dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 3 days from now
	},
	{
		...generateUniqueTaskData("テストタスク3"),
		description: "これは3番目のテストタスクです",
		priority: "LOW" as const,
		dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 2 weeks from now
	},
	{
		...generateUniqueTaskData("期限切れタスク"),
		description: "これは期限切れのテストタスクです",
		priority: "HIGH" as const,
		dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // yesterday
	},
];

export const testUsers = {
	defaultUser: {
		email: "test@example.com",
		name: "テストユーザー",
	},
	secondUser: {
		email: "test2@example.com",
		name: "テストユーザー2",
	},
};
