import type { RemoveAction } from "./RemoveAction";

export class RemoveSection {
	readonly type = "REMOVE";

	constructor(public readonly expressions: RemoveAction[]) {}
}
