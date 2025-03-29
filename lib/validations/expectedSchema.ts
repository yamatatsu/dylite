import * as v from "valibot";
import { compare } from "../db/compare";
import { attributeValueSchema } from "./attributeValueSchema";

export const expectedSchema = v.nullish(
	v.record(
		v.string(),
		v.object({
			Value: v.nullish(attributeValueSchema),
			Exists: v.nullish(v.boolean()),
			ComparisonOperator: v.nullish(
				v.picklist([
					"BEGINS_WITH",
					"BETWEEN",
					"CONTAINS",
					"EQ",
					"GE",
					"GT",
					"IN",
					"LE",
					"LT",
					"NE",
					"NOT_CONTAINS",
					"NOT_NULL",
					"NULL",
				]),
			),
			AttributeValueList: v.nullish(v.array(attributeValueSchema)),
		}),
	),
);

export type Expected = v.InferOutput<typeof expectedSchema>;

export function validateAttributeConditions(data: { Expected?: Expected }) {
	for (const key in data.Expected) {
		const condition = data.Expected[key];

		if ("AttributeValueList" in condition && "Value" in condition)
			return `One or more parameter values were invalid: Value and AttributeValueList cannot be used together for Attribute: ${key}`;

		if ("ComparisonOperator" in condition) {
			if ("Exists" in condition)
				return `One or more parameter values were invalid: Exists and ComparisonOperator cannot be used together for Attribute: ${key}`;

			if (
				condition.ComparisonOperator !== "NULL" &&
				condition.ComparisonOperator !== "NOT_NULL" &&
				!("AttributeValueList" in condition) &&
				!("Value" in condition)
			)
				return `One or more parameter values were invalid: Value or AttributeValueList must be used with ComparisonOperator: ${condition.ComparisonOperator} for Attribute: ${key}`;

			const values = condition.AttributeValueList
				? condition.AttributeValueList.length
				: condition.Value
					? 1
					: 0;
			let validAttrCount = false;

			switch (condition.ComparisonOperator) {
				case "EQ":
				case "NE":
				case "LE":
				case "LT":
				case "GE":
				case "GT":
				case "CONTAINS":
				case "NOT_CONTAINS":
				case "BEGINS_WITH":
					if (values === 1) validAttrCount = true;
					break;
				case "NOT_NULL":
				case "NULL":
					if (values === 0) validAttrCount = true;
					break;
				case "IN":
					if (values > 0) validAttrCount = true;
					break;
				case "BETWEEN":
					if (values === 2) validAttrCount = true;
					break;
			}
			if (!validAttrCount)
				return `One or more parameter values were invalid: Invalid number of argument(s) for the ${condition.ComparisonOperator} ComparisonOperator`;

			if (condition.AttributeValueList?.length) {
				const type = Object.keys(condition.AttributeValueList[0])[0];
				if (
					condition.AttributeValueList.some(
						(attr) => Object.keys(attr)[0] !== type,
					)
				) {
					return "One or more parameter values were invalid: AttributeValues inside AttributeValueList must be of same type";
				}
				if (
					condition.ComparisonOperator === "BETWEEN" &&
					compare(
						"GT",
						// @ts-expect-error: will refactor with rich attribute type
						condition.AttributeValueList[0],
						condition.AttributeValueList[1],
					)
				) {
					return "The BETWEEN condition was provided a range where the lower bound is greater than the upper bound";
				}
			}
		} else if ("AttributeValueList" in condition) {
			return `One or more parameter values were invalid: AttributeValueList can only be used with a ComparisonOperator for Attribute: ${key}`;
		} else {
			const exists = condition.Exists == null || condition.Exists;
			if (exists && condition.Value == null)
				return `One or more parameter values were invalid: Value must be provided when Exists is ${condition.Exists == null ? "null" : condition.Exists} for Attribute: ${key}`;
			if (!exists && condition.Value != null)
				return `One or more parameter values were invalid: Value cannot be used when Exists is false for Attribute: ${key}`;
			if (condition.Value != null) {
				const result = v.safeParse(attributeValueSchema, condition.Value);
				if (!result.success) return result.issues[0].message;
			}
		}
	}
}
