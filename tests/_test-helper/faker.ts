import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import { v7 as uuid } from "uuid";

export namespace Faker {
	export const s = (prefix = "test"): AttributeValue.SMember => ({
		S: `${prefix}-${uuid()}`,
	});
	export const n = (n?: number): AttributeValue.NMember => ({
		N: (n ?? Math.random()).toString(),
	});
	export const b = (): AttributeValue.BMember => ({ B: toUint8Array(uuid()) });
	export const ss = (length = 2): AttributeValue.SSMember => ({
		SS: Array.from({ length }, () => uuid()),
	});
	export const ns = (length = 2): AttributeValue.NSMember => ({
		NS: Array.from({ length }, () => Math.random().toString()),
	});
	export const bs = (length = 2): AttributeValue.BSMember => ({
		BS: Array.from({ length }, () => toUint8Array(uuid())),
	});
	export const m = (
		obj: Record<string, AttributeValue>,
	): AttributeValue.MMember => ({ M: obj });
	export const l = (arr: AttributeValue[]): AttributeValue.LMember => ({
		L: arr,
	});
	export const bool = (value: boolean): AttributeValue.BOOLMember => ({
		BOOL: value,
	});
	export const nullValue = (): AttributeValue.NULLMember => ({
		NULL: true,
	});
}

function toUint8Array(str: string): Uint8Array {
	return Uint8Array.from(Buffer.from(str));
}
