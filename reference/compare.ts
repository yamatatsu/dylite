import { Big } from "big.js";
import { toLexiStr } from "./toLexiStr";
import type { AttributeType, AttributeValue } from "./types";

type AttrVal = string | boolean | string[];
type Attr = Record<string, AttrVal>;

export function compare(comp: string, val: Attr, compVals: Attr[]): boolean {
	const attrType = val ? Object.keys(val)[0] : null;
	const attrVal = attrType ? val[attrType] : null;
	const compType = compVals[0] ? Object.keys(compVals[0])[0] : null;
	const compVal = compType ? compVals[0][compType] : null;

	switch (comp) {
		case "EQ":
		case "=":
			if (compType !== attrType || !valsEqual(attrVal, compVal)) return false;
			break;
		case "NE":
		case "<>":
			if (compType === attrType && valsEqual(attrVal, compVal)) return false;
			break;
		case "LE":
		case "<=":
			if (
				compType !== attrType ||
				(attrType === "N" &&
					!new Big(attrVal as string).lte(compVal as string)) ||
				(attrType !== "N" &&
					toLexiStr(attrVal as string, attrType as AttributeType) >
						toLexiStr(compVal as string, attrType as AttributeType))
			)
				return false;
			break;
		case "LT":
		case "<":
			if (
				compType !== attrType ||
				(attrType === "N" &&
					!new Big(attrVal as string).lt(compVal as string)) ||
				(attrType !== "N" &&
					toLexiStr(attrVal as string, attrType as AttributeType) >=
						toLexiStr(compVal as string, attrType as AttributeType))
			)
				return false;
			break;
		case "GE":
		case ">=":
			if (
				compType !== attrType ||
				(attrType === "N" &&
					!new Big(attrVal as string).gte(compVal as string)) ||
				(attrType !== "N" &&
					toLexiStr(attrVal as string, attrType as AttributeType) <
						toLexiStr(compVal as string, attrType as AttributeType))
			)
				return false;
			break;
		case "GT":
		case ">":
			if (
				compType !== attrType ||
				(attrType === "N" &&
					!new Big(attrVal as string).gt(compVal as string)) ||
				(attrType !== "N" &&
					toLexiStr(attrVal as string, attrType as AttributeType) <=
						toLexiStr(compVal as string, attrType as AttributeType))
			)
				return false;
			break;
		case "NOT_NULL":
		case "attribute_exists":
			if (attrVal == null) return false;
			break;
		case "NULL":
		case "attribute_not_exists":
			if (attrVal != null) return false;
			break;
		case "CONTAINS":
		case "contains":
			return contains(compType, compVal, attrType, attrVal);
		case "NOT_CONTAINS":
			return !contains(compType, compVal, attrType, attrVal);
		case "BEGINS_WITH":
		case "begins_with":
			if (compType !== attrType) return false;
			if (compType === "B") {
				const attrValString = Buffer.from(
					attrVal as string,
					"base64",
				).toString();
				const compValString = Buffer.from(
					compVal as string,
					"base64",
				).toString();
				if (attrValString.indexOf(compValString) !== 0) return false;
			}
			if ((attrVal as string).indexOf(compVal as string) !== 0) return false;
			break;
		case "IN":
		case "in":
			if (!attrVal) return false;
			if (
				!compVals.some((compVal) => {
					const compType = Object.keys(compVal)[0];
					const compValValue = compVal[compType as keyof AttributeValue];
					return compType === attrType && valsEqual(attrVal, compValValue);
				})
			)
				return false;
			break;
		case "BETWEEN":
		case "between":
			if (
				!attrVal ||
				compType !== attrType ||
				(attrType === "N" &&
					(!new Big(attrVal as string).gte(compVal as string) ||
						!new Big(attrVal as string).lte(compVals[1].N as string))) ||
				(attrType !== "N" &&
					(toLexiStr(attrVal as string, attrType as AttributeType) <
						toLexiStr(compVal as string, attrType as AttributeType) ||
						toLexiStr(attrVal as string, attrType as AttributeType) >
							toLexiStr(
								compVals[1][compType as keyof AttributeValue] as string,
								attrType as AttributeType,
							)))
			)
				return false;
			break;
		case "attribute_type":
			if (!attrVal || !valsEqual(attrType, compVal)) return false;
	}
	return true;
}

function contains(
	compType: string | null,
	compVal: AttrVal | null,
	attrType: string | null,
	attrVal: AttrVal | null,
): boolean {
	if (compType === "S") {
		if (attrType === "S")
			return (attrVal as string).includes(compVal as string);
		if (attrType === "SS")
			return (attrVal as string[]).some((val) => val === compVal);
		if (attrType === "L")
			return (attrVal as AttributeValue[]).some((val) => val?.S === compVal);
		return false;
	}
	if (compType === "N") {
		if (attrType === "NS")
			return (attrVal as string[]).some((val) => val === compVal);
		if (attrType === "L")
			return (attrVal as AttributeValue[]).some((val) => val?.N === compVal);
		return false;
	}
	if (compType === "B") {
		if (attrType !== "B" && attrType !== "BS" && attrType !== "L") return false;
		const compValString = Buffer.from(compVal as string, "base64").toString();
		if (attrType === "B") {
			const attrValString = Buffer.from(attrVal as string, "base64").toString();
			return attrValString.includes(compValString);
		}
		return (attrVal as string[]).some((val) => {
			if (attrType !== "L")
				return compValString === Buffer.from(val, "base64").toString();
			if (attrType === "L" && (val as AttributeValue).B)
				return (
					compValString ===
					Buffer.from((val as AttributeValue).B as string, "base64").toString()
				);
			return false;
		});
	}
	return false;
}

function valsEqual(val1: AttrVal | null, val2: AttrVal | null): boolean {
	if (!(Array.isArray(val1) && Array.isArray(val2))) {
		return val1 === val2;
	}
	if (val1.length !== val2.length) {
		return false;
	}
	return val1.every((val) => val2.includes(val));
}
