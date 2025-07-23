import { MisusedFunctionError, RedundantParensError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { BetweenOperator } from "./BetweenOperator";
import type { ComparisonOperator } from "./ComparisonOperator";
import type { ConditionFunction } from "./ConditionFunction";
import type { DocumentPath } from "./DocumentPath";
import type { InOperator } from "./InOperator";
import type { LogicalOperator } from "./LogicalOperator";
import type { NotOperator } from "./NotOperator";
import type { RedundantParens } from "./RedundantParens";
import type { IAstNode } from "./interfaces";

export type ConditionOperand =
	| ConditionFunction
	| AttributeValue
	| DocumentPath
	| RedundantParens;

export type ConditionNode =
	| LogicalOperator
	| NotOperator
	| ComparisonOperator
	| BetweenOperator
	| InOperator
	| ConditionFunction
	| RedundantParens;

export class ConditionExpression implements IAstNode {
	readonly type = "ConditionExpression";

	constructor(public readonly expression: ConditionNode) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		this.expression.traverse(visitor);
	}

	validate(): void {
		this.validateParens();
		this.validateUnknownFunctions();
		this.validateMisusedFunctions();
		this.validateReservedKeywords();
		this.validateAttributeNamesAndValues();
		this.validateNumberOfOperands();
		this.validateDistinctOperands();
		this.validateFunctionArgumentTypes();
		this.validateBetweenBounds();

		if (
			this.expression.type === "ConditionFunction" &&
			this.expression.name === "size"
		) {
			throw new MisusedFunctionError("size");
		}
	}

	private validateParens(): void {
		this.traverse((node) => {
			if (node.type === "RedundantParens") {
				throw new RedundantParensError();
			}
		});
	}

	private validateUnknownFunctions(): void {
		this.traverse((node) => {
			if (node.type === "ConditionFunction") {
				node.validateFunctionName();
			}
		});
	}

	private validateMisusedFunctions(): void {
		this.traverse((node) => {
			if (
				node.type === "ComparisonOperator" ||
				node.type === "BetweenOperator" ||
				node.type === "InOperator"
			) {
				node.validateMisusedFunctions();
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

	private validateAttributeNamesAndValues(): void {
		this.traverse((node) => {
			if (node.type === "DocumentPath") {
				node.validateResolvability();
			}
			if (node.type === "AttributeValue") {
				node.validateResolvability();
			}
		});
	}

	private validateNumberOfOperands(): void {
		this.traverse((node) => {
			if (node.type === "ConditionFunction") {
				node.validateNumberOfOperands();
			}
		});
	}

	private validateDistinctOperands(): void {
		this.traverse((node) => {
			if (node.type === "ComparisonOperator") {
				node.validateDistinctOperands();
			}
		});
	}

	private validateFunctionArgumentTypes(): void {
		this.traverse((node) => {
			if (node.type === "ConditionFunction") {
				node.validateArgumentTypes();
			}
		});
	}

	private validateBetweenBounds(): void {
		this.traverse((node) => {
			if (node.type === "BetweenOperator") {
				node.validateBounds();
			}
		});
	}
}
