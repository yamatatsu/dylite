import crypto from "node:crypto";
import Big from "big.js";
import type { AttributeValueType } from "./types";

export function hashPrefix(
	hashKey: AttributeValueType,
	hashType: string,
	rangeKey?: AttributeValueType,
	rangeType?: string,
): string {
	let hashBuffer: Buffer;
	let rangeBuffer: Buffer;

	if (hashType === "S") {
		hashBuffer = Buffer.from(hashKey as string, "utf8");
	} else if (hashType === "N") {
		hashBuffer = numToBuffer(hashKey as string);
	} else if (hashType === "B") {
		hashBuffer = Buffer.from(hashKey as string, "base64");
	} else {
		throw new Error(`Invalid hash type: ${hashType}`);
	}

	if (rangeKey) {
		if (rangeType === "S") {
			rangeBuffer = Buffer.from(rangeKey as string, "utf8");
		} else if (rangeType === "N") {
			rangeBuffer = numToBuffer(rangeKey as string);
		} else if (rangeType === "B") {
			rangeBuffer = Buffer.from(rangeKey as string, "base64");
		} else {
			throw new Error(`Invalid range type: ${rangeType}`);
		}
	} else {
		rangeBuffer = Buffer.from([]);
	}

	return crypto
		.createHash("md5")
		.update("Outliers")
		.update(hashBuffer)
		.update(rangeBuffer)
		.digest("hex")
		.slice(0, 6);
}

function numToBuffer(num: string): Buffer {
	if (+num === 0) return Buffer.from([-128]);

	const bigNum = new Big(num);
	const scale = bigNum.s;
	const mantissa = bigNum.c;
	const exponent = bigNum.e + 1;
	const appendZero = exponent % 2 ? 1 : 0;
	const byteArrayLengthWithoutExponent = Math.floor(
		(mantissa.length + appendZero + 1) / 2,
	);
	let byteArray: number[];
	let appendedZero = false;

	if (byteArrayLengthWithoutExponent < 20 && scale === -1) {
		byteArray = new Array(byteArrayLengthWithoutExponent + 2);
		byteArray[byteArrayLengthWithoutExponent + 1] = 102;
	} else {
		byteArray = new Array(byteArrayLengthWithoutExponent + 1);
	}

	byteArray[0] = Math.floor((exponent + appendZero) / 2) - 64;
	if (scale === -1) {
		byteArray[0] ^= 0xffffffff;
	}

	for (
		let mantissaIndex = 0;
		mantissaIndex < mantissa.length;
		mantissaIndex++
	) {
		const byteArrayIndex = Math.floor((mantissaIndex + appendZero) / 2) + 1;
		if (appendZero && !mantissaIndex && !appendedZero) {
			byteArray[byteArrayIndex] = 0;
			appendedZero = true;
			mantissaIndex--;
		} else if ((mantissaIndex + appendZero) % 2 === 0) {
			byteArray[byteArrayIndex] = mantissa[mantissaIndex] * 10;
		} else {
			byteArray[byteArrayIndex] += mantissa[mantissaIndex];
		}
		if (
			(mantissaIndex + appendZero) % 2 ||
			mantissaIndex === mantissa.length - 1
		) {
			if (scale === -1) {
				byteArray[byteArrayIndex] = 101 - byteArray[byteArrayIndex];
			} else {
				byteArray[byteArrayIndex]++;
			}
		}
	}

	return Buffer.from(byteArray);
}
