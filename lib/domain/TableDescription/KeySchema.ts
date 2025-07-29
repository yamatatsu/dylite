import * as v from "valibot";
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

type KeySchemaElement = { valueType: AttributeType; name: string };
type KeySchemaType =
	| {
			type: "simple";
			partitionKey: KeySchemaElement;
	  }
	| {
			type: "composite";
			partitionKey: KeySchemaElement;
			sortKey: KeySchemaElement;
	  };

export class KeySchema {
	private readonly type: KeySchemaType;

	constructor(input: unknown, attributeDefinitions: AttributeDefinitions) {
		const parsed = v.safeParse(keySchemaSchema, input);
		if (!parsed.success) {
			throw validationException(parsed.issues[0].message);
		}
		const [hash, range] = parsed.output;

		if (!range) {
			this.type = {
				type: "simple",
				partitionKey: {
					valueType: attributeDefinitions.getType(hash.AttributeName),
					name: hash.AttributeName,
				},
			};
		} else {
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
			this.type = {
				type: "composite",
				partitionKey: {
					valueType: attributeDefinitions.getType(hash.AttributeName),
					name: hash.AttributeName,
				},
				sortKey: {
					valueType: attributeDefinitions.getType(range.AttributeName),
					name: range.AttributeName,
				},
			};
		}
	}
}
