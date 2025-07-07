import type { Store } from "../../db/types";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const { Limit = 100, ExclusiveStartTableName = "" } = data;
	const tableStore = store.tableStore;

	const [names, lastEvaluatedTableName] = await tableStore.tableNames({
		exclusiveStartTableName: ExclusiveStartTableName,
		limit: Limit,
	});

	return {
		TableNames: names,
		LastEvaluatedTableName: lastEvaluatedTableName,
	};
}
