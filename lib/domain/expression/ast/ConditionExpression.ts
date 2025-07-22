import {
	BetweenBoundsError,
	BetweenOperandTypeError,
	DistinctOperandsError,
	DocumentPathRequiredError,
	IncorrectOperandTypeError,
	InvalidAttributeTypeError,
	MisusedFunctionError,
	NumberOfOperandsError,
	RedundantParensError,
	UnknownFunctionError,
} from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { BetweenOperator } from "./BetweenOperator";
import type { ComparisonOperator } from "./ComparisonOperator";
import type { ConditionFunction } from "./ConditionFunction";
import type { InOperator } from "./InOperator";
import type { LogicalOperator } from "./LogicalOperator";
import type { NotOperator } from "./NotOperator";
import type { PathExpression } from "./PathExpression";
import type { RedundantParens } from "./RedundantParens";
import type { IAstNode } from "./interfaces";

export type ConditionOperand =
	| ConditionFunction
	| AttributeValue
	| PathExpression
	| RedundantParens;

export type ConditionNode =
	| LogicalOperator
	| NotOperator
	| ComparisonOperator
	| BetweenOperator
	| InOperator
	| ConditionFunction
	| RedundantParens;

// Helper type guards
function isRedundantParens(
	node: ConditionNode | ConditionOperand,
): node is RedundantParens {
	return node.type === "RedundantParens";
}
function isConditionFunction(
	node: ConditionNode | ConditionOperand,
): node is ConditionFunction {
	return node.type === "ConditionFunction";
}
function isPathExpression(
	node: ConditionNode | ConditionOperand,
): node is PathExpression {
	return node.type === "PathExpression";
}
function isAttributeValue(
	node: ConditionNode | ConditionOperand,
): node is AttributeValue {
	return node.type === "AttributeValue";
}
function isComparisonOperator(
	node: ConditionNode | ConditionOperand,
): node is ComparisonOperator {
	return node.type === "ComparisonOperator";
}
function isBetweenOperator(
	node: ConditionNode | ConditionOperand,
): node is BetweenOperator {
	return node.type === "BetweenOperator";
}
function isLogicalOperator(
	node: ConditionNode | ConditionOperand,
): node is LogicalOperator {
	return node.type === "LogicalOperator";
}
function isNotOperator(
	node: ConditionNode | ConditionOperand,
): node is NotOperator {
	return node.type === "NotOperator";
}
function isInOperator(
	node: ConditionNode | ConditionOperand,
): node is InOperator {
	return node.type === "InOperator";
}

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
			isConditionFunction(this.expression) &&
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
			if (isConditionFunction(node)) {
				const functions: Record<string, number> = {
					attribute_exists: 1,
					attribute_not_exists: 1,
					attribute_type: 2,
					begins_with: 2,
					contains: 2,
					size: 1,
				};
				if (functions[node.name] === undefined) {
					throw new UnknownFunctionError(node.name);
				}
			}
		});
	}

	private validateMisusedFunctions(): void {
		this.traverse((node) => {
			let operands: (ConditionNode | ConditionOperand)[] = [];
			if (isComparisonOperator(node)) {
				operands = [node.left, node.right];
			} else if (isBetweenOperator(node)) {
				operands = [node.operand, node.lowerBound, node.upperBound];
			} else if (isInOperator(node)) {
				operands = [node.left, ...node.right];
			}

			for (const op of operands) {
				if (isConditionFunction(op) && op.name !== "size") {
					throw new MisusedFunctionError(op.name);
				}
			}
		});
	}

	private validateReservedKeywords(): void {
		this.traverse((node) => {
			if (isPathExpression(node)) {
				node.validateReservedKeyword();
			}
		});
	}

	private validateAttributeNamesAndValues(): void {
		this.traverse((node) => {
			if (isPathExpression(node)) {
				node.validateResolvability();
			}
			if (isAttributeValue(node)) {
				node.validateResolvability();
			}
		});
	}

	private validateNumberOfOperands(): void {
		this.traverse((node) => {
			if (isConditionFunction(node)) {
				const functions: Record<string, number> = {
					attribute_exists: 1,
					attribute_not_exists: 1,
					attribute_type: 2,
					begins_with: 2,
					contains: 2,
					size: 1,
				};
				const numOperands = functions[node.name];
				if (numOperands !== undefined && numOperands !== node.args.length) {
					throw new NumberOfOperandsError(node.name, node.args.length);
				}
			}
		});
	}

	private validateDistinctOperands(): void {
		this.traverse((node) => {
			if (isComparisonOperator(node)) {
				if (isPathExpression(node.left) && isPathExpression(node.right)) {
					if (node.left.toString() === node.right.toString()) {
						throw new DistinctOperandsError(
							node.operator,
							node.left.toString(),
						);
					}
				}
			}
		});
	}

	private validateFunctionArgumentTypes(): void {
		this.traverse((node) => {
			if (isConditionFunction(node)) {
				const getOperandType = (operand: ConditionOperand): string | null => {
					if (isAttributeValue(operand)) {
						return operand.value()?.type ?? null;
					}
					if (isConditionFunction(operand) && operand.name === "size") {
						return "N";
					}
					return null;
				};

				switch (node.name) {
					case "attribute_exists":
					case "attribute_not_exists":
						if (!isPathExpression(node.args[0])) {
							throw new DocumentPathRequiredError(node.name);
						}
						break;
					case "begins_with":
						for (const arg of node.args) {
							const type = getOperandType(arg);
							if (type && type !== "S" && type !== "B") {
								throw new IncorrectOperandTypeError(node.name, type);
							}
						}
						break;
					case "attribute_type": {
						const type = getOperandType(node.args[1]);
						if (type !== "S") {
							throw new IncorrectOperandTypeError(
								node.name,
								type || "{NS,SS,L,BS,N,M,B,BOOL,NULL,S}",
							);
						}
						if (isAttributeValue(node.args[1])) {
							const val = node.args[1].value();
							if (val?.type === "S") {
								const typeValue = val.value as string;
								if (
									![
										"S",
										"N",
										"B",
										"NULL",
										"SS",
										"BOOL",
										"L",
										"BS",
										"NS",
										"M",
									].includes(typeValue)
								) {
									throw new InvalidAttributeTypeError(typeValue);
								}
							}
						}
						break;
					}
					case "size": {
						const type = getOperandType(node.args[0]);
						if (isPathExpression(node.args[0])) {
							// We can't determine the type of a path at validation time.
						} else if (type && ["N", "BOOL", "NULL"].includes(type)) {
							throw new IncorrectOperandTypeError(node.name, type);
						}
						break;
					}
				}
			}
		});
	}

	private validateBetweenBounds(): void {
		this.traverse((node) => {
			if (isBetweenOperator(node)) {
				const { lowerBound, upperBound } = node;
				if (isAttributeValue(lowerBound) && isAttributeValue(upperBound)) {
					const lower = lowerBound.value();
					const upper = upperBound.value();
					if (lower && upper) {
						if (lower.type !== upper.type) {
							throw new BetweenOperandTypeError(lower, upper);
						}
						if (lower.gt(upper)) {
							throw new BetweenBoundsError(lower, upper);
						}
					}
				}
			}
		});
	}
}
