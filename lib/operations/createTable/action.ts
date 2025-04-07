import { randomUUID } from "node:crypto";
import type { Store } from "../../db/types";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const key = data.TableName;
	const tableDb = store.tableDb;

	return store.tableLock.acquire(key, async () => {
		const table = await tableDb.get(key);
		if (table) {
			// TODO: define errors and handling
			return {
				statusCode: 400,
				body: {
					__type: "com.amazonaws.dynamodb.v20120810#ResourceInUseException",
					message: "",
				},
			};
		}

		const _data = {
			...data,
			TableArn: `arn:aws:dynamodb:${store.awsRegion}:${store.awsAccountId}:table/${data.TableName}`,
			TableId: randomUUID(),
			CreationDateTime: Date.now() / 1000,
			ItemCount: 0,
			ProvisionedThroughput: data.ProvisionedThroughput
				? {
						...data.ProvisionedThroughput,
						NumberOfDecreasesToday: 0,
					}
				: {
						ReadCapacityUnits: 0,
						WriteCapacityUnits: 0,
						NumberOfDecreasesToday: 0,
					},
			TableSizeBytes: 0,
			TableStatus: "CREATING",
			BillingModeSummary: { BillingMode: "PAY_PER_REQUEST" },
			TableThroughputModeSummary: {
				TableThroughputMode: "PAY_PER_REQUEST",
			},
			...(data.BillingMode === "PAY_PER_REQUEST"
				? {
						BillingModeSummary: { BillingMode: "PAY_PER_REQUEST" },
						TableThroughputModeSummary: {
							TableThroughputMode: "PAY_PER_REQUEST",
						},
						BillingMode: undefined,
					}
				: {}),
			LocalSecondaryIndexes: data.LocalSecondaryIndexes?.map((index) => ({
				...index,
				IndexArn: `arn:aws:dynamodb:${store.awsRegion}:${store.awsAccountId}:table/${data.TableName}/index/${index.IndexName}`,
				IndexSizeBytes: 0,
				ItemCount: 0,
			})),
			GlobalSecondaryIndexes: data.GlobalSecondaryIndexes?.map((index) => ({
				...index,
				IndexArn: `arn:aws:dynamodb:${store.awsRegion}:${store.awsAccountId}:table/${data.TableName}/index/${index.IndexName}`,
				IndexSizeBytes: 0,
				ItemCount: 0,
				IndexStatus: "CREATING",
				ProvisionedThroughput: index.ProvisionedThroughput
					? {
							...index.ProvisionedThroughput,
							NumberOfDecreasesToday: 0,
						}
					: {
							ReadCapacityUnits: 0,
							WriteCapacityUnits: 0,
							NumberOfDecreasesToday: 0,
						},
			})),
		};

		await tableDb.put(key, _data);

		return { TableDescription: _data };
	});
}
