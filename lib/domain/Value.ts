import crypto from "node:crypto";
import { Big } from "big.js";

export namespace PlainValue {
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

export type ValueType = PlainValue.ValueType;

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

export interface IKeyValue {
	hashStr(): string;
	sortableStr(): string;
}

export function isKeyValue(value: Value): value is KeyValue {
	return value.type === "S" || value.type === "N" || value.type === "B";
}

export function plainToValue(value: PlainValue.Value): Value {
	if (value.S !== undefined) return new SValue(value);
	if (value.N !== undefined) return new NValue(value);
	if (value.B !== undefined) return new BValue(value);
	if (value.SS !== undefined) return new SSValue(value);
	if (value.NS !== undefined) return new NSValue(value);
	if (value.BS !== undefined) return new BSValue(value);
	if (value.M !== undefined) return new MValue(value);
	if (value.L !== undefined) return new LValue(value);
	if (value.NULL !== undefined) return new NULLValue(value);
	if (value.BOOL !== undefined) return new BOOLValue(value);
	throw new Error("Unknown value type");
}

export interface IValue {
	type: ValueType;
	value:
		| string
		| Big
		| Buffer
		| string[]
		| Big[]
		| Buffer[]
		| Record<string, Value>
		| Value[]
		| null
		| boolean;
	eq(other: Value): boolean;
	ne(other: Value): boolean;
	lt(other: Value): boolean;
	gt(other: Value): boolean;
	le(other: Value): boolean;
	ge(other: Value): boolean;

	toPlain(): PlainValue.Value;
}
export abstract class ValueBase implements IValue {
	public abstract type: ValueType;
	public abstract value:
		| string
		| Big
		| Buffer
		| string[]
		| Big[]
		| Buffer[]
		| Record<string, Value>
		| Value[]
		| null
		| boolean;
	public abstract eq(other: Value): boolean;
	public ne(other: Value): boolean {
		return !this.eq(other);
	}
	public lt(other: Value): boolean {
		if (this.type !== other.type) return false;
		return this._lt(other as unknown as typeof this);
	}
	public gt(other: Value): boolean {
		if (this.type !== other.type) return false;
		return this._gt(other as unknown as typeof this);
	}
	public ge(other: Value): boolean {
		if (this.type !== other.type) return false;
		return !this._lt(other as unknown as typeof this);
	}
	public le(other: Value): boolean {
		if (this.type !== other.type) return false;
		return !this._gt(other as unknown as typeof this);
	}

	protected abstract _lt(other: typeof this): boolean;
	protected abstract _gt(other: typeof this): boolean;

	abstract toPlain(): PlainValue.Value;
}

export class SValue extends ValueBase implements IKeyValue {
	public readonly type = "S" as const;
	public readonly value: string;
	constructor(value: PlainValue.SValue) {
		super();
		this.value = value.S;
	}

	eq(other: Value): boolean {
		if (this.type !== other.type) return false;
		return this.value === other.value;
	}

	hashStr(): string {
		return toHex(Buffer.from(this.value, "utf8"));
	}
	sortableStr(): string {
		return Buffer.from(this.value, "utf8").toString("hex");
	}

	toPlain(): PlainValue.Value {
		return { S: this.value };
	}

	protected _lt(other: typeof this): boolean {
		return this.value < other.value;
	}
	protected _gt(other: typeof this): boolean {
		return this.value > other.value;
	}
}
export class NValue extends ValueBase implements IKeyValue {
	public readonly type = "N" as const;
	public readonly value: Big;
	constructor(value: PlainValue.NValue) {
		super();
		this.value = new Big(value.N);
	}

	// TODO: refactor
	hashStr(): string {
		const num = this.value;

		if (+num === 0) return toHex(Buffer.from([-128]));

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

		return toHex(Buffer.from(byteArray));
	}

	sortableStr(): string {
		const bigNum = this.value;
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

	toPlain(): PlainValue.Value {
		return { N: this.value.toString() };
	}

	eq(other: Value): boolean {
		if (this.type !== other.type) return false;
		return this.value.eq(other.value);
	}

	protected _lt(other: typeof this): boolean {
		return this.value.lt(other.value);
	}
	protected _gt(other: typeof this): boolean {
		return this.value.gt(other.value);
	}
}
export class BValue extends ValueBase implements IKeyValue {
	public readonly type = "B" as const;
	public readonly value: Buffer;
	constructor(value: PlainValue.BValue) {
		super();
		this.value = Buffer.from(value.B, "base64");
	}

	hashStr(): string {
		return toHex(this.value);
	}

	sortableStr(): string {
		return this.value.toString("hex");
	}

	toPlain(): PlainValue.Value {
		return { B: this.value.toString("base64") };
	}

