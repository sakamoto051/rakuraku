export default function TasksLoading() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Header Section Loading */}
			<div className="mb-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-200" />
						<div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
					</div>
					<div className="mt-4 sm:mt-0">
						<div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
					</div>
				</div>
			</div>

			{/* Statistics Section Loading */}
			<div className="mb-8">
				<div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200" />
				<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
					{["stats-1", "stats-2", "stats-3", "stats-4", "stats-5"].map((id) => (
						<div
							key={id}
							className="animate-pulse rounded-lg border bg-white p-4"
						>
							<div className="mb-2 h-4 rounded bg-gray-200" />
							<div className="h-8 rounded bg-gray-200" />
						</div>
					))}
				</div>
			</div>

			{/* Task List Section Loading */}
			<div>
				<div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200" />

				{/* Filters Loading */}
				<div className="mb-6 space-y-4 lg:flex lg:items-center lg:space-x-4 lg:space-y-0">
					<div className="max-w-md flex-1">
						<div className="h-10 animate-pulse rounded bg-gray-200" />
					</div>
					<div className="min-w-0 lg:w-32">
						<div className="h-10 animate-pulse rounded bg-gray-200" />
					</div>
					<div className="min-w-0 lg:w-32">
						<div className="h-10 animate-pulse rounded bg-gray-200" />
					</div>
					<div className="min-w-0 lg:w-32">
						<div className="h-10 animate-pulse rounded bg-gray-200" />
					</div>
					<div className="min-w-0 lg:w-24">
						<div className="h-10 animate-pulse rounded bg-gray-200" />
					</div>
				</div>

				{/* Task Items Loading */}
				<div className="space-y-4">
					{["task-1", "task-2", "task-3"].map((id) => (
						<div
							key={id}
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
					))}
				</div>
			</div>
		</div>
	);
}
