import * as v from "valibot";
import type { Item } from "../Item";
import { isKeyValue } from "../Value";
import { validationException } from "../errors";
import type {
	AttributeDefinitions,
	AttributeType,
} from "./AttributeDefinitions";

const keySchemaSchema = v.union([
	v.pipe(
		v.tuple([
			v.object({
				AttributeName: v.string(),
				KeyType: v.picklist(["HASH", "RANGE"]),
			}),
			v.object({
				AttributeName: v.string(),
				KeyType: v.picklist(["HASH", "RANGE"]),
			}),
		]),
	),
	v.pipe(
		v.tuple([
			v.object({
				AttributeName: v.string(),
				KeyType: v.picklist(["HASH", "RANGE"]),
			}),
		]),
	),
]);

type Plain = v.InferOutput<typeof keySchemaSchema>;

type KeySchemaElement = { valueType: AttributeType; name: string };

export interface IKeySchema {
	getKeyStr(item: Item): string;
	toPlainObject(): Plain;
}

export function createKeySchema(
	input: unknown,
	attributeDefinitions: AttributeDefinitions,
) {
	const parsed = v.safeParse(keySchemaSchema, input, { abortEarly: true });
	if (!parsed.success) {
		throw validationException(parsed.issues[0].message);
	}
	const [hash, range] = parsed.output;

	if (!range) {
		return new SimpleKeySchema(hash, attributeDefinitions);
	}

	return new CompositeKeySchema(hash, range, attributeDefinitions);
}

class SimpleKeySchema implements IKeySchema {
	private readonly partitionKey: KeySchemaElement;

	constructor(hash: Plain[number], attributeDefinitions: AttributeDefinitions) {
		this.partitionKey = {
			valueType: attributeDefinitions.getType(hash.AttributeName),
			name: hash.AttributeName,
		};
	}

	getKeyStr(item: Item): string {
		const pkValue = item.get(this.partitionKey.name);
		if (!pkValue) {
			throw validationException(
				"One of the required keys was not given a value",
			);
		}
		if (!isKeyValue(pkValue)) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not a valid key value`,
			);
		}
		if (pkValue.type !== this.partitionKey.valueType) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not of type ${this.partitionKey.valueType}`,
			);
		}

		return `${pkValue.hashStr()}/`;
	}

	toPlainObject(): Plain {
		return [{ KeyType: "HASH", AttributeName: this.partitionKey.name }];
	}
}

class CompositeKeySchema implements IKeySchema {
	private readonly partitionKey: KeySchemaElement;
	private readonly sortKey: KeySchemaElement;

	constructor(
		hash: Plain[number],
		range: Plain[number],
		attributeDefinitions: AttributeDefinitions,
	) {
		if (hash.KeyType === "RANGE" && range.KeyType === "HASH") {
			throw validationException(
				"Invalid key order. Hash Key must be specified first in key schema, Range Key must be specifed second",
			);
		}
		if (hash.KeyType === "HASH" && range.KeyType === "HASH") {
			throw validationException(
				"Too many hash keys specified.  All Dynamo DB tables must have exactly one hash key",
			);
		}
		if (hash.KeyType === "RANGE" && range.KeyType === "RANGE") {
			throw validationException(
				"No Hash Key specified in schema.  All Dynamo DB tables must have exactly one hash key",
			);
		}
		this.partitionKey = {
			valueType: attributeDefinitions.getType(hash.AttributeName),
			name: hash.AttributeName,
		};
		this.sortKey = {
			valueType: attributeDefinitions.getType(range.AttributeName),
			name: range.AttributeName,
		};
	}

	getKeyStr(item: Item): string {
		const pkValue = item.get(this.partitionKey.name);
		if (!pkValue) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is missing`,
			);
		}
		if (!isKeyValue(pkValue)) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not a valid key value`,
			);
		}
		if (pkValue.type !== this.partitionKey.valueType) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not of type ${this.partitionKey.valueType}`,
			);
		}

		const skValue = item.get(this.partitionKey.name);
		if (!skValue) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is missing`,
			);
		}
		if (!isKeyValue(skValue)) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not a valid key value`,
			);
		}
		if (skValue.type !== this.partitionKey.valueType) {
			throw validationException(
				// TODO: fix message
				`Partition key value for ${this.partitionKey.name} is not of type ${this.partitionKey.valueType}`,
			);
		}

		return `${pkValue.hashStr()}/${skValue.sortableStr()}/`;
	}

	toPlainObject(): Plain {
		return [
			{ KeyType: "HASH", AttributeName: this.partitionKey.name },
			{ KeyType: "RANGE", AttributeName: this.sortKey.name },
		];
	}
}
