import type { AddAction } from "./AddAction";
import type { AddSection } from "./AddSection";
import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { DeleteAction } from "./DeleteAction";
import type { DeleteSection } from "./DeleteSection";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { RemoveSection } from "./RemoveSection";
import type { SetAction } from "./SetAction";
import type { SetSection } from "./SetSection";
import type {
	IAstNode,
	IOverlappedPathHolder,
	IPathConflictHolder,
	IReservedWordHolder,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export type Section = SetSection | RemoveSection | AddSection | DeleteSection;

export class UpdateExpression
	implements
		IAstNode,
		IReservedWordHolder,
		IUnknownFunctionHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder,
		IOverlappedPathHolder,
		IPathConflictHolder
{
	readonly type = "UpdateExpression";

	constructor(public readonly sections: Section[]) {}

	traverse(
		visitor: (
			node:
				| SetSection
				| SetAction
				| AddSection
				| AddAction
				| DeleteSection
				| DeleteAction
				| PathExpression
				| AttributeValue
				| FunctionForUpdate
				| ArithmeticExpression,
		) => void,
	): void {
		for (const section of this.sections) {
			section.traverse(visitor);
		}
	}

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

	findOverlappedPath(): [PathExpression, PathExpression] | undefined {
		const paths: PathExpression[] = [];

		for (const section of this.sections) {
			for (const expr of section.expressions) {
				const currentPath = expr.path;

				for (const existingPath of paths) {
					if (existingPath.isOverlappedOf(currentPath)) {
						return [existingPath, currentPath];
					}
				}

				paths.push(currentPath);
			}
		}

		return undefined;
	}

	findPathConflict(): [PathExpression, PathExpression] | undefined {
		const paths: PathExpression[] = [];

		for (const section of this.sections) {
			for (const expr of section.expressions) {
				const currentPath = expr.path;

				for (const existingPath of paths) {
					if (existingPath.isConflictWith(currentPath)) {
						return [existingPath, currentPath];
					}
				}

				paths.push(currentPath);
			}
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

	findUnresolvableValue(): string | undefined {
		for (const section of this.sections) {
			if ("findUnresolvableValue" in section) {
				const unresolvable = section.findUnresolvableValue();
				if (unresolvable) {
					return unresolvable;
				}
			}
		}
		return undefined;
	}
}
