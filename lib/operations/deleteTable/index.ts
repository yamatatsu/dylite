import * as v from "valibot";
import type { TableMap } from "../../db/TableMap";
import { tableNameSchema } from "../../domain/TableDescription";
import { validationException } from "../../domain/errors";

const schema = v.object({
	TableName: tableNameSchema,
});

export async function execute(json: unknown, tableMap: TableMap) {
	const res = v.safeParse(schema, json, { abortEarly: true });
	if (!res.success) {
		throw validationException(res.issues[0].message);
	}

	const table = await tableMap.deleteTable(res.output.TableName);

	return {
		TableDescription: table.description.toPlainObject(),
	};
}
