import crypto from "node:crypto";
import Big from "big.js";
import { createIndexKey } from "./createIndexKey";
import { hashPrefix } from "./hashPrefix";
import { traverseTableKey } from "./traverseKey";
import type {
	AttributeType,
	AttributeValue,
	AttributeValueType,
	ExpressionFilter,
	Filter,
	Index,
	IndexAction,
	IndexActions,
	Item,
	KeySchema,
	Lazy,
	QueryDataWithIndex,
	QueryDataWithoutIndex,
	QueryResult,
	Store,
	StoreOptions,
	SubDB,
	TableDefinition,
} from "./types";

export { createStore, MAX_SIZE } from "./createStore";

// export function checkConditional(
// 	data: { _condition?: { expression: ExpressionFilter }; Expected?: Filter },
// 	existingItem: Item = {},
// ): Error | null {
// 	if (data._condition) {
// 		if (!matchesExprFilter(existingItem, data._condition.expression)) {
// 			return conditionalError();
// 		}
// 		return null;
// 	}
// 	if (!data.Expected) {
// 		return null;
// 	}
// 	if (!matchesFilter(existingItem, data.Expected, data.ConditionalOperator)) {
// 		return conditionalError();
// 	}
// 	return null;
// }

// 	return {
// 		CapacityUnits: capacity,
// 		TableName: data.TableName,
// 		Table:
// 			data.ReturnConsumedCapacity === "INDEXES"
// 				? { CapacityUnits: capacity }
// 				: undefined,
// 	};
// }

// export function matchesFilter(
// 	val: Item,
// 	filter: Filter,
// 	conditionalOperator?: string,
// ): boolean {
// 	for (const attr in filter) {
// 		const comp =
// 			filter[attr].Exists != null
// 				? filter[attr].Exists
// 					? "NOT_NULL"
// 					: "NULL"
// 				: filter[attr].ComparisonOperator || "EQ";
// 		const result = compare(
// 			comp,
// 			val[attr],
// 			filter[attr].AttributeValueList || filter[attr].Value || [],
// 		);
// 		if (!result) {
// 			return false;
// 		}
// 		if (conditionalOperator === "OR") {
// 			return true;
// 		}
// 	}
// 	return true;
// }

// export function matchesExprFilter(item: Item, expr: ExpressionFilter): boolean {
// 	if (expr.type === "and") {
// 		return (
// 			matchesExprFilter(item, expr.args[0] as ExpressionFilter) &&
// 			matchesExprFilter(item, expr.args[1] as ExpressionFilter)
// 		);
// 	}
// 	if (expr.type === "or") {
// 		return (
// 			matchesExprFilter(item, expr.args[0] as ExpressionFilter) ||
// 			matchesExprFilter(item, expr.args[1] as ExpressionFilter)
// 		);
// 	}
// 	if (expr.type === "not") {
// 		return !matchesExprFilter(item, expr.args[0] as ExpressionFilter);
// 	}
// 	const args = expr.args.map((arg) => resolveArg(arg, item));
// 	return compare(
// 		expr.type === "function" && expr.name ? expr.name : expr.type,
// 		args[0] || { NULL: true },
// 		args.slice(1).filter((arg): arg is AttributeValue => arg !== null),
// 	);
// }

// function resolveArg(
// 	arg: ExpressionFilter | string[],
// 	item: Item,
// ): AttributeValue | null {
// 	if (Array.isArray(arg)) {
// 		return mapPath(arg, item);
// 	}
// 	if (arg.type === "function" && arg.name === "size") {
// 		const args = arg.args.map((arg) => resolveArg(arg, item));
// 		const val = args[0];
// 		let length: number | undefined;

// 		if (!val) {
// 			return null;
// 		}
// 		if (val.S) {
// 			length = val.S.length;
// 		}
// 		if (val.B) {
// 			length = Buffer.from(val.B, "base64").length;
// 		}
// 		if (val.SS || val.BS || val.NS || val.L) {
// 			length = (val.SS || val.BS || val.NS || val.L)?.length;
// 		}
// 		if (val.M) {
// 			length = Object.keys(val.M).length;
// 		}

// 		return length != null ? { N: length.toString() } : null;
// 	}
// 	return arg as AttributeValue;
// }

// export function mapPaths(paths: string[][], item: Item): Item {
// 	const returnItem: Item = {};
// 	const toSquash: { L: AttributeValue[] }[] = [];

