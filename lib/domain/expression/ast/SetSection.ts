import type { SetAction } from "./SetAction";

export class SetSection {
	readonly type = "SET";

	constructor(public readonly expressions: SetAction[]) {}
}
