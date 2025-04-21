import type { Store } from "../../db/types";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const { Limit = 100, ExclusiveStartTableName } = data;

	const names: string[] = [];
	let lastEvaluatedTableName: string | undefined;
	for await (const table of store.tableDb.keys({
		gt: ExclusiveStartTableName,
	})) {
		if (names.length === Limit) {
			lastEvaluatedTableName = names[names.length - 1];
			break;
		}
		names.push(table);
	}
	return {
		TableNames: names,
		LastEvaluatedTableName: lastEvaluatedTableName,
	};
}
