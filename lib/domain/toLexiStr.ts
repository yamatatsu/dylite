import Big from "big.js";
import type { Value, ValueType } from "./types";

export function toLexiStrFromAttributeValue(attrValue: Value): string {
	const type = Object.keys(attrValue)[0] as ValueType;
	const keyPiece = attrValue[type] as string;
	return toLexiStr(keyPiece, type);
}
export function toLexiStr(
	val: string | number | string[] | undefined,
	type: ValueType,
): string {
	if (val == null) return "";

	if (type === "B") return Buffer.from(val as string, "base64").toString("hex");
	if (type !== "N") return val as string;

	const bigNum = new Big(val as string);
	let digits: string;
	const exp = !bigNum.c[0]
		? 0
		: bigNum.s === -1
			? 125 - bigNum.e
			: 130 + bigNum.e;

	if (bigNum.s === -1) {
		bigNum.e = 0;
		digits = new Big(10).plus(bigNum).toFixed().replace(/\./, "");
	} else {
		digits = bigNum.c.join("");
	}

	return `${bigNum.s === -1 ? "0" : "1"}${(`0${exp.toString(16)}`).slice(-2)}${digits}`;
}
