import type { Context } from "./context";
import isReserved from "./isReserved";

export type PathSegment =
	| IdentifierPathSegment
	| ArrayIndexPathSegment
	| AliasPathSegment;

interface IPathSegment {
	type: string;
	isArrayIndex: boolean;
	value(): string | number;
	toString(): string;
}

export class IdentifierPathSegment implements IPathSegment {
	public readonly type = "Identifier" as const;
	public readonly isArrayIndex = false;
	constructor(
		private readonly name: string,
		private readonly context: Context,
	) {}

	isReserved(): boolean {
		return isReserved(this.name);
	}

	value(): string {
		return this.name;
	}

	toString(): string {
		return this.name;
	}
}
export class ArrayIndexPathSegment implements IPathSegment {
	public readonly type = "ArrayIndex" as const;
	public readonly isArrayIndex = true;
	constructor(
		private readonly index: number,
		private readonly context: Context,
	) {}

	value(): number {
		return this.index;
	}

	toString(): string {
		return `[${this.index}]`;
	}
}
export class AliasPathSegment implements IPathSegment {
	public readonly type = "Alias" as const;
	public readonly isArrayIndex = false;
	constructor(
		private readonly name: string,
		private readonly context: Context,
	) {}

	isUnresolvable(): boolean {
		return !this.context.attrNameMap[this.name];
	}

	value(): string {
		return this.context.attrNameMap[this.name] ?? "";
	}

	toString(): string {
		return this.name;
	}
}
