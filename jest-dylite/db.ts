// setimmediate polyfill must be imported first as `dynalite` depends on it
// import "setimmediate";
import { NodeServer } from "../bin/server";
import { getDynalitePort, getTables } from "./config";
import * as dynamodb from "./dynamodb/v3";

const instance = new NodeServer();

export const start = async (): Promise<void> => {
	// if (!dynaliteInstance.listening) {
	// 	await new Promise<void>((resolve) =>
	// 		dynaliteInstance.listen(process.env.MOCK_DYNAMODB_PORT, resolve),
	// 	);
	// }
	await instance.listen({ port: process.env.MOCK_DYNAMODB_PORT });
};

export const stop = async (): Promise<void> => {
	dynamodb.killConnection();

	// if (dynaliteInstance.listening) {
	// 	await new Promise<void>((resolve) =>
	// 		dynaliteInstance.close(() => resolve()),
	// 	);
	// }
	await instance.close();
};

export const deleteTables = async (): Promise<void> => {
	const tablesNames = (await getTables()).map((table) => table.TableName);
	await dynamodb.deleteTables(tablesNames, getDynalitePort());
};

export const createTables = async (): Promise<void> => {
	const tables = await getTables();
	await dynamodb.createTables(tables, getDynalitePort());
};
