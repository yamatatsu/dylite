import * as v from "valibot";
import { unique } from "./util-validations";

export type AttributeValueKey =
	| "S"
	| "N"
	| "B"
	| "SS"
	| "NS"
	| "BS"
	| "M"
	| "L"
	| "NULL"
	| "BOOL";

export type AttributeValue =
	| BMember
	| BOOLMember
	| BSMember
	| LMember
	| MMember
	| NMember
	| NSMember
	| NULLMember
	| SMember
	| SSMember;
export type KeyAttributeValue = BMember | NMember | SMember;
type SMember = { S: string };
type NMember = { N: string };
type BMember = { B: string };
type SSMember = { SS: string[] };
type NSMember = { NS: string[] };
type BSMember = { BS: string[] };
type MMember = { M: Record<string, AttributeValue> };
type LMember = { L: AttributeValue[] };
type NULLMember = { NULL: boolean };
type BOOLMember = { BOOL: boolean };

export const attributeValueSchema: v.GenericSchema<AttributeValue> = v.lazy(
	() =>
		v.union([
			sMemberSchema,
			nMemberSchema,
			bMemberSchema,
			ssMemberSchema,
			nsMemberSchema,
			bsMemberSchema,
			mMemberSchema,
			lMemberSchema,
			nullMemberSchema,
			boolMemberSchema,
		]),
);
export const keyAttributeValueSchema = v.object({
	AttributeName: v.string(),
	AttributeType: v.picklist(["S", "N", "B"]),
});

const sMemberSchema = v.object({ S: v.string() });
const nMemberSchema = v.object({ N: v.string() });
const bMemberSchema = v.object({ B: v.string() });
const ssMemberSchema = v.object({
	SS: v.pipe(v.array(v.string()), v.minLength(1), unique),
});
const nsMemberSchema = v.object({
	NS: v.pipe(v.array(v.string()), v.minLength(1), unique),
});
const bsMemberSchema = v.object({
	BS: v.pipe(v.array(v.string()), v.minLength(1), unique),
});
const mMemberSchema = v.object({
	M: v.record(v.string(), attributeValueSchema),
});
const lMemberSchema = v.object({ L: v.array(attributeValueSchema) });
const nullMemberSchema = v.object({ NULL: v.boolean() });
const boolMemberSchema = v.object({ BOOL: v.boolean() });
