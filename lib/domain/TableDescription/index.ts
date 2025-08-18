import * as v from "valibot";
import { Item, type PlainItem } from "../Item";
import { AttributeDefinitions } from "./AttributeDefinitions";
import { type IKeySchema, createKeySchema } from "./KeySchema";

export const tableNameSchema = v.pipe(
	v.string(),
	v.regex(/^[a-zA-Z0-9_.-]+$/),
	v.minLength(3),
	v.maxLength(255),
);
const tableDescriptionSchema = v.object({
	TableName: tableNameSchema,
	AttributeDefinitions: v.nonNullish(v.unknown()),
	KeySchema: v.nonNullish(v.unknown()),
});

export type PlainTableDescription = v.InferOutput<
	typeof tableDescriptionSchema
>;

export class TableDescription {
	public readonly tableName: string;
	public readonly creationDateTime: number = Date.now() / 1000;
	private readonly attributeDefinitions: AttributeDefinitions;
	private readonly keySchema: IKeySchema;

	constructor(input: unknown) {
		const result = v.parse(tableDescriptionSchema, input, { abortEarly: true });
		this.tableName = result.TableName;
		this.attributeDefinitions = new AttributeDefinitions(
			result.AttributeDefinitions,
		);
		this.keySchema = createKeySchema(
			result.KeySchema,
			this.attributeDefinitions,
		);
	}

	/**
	 * Generate a string representation of the key for the given item.
	 * This is used for internal storage and lookup operations.
	 * @param item - The item containing key attributes
	 * @returns A string representation of the key
	 */
	getKeyStr(item: Item): string {
		return this.keySchema.getKeyStr(item);
	}

	/**
	 * Extract only the key attributes from the given item.
	 * This is useful for operations like pagination where only key attributes are needed.
	 * @param item - The item to extract key attributes from
	 * @returns A new Item containing only the key attributes
	 */
	getKeyAttributes(item: Item): Item {
		const keyNames = this.getKeyAttributeNames();
		const keyAttributes: PlainItem = {};
		for (const keyName of keyNames) {
			const value = item.get(keyName);
			if (value) {
				keyAttributes[keyName] = value.toPlain();
			}
		}
		return new Item(keyAttributes);
	}

	toPlainObject() {
		return {
			TableName: this.tableName,
			AttributeDefinitions: this.attributeDefinitions.toPlainObject(),
			KeySchema: this.keySchema.toPlainObject(),
			DeletionProtectionEnabled: false,
			ItemCount: 0,
			BillingModeSummary: {
				BillingMode: "PAY_PER_REQUEST",
				LastUpdateToPayPerRequestDateTime: this.creationDateTime,
			},
			ProvisionedThroughput: {
				LastDecreaseDateTime: new Date(0).getTime(),
				LastIncreaseDateTime: new Date(0).getTime(),
				ReadCapacityUnits: 0,
				WriteCapacityUnits: 0,
				NumberOfDecreasesToday: 0,
			},
			CreationDateTime: this.creationDateTime,
			TableArn: `arn:aws:dynamodb:ddblocal:000000000000:table/${this.tableName}`,
			TableSizeBytes: 0,
			TableStatus: "ACTIVE",
			TableThroughputModeSummary: {
				TableThroughputMode: "PAY_PER_REQUEST",
			},
		};
	}

	/**
	 * Get the names of all key attributes (hash key and range key if present).
	 * @returns Array of key attribute names
	 */
	private getKeyAttributeNames(): string[] {
		const plainSchema = this.keySchema.toPlainObject();
		return plainSchema.map((element) => element.AttributeName);
	}
}
