import type { TableMap } from "../../db/TableMap";
import { TableDescription } from "../../domain/TableDescription";

export async function execute(json: unknown, tableMap: TableMap) {
	const td = new TableDescription(json);
	tableMap.addTable(td);

	return {
		TableDescription: td.toPlainObject(),
	};
}
