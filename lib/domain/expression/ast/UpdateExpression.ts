import type { AddSection } from "./AddSection";
import type { DeleteSection } from "./DeleteSection";
import type { RemoveSection } from "./RemoveSection";
import type { SetSection } from "./SetSection";

export type Section = SetSection | RemoveSection | AddSection | DeleteSection;

export class UpdateExpression {
	readonly type = "UpdateExpression";

	constructor(public readonly sections: Section[]) {}
}
