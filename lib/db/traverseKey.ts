import type {
	AttributeDefinition,
	AttributeType,
	KeySchema,
	Table,
} from "./types";

type VisitKey = (
	attr: string,
	type: AttributeType,
	isHash: boolean,
) => Error | undefined;

export function traverseTableKey(
	table: Table,
	visitKey: VisitKey,
): Error | undefined {
	return traverseKey(table.AttributeDefinitions, table.KeySchema, visitKey);
}

export function traverseKey(
	definitions: AttributeDefinition[],
	keySchemas: KeySchema[],
	visitKey: VisitKey,
): Error | undefined {
	const [hashKey, rangeKey] = keySchemas;

	const hashAttr = hashKey?.AttributeName;
	const hashType = getType(definitions, hashAttr);
	if (hashType) {
		const found = visitKey(hashAttr, hashType, true);
		if (found) return found;
	}

	const rangeAttr = rangeKey?.AttributeName;
	const rangeType = getType(definitions, rangeAttr);
	if (rangeType) {
		const found = visitKey(rangeAttr, rangeType, false);
		if (found) return found;
	}
}

function getType(
	definitions: AttributeDefinition[],
	attr: string,
): AttributeType | undefined {
	return definitions.find((def) => def.AttributeName === attr)?.AttributeType;
}
