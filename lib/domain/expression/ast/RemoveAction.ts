import type { PathExpression } from "./PathExpression";
import type { IReservedWordHolder } from "./interfaces.js";

export class RemoveAction implements IReservedWordHolder {
	readonly type = "RemoveAction";

	constructor(public readonly path: PathExpression) {}

	findReservedWord(): string | undefined {
		return this.path.findReservedWord();
	}
}
