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
import type { DocumentPath } from "./DocumentPath";
import type { FunctionForUpdate } from "./FunctionForUpdate";
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
				| DocumentPath
				| AttributeValue
				| FunctionForUpdate
				| ArithmeticExpression,
		) => void,
	): void {
		for (const section of this.sections) {
			section.traverse(visitor);
		}
	}

	validate(): void {
		this.validateReservedKeywords();
		this.validateUnknownFunctions();
		this.validateDuplicateSection();
		this.validatePathResolvability();
		this.validateAttributeValueResolvability();
		this.validateOverlappedPath();
		this.validatePathConflict();
		this.validateActionOperandTypes();
		this.validateArithmeticExpressionUsage();
		this.validateFunctionUsage();
	}

	private validateDuplicateSection(): void {
		const sectionSet = new Set<string>();
		for (const section of this.sections) {
			if (sectionSet.has(section.type)) {
				throw new DuplicateSectionError(section.type);
			}
			sectionSet.add(section.type);
		}
	}

	private validateOverlappedPath(): void {
		const paths: DocumentPath[] = [];

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

	private validatePathConflict(): void {
		const paths: DocumentPath[] = [];

		this.traverse((node) => {
			if (node.type === "DocumentPath") {
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

	private validateReservedKeywords(): void {
		this.traverse((node) => {
			if (node.type === "DocumentPath") {
				node.validateReservedKeyword();
			}
		});
	}

	private validateUnknownFunctions(): void {
		this.traverse((node) => {
			if (node.type === "FunctionCall") {
				node.validateUnknownFunction();
			}
		});
	}

	private validatePathResolvability(): void {
		this.traverse((node) => {
			if (node.type === "DocumentPath") {
				node.validateResolvability();
			}
		});
	}

	private validateAttributeValueResolvability(): void {
		this.traverse((node) => {
			if (node.type === "AttributeValue") {
				node.validateResolvability();
			}
		});
	}

	private validateActionOperandTypes(): void {
		this.traverse((node) => {
			if (node.type === "AddAction" || node.type === "DeleteAction") {
				node.validateOperandType();
			}
		});
	}

	private validateArithmeticExpressionUsage(): void {
		this.traverse((node) => {
			if (node.type === "ArithmeticExpression") {
				node.validateUsage();
			}
		});
	}

	private validateFunctionUsage(): void {
		this.traverse((node) => {
			if (node.type === "FunctionCall") {
				node.validateUsage();
			}
		});
	}
}