// 	for (let i = 0; i < paths.length; i++) {
// 		let path = paths[i];
// 		if (!Array.isArray(path)) path = [path];
// 		const resolved = mapPath(path, item);
// 		if (resolved == null) {
// 			continue;
// 		}
// 		if (path.length === 1) {
// 			returnItem[path[0]] = resolved;
// 			continue;
// 		}
// 		let curItem: { M: Item; L?: AttributeValue[] } = { M: returnItem };
// 		for (let j = 0; j < path.length; j++) {
// 			const piece = path[j];
// 			if (typeof piece === "number") {
// 				curItem.L = curItem.L || [];
// 				if (
// 					piece > curItem.L.length &&
// 					!toSquash.includes(curItem as { L: AttributeValue[] })
// 				) {
// 					toSquash.push(curItem as { L: AttributeValue[] });
// 				}
// 				if (j < path.length - 1) {
// 					curItem.L[piece] = curItem.L[piece] || { M: {} };
// 					curItem = curItem.L[piece];
// 				} else {
// 					curItem.L[piece] = resolved;
// 				}
// 			} else {
// 				curItem.M = curItem.M || {};
// 				if (j < path.length - 1) {
// 					curItem.M[piece] = curItem.M[piece] || { M: {} };
// 					curItem = curItem.M[piece];
// 				} else {
// 					curItem.M[piece] = resolved;
// 				}
// 			}
// 		}
// 	}

// 	for (const obj of toSquash) {
// 		obj.L = obj.L.filter(Boolean);
// 	}

// 	return returnItem;
// }

// export function mapPath(path: string[], item: Item): AttributeValue | null {
// 	if (path.length === 1) {
// 		return item[path[0]];
// 	}
// 	let resolved: { M: Item; L?: AttributeValue[] } = { M: item };
// 	for (let i = 0; i < path.length; i++) {
// 		const piece = path[i];
// 		if (typeof piece === "number" && resolved.L) {
// 			resolved = resolved.L[piece];
// 		} else if (resolved.M) {
// 			resolved = resolved.M[piece];
// 		} else {
// 			resolved = null;
// 		}
// 		if (resolved == null) {
// 			break;
// 		}
// 	}
// 	return resolved;
// }

// export async function queryTableFromItemDb(
// 	store: Store,
// 	table: Table,
// 	data: QueryDataWithoutIndex,
// 	opts: AbstractIteratorOptions<string, Item>,
// 	startKeyNames: string[],
// ): Promise<QueryResult> {
// 	const itemDb = store.getItemDb(data.TableName);

// 	let tableCapacity = 0;
// 	const calculateCapacity = ["TOTAL", "INDEXES"].includes(
// 		data.ReturnConsumedCapacity || "",
// 	);
// 	let size = 0;
// 	let count = 0;
// 	const rangeKey = table.KeySchema[1]?.AttributeName;

// 	let items: Item[] = [];

// 	// fetch items until limit or total item size is reached
// 	const iterator = itemDb.iterator<string, Item>;
// 	for await (const [key, item] of iterator(opts)) {
// 		if (
// 			count >= (data.Limit || Number.POSITIVE_INFINITY) ||
// 			size >= 1024 * 1024
// 		) {
// 			break;
// 		}

// 		if (calculateCapacity) {
// 			tableCapacity += itemSize(item);
// 		}

// 		count++;
// 		size += itemSize(item, true, true, rangeKey);
// 		items.push(item);
// 	}

// 	const lastItem = items[items.length - 1];
// 	const queryFilter = data.QueryFilter || data.ScanFilter;

// 	if (data._filter) {
// 		items = items.filter((val) =>
// 			matchesExprFilter(val, data._filter as ExpressionFilter),
// 		);
// 	} else if (queryFilter) {
// 		items = items.filter((val) =>
// 			matchesFilter(val, queryFilter, data.ConditionalOperator),
// 		);
// 	}

// 	const result: QueryResult = { Count: items.length, ScannedCount: count };
// 	if (
// 		count >= (data.Limit || Number.POSITIVE_INFINITY) ||
// 		size >= 1024 * 1024
// 	) {
// 		if (data.Limit) items.splice(data.Limit);
// 		if (lastItem) {
// 			result.LastEvaluatedKey = startKeyNames.reduce(
// 				(key, attr) => {
// 					key[attr] = lastItem[attr];
// 					return key;
// 				},
// 				{} as Record<string, AttributeValue>,
// 			);
// 		}
// 	}

// 	const paths =
// 		data._projection?.paths ?? data.AttributesToGet?.map((attr) => [attr]);
// 	if (paths) {
// 		items = items.map((item) => mapPaths(paths, item));
// 	}

