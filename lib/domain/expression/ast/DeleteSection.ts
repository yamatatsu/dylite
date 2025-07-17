import type { DeleteAction } from "./DeleteAction";

export class DeleteSection {
	readonly type = "DELETE";

	constructor(public readonly expressions: DeleteAction[]) {}
}
