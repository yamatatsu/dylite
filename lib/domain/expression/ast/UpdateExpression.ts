import type { AddAction } from "./AddAction";
import type { AddSection } from "./AddSection";
import type { ArithmeticExpression } from "./ArithmeticExpression";
import {
	DuplicateSectionError,
	OverlappedPathError,
	PathConflictError,
} from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { DeleteAction } from "./DeleteAction";
import type { DeleteSection } from "./DeleteSection";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { RemoveAction } from "./RemoveAction";
import type { RemoveSection } from "./RemoveSection";
import type { SetAction } from "./SetAction";
import type { SetSection } from "./SetSection";
import type { IAstNode } from "./interfaces";

export type Section = SetSection | RemoveSection | AddSection | DeleteSection;

export class UpdateExpression implements IAstNode {
	readonly type = "UpdateExpression";

	constructor(public readonly sections: Section[]) {}

	traverse(
		visitor: (
			node:
				| SetSection
				| SetAction
				| RemoveSection
				| RemoveAction
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

	assertDuplicateSection(): void {
		const sectionSet = new Set<string>();
		for (const section of this.sections) {
			if (sectionSet.has(section.type)) {
				throw new DuplicateSectionError(section.type);
			}
			sectionSet.add(section.type);
		}
	}

	assertOverlappedPath(): void {
		const paths: PathExpression[] = [];

		for (const section of this.sections) {
			for (const expr of section.expressions) {
				const currentPath = expr.path;

				for (const existingPath of paths) {
					if (existingPath.isOverlappedOf(currentPath)) {
						throw new OverlappedPathError(
							existingPath.toString(),
							currentPath.toString(),
						);
					}
				}

				paths.push(currentPath);
			}
		}
	}

	assertPathConflict(): void {
		const paths: PathExpression[] = [];

		this.traverse((node) => {
			if (node.type === "PathExpression") {
				const currentPath = node;

				for (const existingPath of paths) {
					if (existingPath.isConflictWith(currentPath)) {
						throw new PathConflictError(
							existingPath.toString(),
							currentPath.toString(),
						);
					}
				}

				paths.push(currentPath);
			}
		});
	}
}
