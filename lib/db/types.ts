import type { ConditionalOperator } from "@aws-sdk/client-dynamodb";
import type { AbstractLevel, AbstractSublevel } from "abstract-level";
import type AsyncLock from "async-lock";

export type Format = string | Buffer | Uint8Array;
export type DB = AbstractLevel<Format, string, string>;
export type SubDB<Value = unknown> = AbstractSublevel<
	DB,
	Format,
	string,
	Value
>;

export interface Table {
	TableName: string;
	KeySchema: KeySchema[];
	AttributeDefinitions: AttributeDefinition[];
	TableStatus?: "ACTIVE" | "CREATING" | "DELETING" | "UPDATING";
	GlobalSecondaryIndexes?: Index[];
	LocalSecondaryIndexes?: Index[];
}

export interface KeySchema {
	AttributeName: string;
	KeyType: "HASH" | "RANGE";
}

export type AttributeType =
	| "S"
	| "N"
	| "B"
	| "SS"
	| "NS"
	| "BS"
	| "M"
	| "L"
	| "BOOL"
	| "NULL";
export interface AttributeDefinition {
	AttributeName: string;
	AttributeType: AttributeType;
}

export interface Index {
	IndexName: string;
	KeySchema: KeySchema[];
	Projection: {
		ProjectionType: "ALL" | "INCLUDE" | "KEYS_ONLY";
		NonKeyAttributes?: string[] | null;
	};
}

export interface AttributeValue {
	S?: string;
	N?: string;
	B?: string;
	SS?: string[];
	NS?: string[];
	BS?: string[];
	M?: Record<string, AttributeValue>;
	L?: AttributeValue[];
	NULL?: boolean;
	BOOL?: boolean;
	Value?: AttributeValue;
}

export type AttributeValueType =
	| string
	| number
	| boolean
	| string[]
	| AttributeValue
	| Record<string, AttributeValue>
	| AttributeValue[];

export type Item = {
	[key: string]: AttributeValue;
};

export interface QueryDataWithoutIndex {
	TableName: string;
	AttributesToGet?: string[];
	Limit?: number;
	Select?: "ALL" | "COUNT";
	ScanFilter?: Filter;
	ConditionalOperator?: ConditionalOperator;
	ReturnConsumedCapacity?: "TOTAL" | "INDEXES" | "NONE";
	ConsistentRead?: boolean;
	QueryFilter?: Filter;
	_filter?: ExpressionFilter;
	_projection?: {
		paths: string[][];
	};
}

export interface QueryDataWithIndex extends QueryDataWithoutIndex {
	IndexName: string;
}

export interface Filter {
	ConditionalOperator?: "AND" | "OR";
	Expected?: Filter;
	_condition?: {
		expression: ExpressionFilter;
	};
	[key: string]:
		| {
				AttributeValueList?: AttributeValue[];
				ComparisonOperator?: string;
				Value?: AttributeValue;
				Exists?: boolean;
		  }
		| Filter
		| { expression: ExpressionFilter }
		| "AND"
		| "OR"
		| undefined;
}

export interface ExpressionFilter {
	type: "and" | "or" | "not" | "function" | string;
	name?: string;
	args: (string[] | ExpressionFilter | AttributeValue)[];
}

export interface Store {
	awsAccountId: string;
	awsRegion: string;
	options: StoreOptions;
	db: DB;
	tableDb: SubDB<Table>;
	tableLock: AsyncLock;
	getItemDb: (name: string) => SubDB<Item>;
	deleteItemDb: (name: string) => Promise<void>;
	getIndexDb: (
		indexType: string,
		tableName: string,
		indexName: string,
	) => SubDB<Item>;
	deleteIndexDb: (
		indexType: string,
		tableName: string,
		indexName: string,
	) => Promise<void>;
	getTagDb: (name: string) => SubDB<Item>;
	deleteTagDb: (name: string) => Promise<void>;
	getTable: (name: string, checkStatus?: boolean) => Promise<Table | null>;
}

export type StoreOptionsInput = Partial<StoreOptions>;
export type StoreOptions = {
	path: string | null;
	createTableMs: number;
	deleteTableMs: number;
	updateTableMs: number;
	maxItemSizeKb: number;
	maxItemSize: number;
};

export interface QueryResult {
	Count: number;
	ScannedCount: number;
	Items?: Item[];
	LastEvaluatedKey?: Record<string, AttributeValue>;
	ConsumedCapacity?: {
		CapacityUnits: number;
		TableName: string;
		Table?: {
			CapacityUnits: number;
		};
		GlobalSecondaryIndexes?: {
			[key: string]: {
				CapacityUnits: number;
			};
		};
		LocalSecondaryIndexes?: {
			[key: string]: {
				CapacityUnits: number;
			};
		};
	};
}

export interface IndexAction {
	index: string;
	key: string;
	item?: Item | null;
}

export interface IndexActions {
	puts: IndexAction[];
	deletes: IndexAction[];
}

export interface Lazy<T = Item> {
	takeWhile(fn: (item: T) => boolean): Lazy<T>;
	map<U>(fn: (item: T) => U): Lazy<U>;
	join(separator?: string): string;
	once(): Promise<T>;
	pipe(stream: NodeJS.WritableStream): void;
	on(event: string, listener: (item: T) => void): void;
	emit(event: string, item: T): void;
}