	eq(other: Value): boolean {
		return (
			this.type === other.type &&
			this.value.toString() === other.value.toString()
		);
	}

	protected _lt(other: typeof this): boolean {
		return Buffer.compare(this.value, other.value) < 0;
	}
	protected _gt(other: typeof this): boolean {
		return Buffer.compare(this.value, other.value) > 0;
	}
}
export class SSValue extends ValueBase {
	public readonly type = "SS" as const;
	public readonly value: string[];
	constructor(value: PlainValue.SSValue) {
		super();
		this.value = value.SS;
	}

	toPlain(): PlainValue.Value {
		return { SS: this.value };
	}

	eq(other: Value): boolean {
		return (
			this.type === other.type &&
			this.value.toString() === other.value.toString()
		);
	}

	protected _lt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
	protected _gt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
}
export class NSValue extends ValueBase {
	public readonly type = "NS" as const;
	public readonly value: Big[];
	constructor(value: PlainValue.NSValue) {
		super();
		this.value = value.NS.map((n) => new Big(n));
	}

	toPlain(): PlainValue.Value {
		return { NS: this.value.map((n) => n.toString()) };
	}

	eq(other: Value): boolean {
		return (
			this.type === other.type &&
			this.value.length === other.value.length &&
			this.value.every((v, i) => v.eq(other.value[i]))
		);
	}

	protected _lt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
	protected _gt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
}
export class BSValue extends ValueBase {
	public readonly type = "BS" as const;
	public readonly value: Buffer[];
	constructor(value: PlainValue.BSValue) {
		super();
		this.value = value.BS.map((b) => Buffer.from(b, "base64"));
	}

	toPlain(): PlainValue.Value {
		return { BS: this.value.map((b) => b.toString("base64")) };
	}

	eq(other: Value): boolean {
		return (
			this.type === other.type &&
			this.value.length === other.value.length &&
			this.value.every((v, i) => v.toString() === other.value[i].toString())
		);
	}

	protected _lt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
	protected _gt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
}
export class MValue extends ValueBase {
	public readonly type = "M" as const;
	public readonly value: Record<string, Value>;
	constructor(value: PlainValue.MValue) {
		super();
		this.value = {};
		for (const key in value.M) {
			this.value[key] = plainToValue(value.M[key]);
		}
	}

	toPlain(): PlainValue.Value {
		const plainValue: Record<string, PlainValue.Value> = {};
		for (const key in this.value) {
			plainValue[key] = this.value[key].toPlain();
		}
		return { M: plainValue };
	}

	eq(other: Value): boolean {
		if (this.type !== other.type) return false;
		for (const key in this.value) {
			if (!this.value[key].eq(other.value[key])) {
				return false;
			}
		}
		return true;
	}

	protected _lt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
	protected _gt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
}
export class LValue extends ValueBase {
	public readonly type = "L" as const;
	public readonly value: Value[];
	constructor(value: PlainValue.LValue) {
		super();
		this.value = value.L.map(plainToValue);
	}

	toPlain(): PlainValue.Value {
		return { L: this.value.map((v) => v.toPlain()) };
	}

	eq(other: Value): boolean {
		return (
			this.type === other.type &&
			this.value.length === other.value.length &&
			this.value.every((v, i) => v.eq(other.value[i]))
		);
	}

	protected _lt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
	protected _gt(other: typeof this): boolean {
		throw new Error(`Cannot compare collections of type ${this.type}`);
	}
}
export class NULLValue extends ValueBase {
	public readonly type = "NULL" as const;
	public readonly value: null;
	constructor(value: PlainValue.NULLValue) {
		super();
		this.value = null;
	}

	toPlain(): PlainValue.Value {
		return { NULL: true };
	}

	eq(other: Value): boolean {
		return this.type === other.type;
	}

	protected _lt(other: typeof this): boolean {
		throw new Error("Cannot compare NULL values");
	}
	protected _gt(other: typeof this): boolean {
		throw new Error("Cannot compare NULL values");
	}
}
export class BOOLValue extends ValueBase {
	public readonly type = "BOOL" as const;
	public readonly value: boolean;
	constructor(value: PlainValue.BOOLValue) {
		super();
		this.value = value.BOOL;
	}

	toPlain(): PlainValue.Value {
		return { BOOL: this.value };
	}

	eq(other: Value): boolean {
		if (this.type !== other.type) return false;
		return this.value === other.value;
	}

	protected _lt(other: typeof this): boolean {
		return this.value < other.value;
	}
	protected _gt(other: typeof this): boolean {
		return this.value > other.value;
	}
}

function toHex(buffer: Buffer): string {
	return crypto
		.createHash("md5")
		.update("Outliers")
		.update(buffer)
		.digest("hex")
		.slice(0, 6);
}
