"use client";

import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	ClipboardDocumentListIcon,
	HomeIcon,
	UserCircleIcon,
} from "@heroicons/react/24/outline";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
	{
		name: "ホーム",
		href: "/",
		icon: HomeIcon,
	},
	{
		name: "タスク管理",
		href: "/tasks",
		icon: ClipboardDocumentListIcon,
	},
];

export function MainNavigation() {
	const pathname = usePathname();
	const { data: session } = useSession();

	return (
		<nav className="bg-white shadow">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex">
						{/* Logo */}
						<div className="flex flex-shrink-0 items-center">
							<Link href="/" className="font-bold text-blue-600 text-xl">
								Rakuraku
							</Link>
						</div>

						{/* Navigation Links */}
						<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
							{navigationItems.map((item) => {
								const isActive = pathname === item.href;
								return (
									<Link
										key={item.name}
										href={item.href}
										className={`inline-flex items-center border-b-2 px-1 pt-1 font-medium text-sm ${
											isActive
												? "border-blue-500 text-gray-900"
												: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
										}`}
									>
										<item.icon className="mr-2 h-4 w-4" />
										{item.name}
									</Link>
								);
							})}
						</div>
					</div>

					{/* User menu */}
					<div className="flex items-center">
						{session?.user ? (
							<div className="flex items-center space-x-4">
								<span className="text-gray-700 text-sm">
									{session.user.name ?? session.user.email}
								</span>
								<button
									type="button"
									onClick={() => signOut()}
									className="inline-flex items-center rounded-md bg-white px-3 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
								>
									<ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
									サインアウト
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => signIn()}
								className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 font-medium text-sm text-white hover:bg-blue-700"
							>
								<ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
								サインイン
							</button>
						)}
					</div>
				</div>

				{/* Mobile navigation */}
				<div className="sm:hidden">
					<div className="space-y-1 pt-2 pb-3">
						{navigationItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={`block py-2 pr-4 pl-3 font-medium text-base ${
										isActive
											? "border-blue-500 border-l-4 bg-blue-50 text-blue-700"
											: "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
									}`}
								>
									<div className="flex items-center">
										<item.icon className="mr-3 h-5 w-5" />
										{item.name}
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</nav>
	);
}
