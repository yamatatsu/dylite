import { createKey } from "./createKey";
import { hashPrefix } from "./hashPrefix";
import { traverseTableKey } from "./traverseKey";
import type {
	AttributeType,
	AttributeValueType,
	Item,
	KeySchema,
	TableDefinition,
} from "./types";

export function createIndexKey(
	item: Item,
	def: TableDefinition,
	keySchema: KeySchema[],
): string {
	const tableKeyPieces: [AttributeValueType, AttributeType][] = [];
	traverseTableKey(def, (attr, type): undefined => {
		tableKeyPieces.push([item[attr][type] as AttributeValueType, type]);
	});
	return (
		createKey(item, def.AttributeDefinitions, keySchema) +
		hashPrefix(...tableKeyPieces[0], ...tableKeyPieces[1])
	);
}
