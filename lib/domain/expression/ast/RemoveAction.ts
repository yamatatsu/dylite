import type { PathExpression } from "./PathExpression";

export class RemoveAction {
	readonly type = "RemoveAction";

	constructor(public readonly path: PathExpression) {}
}
