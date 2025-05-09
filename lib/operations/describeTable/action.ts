import type { Store } from "../../db/types";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const table = await store.getTable(data.TableName);
	return { Table: table };
}
