import type { AttributeValue, KeyType } from "@aws-sdk/client-dynamodb";

export type { AttributeValue } from "@aws-sdk/client-dynamodb";

export namespace Plain {
	export type Item = Record<string, AttributeValue>;

	export interface KeySchemaElement {
		AttributeName: string;
		KeyType: KeyType;
	}
	export type KeySchema =
		| [KeySchemaElement]
		| [KeySchemaElement, KeySchemaElement];

	type ValueBase = {
		S: string;
		N: string;
		B: string;
		SS: string[];
		NS: string[];
		BS: string[];
		M: Record<string, Value>;
		L: Value[];
		NULL: boolean;
		BOOL: boolean;
	};
	type Require<T, K extends keyof T> = {
		[L in K]: T[L];
	} & {
		[L in Exclude<keyof T, K>]?: never;
	};

	export type SValue = Require<ValueBase, "S">;
	export type NValue = Require<ValueBase, "N">;
	export type BValue = Require<ValueBase, "B">;
	export type SSValue = Require<ValueBase, "SS">;
	export type NSValue = Require<ValueBase, "NS">;
	export type BSValue = Require<ValueBase, "BS">;
	export type MValue = Require<ValueBase, "M">;
	export type LValue = Require<ValueBase, "L">;
	export type NULLValue = Require<ValueBase, "NULL">;
	export type BOOLValue = Require<ValueBase, "BOOL">;

	export type Value =
		| BValue
		| BOOLValue
		| BSValue
		| LValue
		| MValue
		| NValue
		| NSValue
		| NULLValue
		| SValue
		| SSValue;
	export type KeyValue = BValue | NValue | SValue;

	export type ValueType = keyof ValueBase;
}
