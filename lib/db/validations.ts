import type { AttributeValueUpdate } from "@aws-sdk/client-dynamodb";
import { validationError } from "./errors";
import { traverseKey, traverseTableKey } from "./traverseKey";
import type {
	AttributeType,
	AttributeValue,
	Index,
	Item,
	KeySchema,
	TableDefinition,
} from "./types";

export function validateKey(
	dataKey: Record<string, AttributeValue>,
	def: TableDefinition,
	keySchema: KeySchema[] = def.KeySchema,
): Error | undefined {
	if (keySchema.length !== Object.keys(dataKey).length) {
		return validationError(
			"The provided key element does not match the schema",
		);
	}
	return traverseKey(
		def.AttributeDefinitions,
		keySchema,
		(attr, type, isHash) => validateKeyPiece(dataKey, attr, type, isHash),
	);
}

export function validateItem(
	dataItem: Item,
	def: TableDefinition,
): Error | undefined {
	return (
		traverseTableKey(def, (attr, type, isHash) => {
			if (dataItem[attr] == null) {
				return validationError(
					`One or more parameter values were invalid: Missing the key ${attr} in the item`,
				);
			}
			if (dataItem[attr][type] == null) {
				return validationError(
					`One or more parameter values were invalid: Type mismatch for key ${attr} expected: ${type} actual: ${Object.keys(dataItem[attr])[0]}`,
				);
			}
			if (dataItem[attr][type] === "" && (type === "S" || type === "B")) {
				return validationError(
					`One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty ${type === "S" ? "string" : "binary"} value. Key: ${attr}`,
				);
			}
			return checkKeySize(
				dataItem[attr][type] as string | Uint8Array,
				type,
				isHash,
			);
		}) ||
		traverseIndexes(def, (attr, type, index) => {
			if (dataItem[attr] != null && dataItem[attr][type] == null) {
				return validationError(
					`One or more parameter values were invalid: Type mismatch for Index Key ${attr} Expected: ${type} Actual: ${Object.keys(dataItem[attr])[0]} IndexName: ${index.IndexName}`,
				);
			}
		})
	);
}

export function validateAttributeUpdates(
	attributeUpdates: Record<string, AttributeValueUpdate>,
	def: TableDefinition,
): Error | undefined {
	return (
		traverseTableKey(def, (attr) => {
			if (attributeUpdates?.[attr] != null) {
				return validationError(
					`One or more parameter values were invalid: Cannot update attribute ${attr}. This attribute is part of the key`,
				);
			}
		}) ||
		traverseIndexes(def, (attr, type, index) => {
			const value = attributeUpdates?.[attr]?.Value;
			const actualType = value && Object.keys(value)[0];

			if (actualType == null) return; // valid
			if (actualType === type) return; // valid

			return validationError(
				`One or more parameter values were invalid: Type mismatch for Index Key ${attr} Expected: ${type} Actual: ${actualType} IndexName: ${index.IndexName}`,
			);
		})
	);
}

export function validateExpressionUpdates(
	expressionUpdates: {
		sections: Array<{ path: string[]; attrType: string }>;
		nestedPaths?: Record<string, boolean>;
	},
	def: TableDefinition,
): Error | undefined {
	const { sections, nestedPaths } = expressionUpdates;

	return (
		traverseTableKey(def, (attr) => {
			const hasKey = sections.some((section) => section.path[0] === attr);

			if (hasKey) {
				return validationError(
					`One or more parameter values were invalid: Cannot update attribute ${attr}. This attribute is part of the key`,
				);
			}
		}) ||
		traverseIndexes(def, (attr, type, index) => {
			const actualType = sections.find(
				(section) => section.path.length === 1 && section.path[0] === attr,
			)?.attrType;

			if (actualType != null && actualType !== type) {
				return validationError(
					`One or more parameter values were invalid: Type mismatch for Index Key ${attr} Expected: ${type} Actual: ${actualType} IndexName: ${index.IndexName}`,
				);
			}
		}) ||
		validateKeyPaths(nestedPaths, def)
	);
}

export function validateKeyPiece(
	key: Record<string, AttributeValue>,
	attr: string,
	type: AttributeType,
	isHash: boolean,
): Error | undefined {
	if (key[attr] == null || key[attr][type] == null) {
		return validationError(
			"The provided key element does not match the schema",
		);
	}
	if (key[attr][type] === "" && (type === "S" || type === "B")) {
		return validationError(
			`One or more parameter values were invalid: The AttributeValue for a key attribute cannot contain an empty ${type === "S" ? "string" : "binary"} value. Key: ${attr}`,
		);
	}
	return checkKeySize(key[attr][type] as string | Uint8Array, type, isHash);
}

export function validateKeyPaths(
	nestedPaths: Record<string, boolean> | undefined,
	def: TableDefinition,
): Error | undefined {
	if (!nestedPaths) return;
	return (
		traverseTableKey(def, (attr) => {
			if (nestedPaths[attr]) {
				return validationError(
					`Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: Key: ${attr}`,
				);
			}
		}) ||
		traverseIndexes(def, (attr) => {
			if (nestedPaths[attr]) {
				return validationError(
					`Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: IndexKey: ${attr}`,
				);
			}
		})
	);
}

export function traverseIndexes(
	def: TableDefinition,
	visitIndex: (
		attr: string,
		type: AttributeType,
		index: Index,
		isGlobal: boolean,
	) => Error | undefined,
): Error | undefined {
	if (def.GlobalSecondaryIndexes) {
		for (const index of def.GlobalSecondaryIndexes) {
			for (const { AttributeName: attr } of index.KeySchema) {
				const type = def.AttributeDefinitions.find(
					(def) => def.AttributeName === attr,
				)?.AttributeType;
				if (!type) continue;

				const found = visitIndex(attr, type, index, true);
				if (found) return found;
			}
		}
	}
	if (def.LocalSecondaryIndexes) {
		for (const index of def.LocalSecondaryIndexes) {
			for (const { AttributeName: attr } of index.KeySchema) {
				const type = def.AttributeDefinitions.find(
					(def) => def.AttributeName === attr,
				)?.AttributeType;
				if (!type) continue;

				const found = visitIndex(attr, type, index, false);
				if (found) return found;
			}
		}
	}
}

function checkKeySize(
	keyPiece: string | Uint8Array,
	type: AttributeType,
	isHash: boolean,
): Error | undefined {
	// Numbers are always fine
	if (type === "N") return;
	const length = getLength(keyPiece);
	if (isHash && length > 2048) {
		return validationError(
			"One or more parameter values were invalid: Size of hashkey has exceeded the maximum size limit of2048 bytes",
		);
	}
	if (!isHash && length > 1024) {
		return validationError(
			"One or more parameter values were invalid: Aggregated size of all range keys has exceeded the size limit of 1024 bytes",
		);
	}
}

function getLength(keyPiece: string | Uint8Array): number {
	if (typeof keyPiece === "string") {
		return Buffer.from(keyPiece, "utf-8").length;
	}
	return keyPiece.length;
}
