import * as v from "valibot";
import { keyAttributeValueSchema } from "../../validations/attributeValueSchema";
import { tableNameSchema } from "../common-schema";

const provisionedThroughputSchema = v.object({
	ReadCapacityUnits: v.pipe(v.number(), v.minValue(1)),
	WriteCapacityUnits: v.pipe(v.number(), v.minValue(1)),
});

const keySchemaSchema = v.pipe(
	v.array(
		v.object({
			AttributeName: v.string(),
			KeyType: v.picklist(["HASH", "RANGE"]),
		}),
	),
	v.minLength(1),
	v.maxLength(2),
	v.check(
		([hash]) => hash.KeyType === "HASH",
		"Invalid KeySchema: The first KeySchemaElement is not a HASH key type",
	),
	v.check(
		([_, range]) => range.KeyType === "RANGE",
		"Invalid KeySchema: The second KeySchemaElement is not a RANGE key type",
	),
	v.check(
		([hash, range]) => hash.AttributeName !== range.AttributeName,
		"Both the Hash Key and the Range Key element in the KeySchema have the same name",
	),
);

const projectionSchema = v.pipe(
	v.object({
		ProjectionType: v.nonNullish(
			v.picklist(["ALL", "INCLUDE", "KEYS_ONLY"]),
			"One or more parameter values were invalid: Unknown ProjectionType: null",
		),
		NonKeyAttributes: v.nullish(v.pipe(v.array(v.string()), v.minLength(1))),
	}),
	v.check(
		(input) =>
			input.NonKeyAttributes == null || input.ProjectionType === "INCLUDE",
		(issue) =>
			`One or more parameter values were invalid: ProjectionType is ${issue.input.ProjectionType}, but NonKeyAttributes is specified`,
	),
);

