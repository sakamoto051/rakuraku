import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const getDatabaseUrl = () => {
	// E2Eテストモード時は専用データベースを使用
	if (env.E2E_TEST_MODE === "true" && env.DATABASE_URL_E2E) {
		console.log("Using E2E test database");
		return env.DATABASE_URL_E2E;
	}
	return env.DATABASE_URL;
};

const createPrismaClient = () =>
	new PrismaClient({
		log:
			env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
		datasources: {
			db: {
				url: getDatabaseUrl(),
			},
		},
	});

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