// 	if (data.Select !== "COUNT") result.Items = items;
// 	if (calculateCapacity) {
// 		const tableUnits =
// 			Math.ceil(tableCapacity / 1024 / 4) * (data.ConsistentRead ? 1 : 0.5);
// 		const indexUnits = 0;
// 		result.ConsumedCapacity = {
// 			CapacityUnits: tableUnits + indexUnits,
// 			TableName: data.TableName,
// 		};
// 		if (data.ReturnConsumedCapacity === "INDEXES") {
// 			result.ConsumedCapacity.Table = { CapacityUnits: tableUnits };
// 		}
// 	}
// 	return result;
// }

// export async function queryTableFromIndexDb(
// 	store: Store,
// 	table: Table,
// 	data: QueryDataWithIndex,
// 	opts: AbstractIteratorOptions<string, Item>,
// 	isLocal: boolean,
// 	fetchFromItemDb: boolean,
// 	startKeyNames: string[],
// ): Promise<QueryResult> {
// 	const itemDb = store.getItemDb(data.TableName);
// 	const indexDb = store.getIndexDb(
// 		isLocal ? "local" : "global",
// 		data.TableName,
// 		data.IndexName,
// 	);

// 	let tableCapacity = 0;
// 	let indexCapacity = 0;
// 	const calculateCapacity = ["TOTAL", "INDEXES"].includes(
// 		data.ReturnConsumedCapacity || "",
// 	);

// 	let size = 0;
// 	let count = 0;
// 	const rangeKey = table.KeySchema[1]?.AttributeName;

// 	let items: Item[] = [];

// 	const iterator = indexDb.iterator<string, Item>;
// 	for await (const [key, item] of iterator(opts)) {
// 		let _item: Item | undefined = item;

// 		if (fetchFromItemDb) {
// 			if (calculateCapacity) indexCapacity += itemSize(item);

// 			_item = await itemDb.get(createKey(item, table));
// 			if (calculateCapacity) tableCapacity += itemSize(item);
// 		}

// 		if (!_item) {
// 			throw new Error("Index Error: Item not found");
// 		}

// 		if (
// 			count >= (data.Limit || Number.POSITIVE_INFINITY) ||
// 			size >= 1024 * 1024
// 		) {
// 			break;
// 		}

// 		if (calculateCapacity && !fetchFromItemDb) {
// 			indexCapacity += itemSize(_item);
// 		}

// 		count++;
// 		size += itemSize(_item, true, true, rangeKey);
// 		items.push(_item);
// 	}

// 	const lastItem = items[items.length - 1];
// 	const queryFilter = data.QueryFilter || data.ScanFilter;

// 	if (data._filter) {
// 		items = items.filter((val) =>
// 			matchesExprFilter(val, data._filter as ExpressionFilter),
// 		);
// 	} else if (queryFilter) {
// 		items = items.filter((val) =>
// 			matchesFilter(val, queryFilter, data.ConditionalOperator),
// 		);
// 	}

// 	const result: QueryResult = { Count: items.length, ScannedCount: count };
// 	if (
// 		count >= (data.Limit || Number.POSITIVE_INFINITY) ||
// 		size >= 1024 * 1024
// 	) {
// 		if (data.Limit) items.splice(data.Limit);
// 		if (lastItem) {
// 			result.LastEvaluatedKey = startKeyNames.reduce(
// 				(key, attr) => {
// 					key[attr] = lastItem[attr];
// 					return key;
// 				},
// 				{} as Record<string, AttributeValue>,
// 			);
// 		}
// 	}

// 	const paths =
// 		data._projection?.paths ?? data.AttributesToGet?.map((attr) => [attr]);
// 	if (paths) {
// 		items = items.map((item) => mapPaths(paths, item));
// 	}

// 	if (data.Select !== "COUNT") result.Items = items;
// 	if (calculateCapacity) {
// 		const tableUnits =
// 			Math.ceil(tableCapacity / 1024 / 4) * (data.ConsistentRead ? 1 : 0.5);
// 		const indexUnits =
// 			Math.ceil(indexCapacity / 1024 / 4) * (data.ConsistentRead ? 1 : 0.5);
// 		result.ConsumedCapacity = {
// 			CapacityUnits: tableUnits + indexUnits,
// 			TableName: data.TableName,
// 		};
// 		if (data.ReturnConsumedCapacity === "INDEXES") {
// 			result.ConsumedCapacity.Table = { CapacityUnits: tableUnits };
// 			const indexAttr = isLocal
// 				? "LocalSecondaryIndexes"
// 				: "GlobalSecondaryIndexes";
// 			result.ConsumedCapacity[indexAttr] = {
// 				[data.IndexName]: { CapacityUnits: indexUnits },
// 			};
// 		}
// 	}
// 	return result;
// }
