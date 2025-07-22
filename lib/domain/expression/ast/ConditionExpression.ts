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
			if (node.type === "ComparisonOperator") {
				operands = [node.left, node.right];
			} else if (node.type === "BetweenOperator") {
				operands = [node.operand, node.lowerBound, node.upperBound];
			} else if (node.type === "InOperator") {
				operands = [node.left, ...node.right];
			}

			for (const op of operands) {
				if (op.type === "ConditionFunction" && op.name !== "size") {
					throw new MisusedFunctionError(op.name);
				}
			}
		});
	}

	private validateReservedKeywords(): void {
		this.traverse((node) => {
			if (node.type === "PathExpression") {
				node.validateReservedKeyword();
			}
		});
	}

	private validateAttributeNamesAndValues(): void {
		this.traverse((node) => {
			if (node.type === "PathExpression") {
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
			if (node.type === "ComparisonOperator") {
				if (
					node.left.type === "PathExpression" &&
					node.right.type === "PathExpression"
				) {
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
			if (node.type === "ConditionFunction") {
				const getOperandType = (operand: ConditionOperand): string | null => {
					if (operand.type === "AttributeValue") {
						return operand.value()?.type ?? null;
					}
					if (operand.type === "ConditionFunction" && operand.name === "size") {
						return "N";
					}
					return null;
				};

				switch (node.name) {
					case "attribute_exists":
					case "attribute_not_exists":
						if (node.args[0].type !== "PathExpression") {
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
						if (node.args[1].type === "AttributeValue") {
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
						if (node.args[0].type === "PathExpression") {
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
			if (node.type === "BetweenOperator") {
				const { lowerBound, upperBound } = node;
				if (
					lowerBound.type === "AttributeValue" &&
					upperBound.type === "AttributeValue"
				) {
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
