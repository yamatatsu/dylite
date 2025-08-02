import type { TableMap } from "../../db/TableMap";

export async function execute(json: unknown, tableMap: TableMap) {
	const names = tableMap.listTableNames();

	return {
		TableNames: names,
	};
}
