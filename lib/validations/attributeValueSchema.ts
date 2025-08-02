import * as v from "valibot";
import type { PlainValue } from "../domain/Value";
import { unique } from "./util-validations";

export const attributeValueSchema: v.GenericSchema<PlainValue.Value> = v.lazy(
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