export const schema = v.pipe(
	v.object({
		AttributeDefinitions: v.array(keyAttributeValueSchema),
		TableName: tableNameSchema,
		BillingMode: v.nullish(v.picklist(["PROVISIONED", "PAY_PER_REQUEST"])),
		ProvisionedThroughput: provisionedThroughputSchema,
		KeySchema: keySchemaSchema,
		LocalSecondaryIndexes: v.nullish(
			v.pipe(
				v.array(
					v.pipe(
						v.object({
							IndexName: tableNameSchema,
							KeySchema: keySchemaSchema,
							Projection: projectionSchema,
						}),
						v.check(
							(input) => input.KeySchema.length === 2,
							(issue) =>
								`One or more parameter values were invalid: Index KeySchema does not have a range key for index: ${issue.input.IndexName}`,
						),
					),
				),
				v.minLength(
					1,
					"One or more parameter values were invalid: List of LocalSecondaryIndexes is empty",
				),
				v.maxLength(
					5,
					"One or more parameter values were invalid: Number of LocalSecondaryIndexes exceeds per-table limit of 5",
				),
				v.rawCheck(({ dataset, addIssue }) => {
					if (!dataset.typed) return;
					const { value: input } = dataset;
					const indexNames = new Set<string>();
					for (const index of input) {
						const indexName = index.IndexName;
						if (indexNames.has(indexName)) {
							addIssue({
								message: `One or more parameter values were invalid: Duplicate index name: ${indexName}`,
							});
							return;
						}
						indexNames.add(indexName);
					}
				}),
			),
		),
		GlobalSecondaryIndexes: v.nullish(
			v.pipe(
				v.array(
					v.object({
						IndexName: tableNameSchema,
						KeySchema: keySchemaSchema,
						Projection: projectionSchema,
						ProvisionedThroughput: provisionedThroughputSchema,
					}),
				),
				v.minLength(
					1,
					"One or more parameter values were invalid: List of GlobalSecondaryIndexes is empty",
				),
				v.maxLength(
					20,
					"One or more parameter values were invalid: GlobalSecondaryIndex count exceeds the per-table limit of 20",
				),
				v.rawCheck(({ dataset, addIssue }) => {
					if (!dataset.typed) return;
					const { value: input } = dataset;
					const indexNames = new Set<string>();
					for (const index of input) {
						const indexName = index.IndexName;
						if (indexNames.has(indexName)) {
							addIssue({
								message: `One or more parameter values were invalid: Duplicate index name: ${indexName}`,
							});
							return;
						}
						indexNames.add(indexName);
					}
				}),
			),
		),
	}),

	v.check(
		(input) =>
			input.BillingMode === "PAY_PER_REQUEST" && !!input.ProvisionedThroughput,
		"One or more parameter values were invalid: Neither ReadCapacityUnits nor WriteCapacityUnits can be specified when BillingMode is PAY_PER_REQUEST",
	),
	v.check(
		(input) =>
			input.BillingMode !== "PAY_PER_REQUEST" &&
			(!input.ProvisionedThroughput ||
				!input.ProvisionedThroughput.ReadCapacityUnits ||
				!input.ProvisionedThroughput.WriteCapacityUnits),
		"One or more parameter values were invalid: ReadCapacityUnits and WriteCapacityUnits must both be specified when BillingMode is PROVISIONED",
	),
	v.check(
		(input) =>
			input.BillingMode !== "PAY_PER_REQUEST" &&
			input.ProvisionedThroughput.ReadCapacityUnits > 1000000000000,
		(issue) =>
			`Given value ${issue.input.ProvisionedThroughput.ReadCapacityUnits} for ReadCapacityUnits is out of bounds`,
	),
	v.check(
		(input) =>
			input.BillingMode !== "PAY_PER_REQUEST" &&
			input.ProvisionedThroughput.WriteCapacityUnits > 1000000000000,
		(issue) =>
			`Given value ${issue.input.ProvisionedThroughput.WriteCapacityUnits} for WriteCapacityUnits is out of bounds`,
	),
	v.check(
		(input) => input.KeySchema.length <= input.AttributeDefinitions.length,
		"Invalid KeySchema: Some index key attribute have no definition",
	),
	v.check(
		(input) =>
			input.KeySchema.every((key) =>
				input.AttributeDefinitions.some(
					(attr) => attr.AttributeName === key.AttributeName,
				),
			),
		(issue) => {
			const defNames = issue.input.AttributeDefinitions.map(
				(key) => key.AttributeName,
			).join(", ");
			const keyNames = issue.input.KeySchema.map(
				(key) => key.AttributeName,
			).join(", ");
			return `One or more parameter values were invalid: Some index key attributes are not defined in AttributeDefinitions. Keys: [${keyNames}], AttributeDefinitions: [${defNames}]`;
		},
	),
	v.check(
		(input) =>
			input.LocalSecondaryIndexes != null ||
			input.GlobalSecondaryIndexes != null ||
			input.KeySchema.length === input.AttributeDefinitions.length,
		"One or more parameter values were invalid: Number of attributes in KeySchema does not exactly match number of attributes defined in AttributeDefinitions",
	),
	v.check(
		(input) =>
			input.LocalSecondaryIndexes != null && input.KeySchema.length !== 2,
		"One or more parameter values were invalid: Table KeySchema does not have a range key, which is required when specifying a LocalSecondaryIndex",
	),
	v.rawCheck(({ dataset, addIssue }) => {
		if (!dataset.typed) return;
		const { value: input } = dataset;
		const defAttrNames = input.AttributeDefinitions.map(
			(key) => key.AttributeName,
		);
		const defAttrNameSet = new Set(defAttrNames);

		if (input.LocalSecondaryIndexes) {
			const tableHash = input.KeySchema[0].AttributeName;
			for (const index of input.LocalSecondaryIndexes) {
				const indexHash = index.KeySchema[0].AttributeName;
				if (indexHash !== tableHash) {
					addIssue({
						message: `One or more parameter values were invalid: Index KeySchema does not have the same leading hash key as table KeySchema for index: ${index.IndexName}. index hash key: ${indexHash}, table hash key: ${tableHash}`,
					});
					return;
				}
				if (
					index.KeySchema.some((key) => !defAttrNameSet.has(key.AttributeName))
				) {
					addIssue({
						message: `One or more parameter values were invalid: Some index key attributes are not defined in AttributeDefinitions. Keys: [${index.KeySchema.map((key) => key.AttributeName).join(", ")}], AttributeDefinitions: [${defAttrNames.join(", ")}]`,
					});
					return;
				}
			}
		}
		if (input.GlobalSecondaryIndexes) {
			for (const index of input.GlobalSecondaryIndexes) {
				if (
					index.KeySchema.some((key) => !defAttrNameSet.has(key.AttributeName))
				) {
					addIssue({
						message: `One or more parameter values were invalid: Some index key attributes are not defined in AttributeDefinitions. Keys: [${index.KeySchema.map((key) => key.AttributeName).join(", ")}], AttributeDefinitions: [${defAttrNames.join(", ")}]`,
					});
					return;
				}
				if (
					input.BillingMode === "PAY_PER_REQUEST" &&
					index.ProvisionedThroughput
				) {
					addIssue({
						message: `One or more parameter values were invalid: ProvisionedThroughput should not be specified for index: ${index.IndexName} when BillingMode is PAY_PER_REQUEST`,
					});
					return;
				}
			}
		}
	}),
);
