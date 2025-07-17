import type { AddAction } from "./AddAction";

export class AddSection {
	readonly type = "ADD";

	constructor(public readonly expressions: AddAction[]) {}
}
