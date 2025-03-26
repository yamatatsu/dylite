import Big from "big.js";
import type {
	AttributeType,
	AttributeValue,
	AttributeValueType,
	Item,
} from "./types";

export function itemSize(
	item: Item,
	compress = false,
	addMetaSize = false,
	rangeKey?: string,
): number {
	let rangeKeySize = 0;
	const size = Object.entries(item).reduce((sum, [key, val]) => {
		const attrSize = valSizeWithStorage(val, compress && key !== rangeKey);

		if (compress && key === rangeKey) {
			rangeKeySize = attrSize;
			return sum;
		}

		return sum + attrSize + (compress ? 1 : key.length);
	}, 0);

	if (!addMetaSize) {
		return size;
	}

	return 2 + size + (1 + Math.floor((1 + size) / 3072)) * (18 + rangeKeySize);
}

function valSizeWithStorage(
	itemAttr: AttributeValue,
	compress = false,
): number {
	const [type, val] = Object.entries(itemAttr)[0] as [
		AttributeType,
		AttributeValue,
	];
	const size = valSize(val, type, compress);
	if (!compress) return size;

	switch (type) {
		case "S":
			return size + (size < 128 ? 1 : size < 16384 ? 2 : 3);
		case "B":
			return size + 1;
		case "N":
			return size + 1;
		case "SS":
			return size + (val as string[]).length + 1;
		case "BS":
			return size + (val as string[]).length + 1;
		case "NS":
			return size + (val as string[]).length + 1;
		case "NULL":
			return 0;
		case "BOOL":
			return 1;
		case "L":
			return size;
		case "M":
			return size;
		default:
			return size;
	}
}

function valSize(
	val: AttributeValueType | undefined,
	type: AttributeType,
	compress = false,
): number {
	switch (type) {
		case "S":
			return (val as string).length;
		case "B":
			return Buffer.from(val as string, "base64").length;
		case "N": {
			const bigNum = new Big(val as string);
			const numDigits = bigNum.c.length;
			if (numDigits === 1 && bigNum.c[0] === 0) return 1;
			return (
				1 +
				Math.ceil(numDigits / 2) +
				(numDigits % 2 || bigNum.e % 2 ? 0 : 1) +
				(bigNum.s === -1 ? 1 : 0)
			);
		}
		case "SS":
			return (val as string[]).reduce((sum, x) => sum + valSize(x, "S"), 0);
		case "BS":
			return (val as string[]).reduce((sum, x) => sum + valSize(x, "B"), 0);
		case "NS":
			return (val as string[]).reduce((sum, x) => sum + valSize(x, "N"), 0);
		case "NULL":
			return 1;
		case "BOOL":
			return 1;
		case "L":
			return (
				3 +
				(val as AttributeValue[]).reduce(
					(sum, val) => sum + 1 + valSizeWithStorage(val, compress),
					0,
				)
			);
		case "M":
			return (
				3 +
				Object.keys(val as Record<string, AttributeValue>).length +
				itemSize(val as Item, compress)
			);
		default:
			return 0;
	}
}
