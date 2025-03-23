import { createKey } from "./createKey";
import { hashPrefix } from "./hashPrefix";
import { traverseTableKey } from "./traverseKey";
import type {
	AttributeType,
	AttributeValueType,
	Item,
	KeySchema,
	Table,
} from "./types";

export function createIndexKey(
	item: Item,
	table: Table,
	keySchema: KeySchema[],
): string {
	const tableKeyPieces: [AttributeValueType, AttributeType][] = [];
	traverseTableKey(table, (attr, type): undefined => {
		tableKeyPieces.push([item[attr][type] as AttributeValueType, type]);
	});
	return (
		createKey(item, table.AttributeDefinitions, keySchema) +
		hashPrefix(...tableKeyPieces[0], ...tableKeyPieces[1])
	);
}
