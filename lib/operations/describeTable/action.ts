import type { Store } from "../../db/types";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const tableStore = store.tableStore;
	const table = await tableStore.get(data.TableName);
	return { Table: table };
}
