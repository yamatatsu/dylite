import { toLexiStr } from "./toLexiStr";
import type { AttributeValue, AttributeValueType } from "./types";
import type { AttributeType } from "./types";

export function toRangeStrFromAttributeValue(
	attrValue: AttributeValue,
): string {
	const type = Object.keys(attrValue)[0] as AttributeType;
	const keyPiece = attrValue[type] as string;
	return toRangeStr(keyPiece, type);
}

export function toRangeStr(
	keyPiece: string | number | string[] | undefined,
	type: AttributeType,
): string {
	if (type === "S") {
		return Buffer.from(keyPiece as string, "utf8").toString("hex");
	}

	return toLexiStr(keyPiece, type);
}
