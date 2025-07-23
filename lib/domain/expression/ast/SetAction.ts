import type { ArithmeticOperator } from "./ArithmeticOperator";
import type { AttributeValue } from "./AttributeValue";
import type { DocumentPath } from "./DocumentPath";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { IAstNode } from "./interfaces";

export type Operand =
	| DocumentPath
	| AttributeValue
	| FunctionForUpdate
	| ArithmeticOperator;

export class SetAction implements IAstNode {
	readonly type = "SetAction";

	constructor(
		public readonly path: DocumentPath,
		public readonly value: Operand,
	) {}

	traverse(visitor: (node: this | Operand) => void): void {
		visitor(this);
		this.path.traverse(visitor);
		this.value.traverse(visitor);
	}
}
