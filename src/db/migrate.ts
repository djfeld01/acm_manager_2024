import { migrate } from "drizzle-orm/postgres-js/migrator";
import config from "../../drizzle.config";
import { db, connection } from "@/db";
console.log(config.out);
await migrate(db, { migrationsFolder: config.out! });

await connection.end();
