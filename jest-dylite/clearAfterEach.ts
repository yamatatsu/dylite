import { createTables, deleteTables } from "./db";

afterEach(async () => {
	await deleteTables();
	await createTables();
});
