import { hashPrefix } from "./hashPrefix";
import { toRangeStr } from "./toRangeStr";
import { traverseKey } from "./traverseKey";
import type { AttributeDefinition, Item, KeySchema, Table } from "./types";

export function createTableKey(item: Item, table: Table): string {
	return createKey(item, table.AttributeDefinitions, table.KeySchema);
}

export function createKey(
	item: Item,
	attributeDefinitions: AttributeDefinition[],
	keySchema: KeySchema[],
): string {
	let keyStr = "";
	traverseKey(
		attributeDefinitions,
		keySchema,
		(attr, type, isHash): undefined => {
			const val = item[attr][type];
			if (val == null) return;

			if (isHash) {
				keyStr = `${hashPrefix(val, type)}/`;
			}
			keyStr += `${toRangeStr(val as string, type)}/`;
		},
	);
	return keyStr;
}
