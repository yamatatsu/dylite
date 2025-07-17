import type { AddSection } from "./AddSection";
import type { DeleteSection } from "./DeleteSection";
import type { RemoveSection } from "./RemoveSection";
import type { SetSection } from "./SetSection";
import type {
	IASTNode,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
} from "./interfaces";

export type Section = SetSection | RemoveSection | AddSection | DeleteSection;

export class UpdateExpression
	implements IASTNode, IUnknownFunctionHolder, IUnresolvableNameHolder
{
	readonly type = "UpdateExpression";

	constructor(public readonly sections: Section[]) {}

	findReservedWord(): string | undefined {
		for (const section of this.sections) {
			const reserved = section.findReservedWord();
			if (reserved) {
				return reserved;
			}
		}
		return undefined;
	}

	findUnknownFunction(): string | undefined {
		for (const section of this.sections) {
			if (section.type !== "SET") {
				continue;
			}
			const unknownFunction = section.findUnknownFunction();
			if (unknownFunction) {
				return unknownFunction;
			}
		}
		return undefined;
	}

	findDuplicateSection(): string | undefined {
		const sectionSet = new Set<string>();
		for (const section of this.sections) {
			if (sectionSet.has(section.type)) {
				return section.type;
			}
			sectionSet.add(section.type);
		}
		return undefined;
	}

	findUnresolvableName(): string | undefined {
		for (const section of this.sections) {
			if ("findUnresolvableName" in section) {
				const unresolvable = section.findUnresolvableName();
				if (unresolvable) {
					return unresolvable;
				}
			}
		}
		return undefined;
	}
}
