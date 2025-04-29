import path from "node:path";
import { fileURLToPath } from "node:url";

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	setupFilesAfterEnv: [
		path.resolve(__dirname, "./setupTables.ts"),
		path.resolve(__dirname, "./clearAfterEach.ts"),
	],
	testEnvironment: path.resolve(__dirname, "./environment.ts"),
};
