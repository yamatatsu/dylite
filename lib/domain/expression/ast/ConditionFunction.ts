import {
	DocumentPathRequiredError,
	IncorrectOperandTypeError,
	InvalidAttributeTypeError,
	MisusedFunctionError,
	NumberOfOperandsError,
	UnknownFunctionError,
} from "./AstError";
import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class ConditionFunction implements IAstNode {
	readonly type = "ConditionFunction";

	constructor(
		public readonly name: string,
		public readonly args: ConditionOperand[],
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		for (const arg of this.args) {
			arg.traverse(visitor);
		}
	}

	validateFunctionName(): void {
		const functions: Record<string, number> = {
			attribute_exists: 1,
			attribute_not_exists: 1,
			attribute_type: 2,
			begins_with: 2,
			contains: 2,
			size: 1,
		};
		if (functions[this.name] === undefined) {
			throw new UnknownFunctionError(this.name);
		}
	}

	validateNumberOfOperands(): void {
		const functions: Record<string, number> = {
			attribute_exists: 1,
			attribute_not_exists: 1,
			attribute_type: 2,
			begins_with: 2,
			contains: 2,
			size: 1,
		};
		const numOperands = functions[this.name];
		if (numOperands !== undefined && numOperands !== this.args.length) {
			throw new NumberOfOperandsError(this.name, this.args.length);
		}
	}

	validateArgumentTypes(): void {
		const getOperandType = (operand: ConditionOperand): string | null => {
			if (operand.type === "AttributeValue") {
				return operand.value()?.type ?? null;
			}
			if (operand.type === "ConditionFunction" && operand.name === "size") {
				return "N";
			}
			return null;
		};

		switch (this.name) {
			case "attribute_exists":
			case "attribute_not_exists":
				if (this.args[0].type !== "DocumentPath") {
					throw new DocumentPathRequiredError(this.name);
				}
				break;
			case "begins_with":
				for (const arg of this.args) {
					const type = getOperandType(arg);
					if (type && type !== "S" && type !== "B") {
						throw new IncorrectOperandTypeError(this.name, type);
					}
				}
				break;
			case "attribute_type": {
				const type = getOperandType(this.args[1]);
				if (type !== "S") {
					throw new IncorrectOperandTypeError(
						this.name,
						type || "{NS,SS,L,BS,N,M,B,BOOL,NULL,S}",
					);
				}
				if (this.args[1].type === "AttributeValue") {
					const val = this.args[1].value();
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
				const type = getOperandType(this.args[0]);
				if (this.args[0].type === "DocumentPath") {
					// We can't determine the type of a path at validation time.
				} else if (type && ["N", "BOOL", "NULL"].includes(type)) {
					throw new IncorrectOperandTypeError(this.name, type);
				}
				break;
			}
		}
	}

	validateAsMisused(): void {
		if (this.name !== "size") {
			throw new MisusedFunctionError(this.name);
		}
	}
}
