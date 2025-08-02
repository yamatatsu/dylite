import * as v from "valibot";
import type { TableMap } from "../../db/TableMap";
import { tableNameSchema } from "../../domain/TableDescription";

const schema = v.object({
	TableName: tableNameSchema,
});

export async function execute(json: unknown, tableMap: TableMap) {
	const res = v.safeParse(schema, json, { abortEarly: true });
	if (!res.success) {
		throw new Error(res.issues[0].message);
	}

	const table = tableMap.getTable(res.output.TableName);

	return { Table: table?.description.toPlainObject() ?? null };
}
