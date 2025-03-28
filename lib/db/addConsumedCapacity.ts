import { capacityUnits } from "./capacityUnits";
import type { Item, QueryResult } from "./types";

type Data = {
	TableName: string;
	ReturnConsumedCapacity?: string;
	ConsistentRead?: boolean;
};

export function addConsumedCapacity(
	data: Data,
	isRead: boolean,
	newItem: Item | null,
	oldItem: Item | null,
): QueryResult["ConsumedCapacity"] | undefined {
	if (!["TOTAL", "INDEXES"].includes(data.ReturnConsumedCapacity ?? ""))
		return undefined;

	let capacity = capacityUnits(newItem, isRead, data.ConsistentRead ?? false);
	if (oldItem != null) {
		capacity = Math.max(
			capacity,
			capacityUnits(oldItem, isRead, data.ConsistentRead ?? false),
		);
	}

	return {
		TableName: data.TableName,
		CapacityUnits: capacity,
		Table:
			data.ReturnConsumedCapacity === "INDEXES"
				? { CapacityUnits: capacity }
				: undefined,
	};
}
