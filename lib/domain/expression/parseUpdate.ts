import type { Value } from "../types";
import { AttributeValue } from "./ast/AttributeValue";
import type { FunctionForUpdate } from "./ast/FunctionForUpdate";
import type { Operand } from "./ast/SetAction";
import type { UpdateExpression } from "./ast/UpdateExpression";
import type { Context } from "./context";
import updateParser from "./grammar-update";

export function parseUpdate(
	expression: string,
	options: {
		ExpressionAttributeNames: Record<string, string> | undefined;
		ExpressionAttributeValues: Record<string, Value> | undefined;
	},
) {
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: options.ExpressionAttributeValues ?? {},
	};

	// Parse to AST
	const ast: UpdateExpression = updateParser.parse(expression, { context });

	// Process AST: resolve aliases and validate
	const errors: Record<string, string> = {};

	const reservedWord = ast.findReservedWord();
	if (reservedWord) {
		return `Attribute name is a reserved keyword; reserved keyword: ${reservedWord}`;
	}
	const unknownFunction = ast.findUnknownFunction();
	if (unknownFunction) {
		return `Invalid function name; function: ${unknownFunction}`;
	}
	const duplicateSection = ast.findDuplicateSection();
	if (duplicateSection) {
		return `The "${duplicateSection}" section can only be used once in an update expression;`;
	}
	const unresolvableName = ast.findUnresolvableName();
	if (unresolvableName) {
		return `An expression attribute name used in the document path is not defined; attribute name: ${unresolvableName}`;
	}
	const unresolvableValue = ast.findUnresolvableValue();
	if (unresolvableValue) {
		return `An expression attribute value used in expression is not defined; attribute value: ${unresolvableValue}`;
	}
	const overlappedPath = ast.findOverlappedPath();
	if (overlappedPath) {
		return `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${overlappedPath[0]}, path two: ${overlappedPath[1]}`;
	}
	const pathConflict = ast.findPathConflict();
	if (pathConflict) {
		return `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathConflict[0]}, path two: ${pathConflict[1]}`;
	}

	for (const section of ast.sections) {
		for (const expr of section.expressions) {
			switch (expr.type) {
				case "SetAction": {
					resolveOperand(expr.value, errors);
					break;
				}
				case "RemoveAction": {
					break;
				}
				case "AddAction":
					checkOperator("ADD", expr.value, errors);
					break;
				case "DeleteAction":
					checkOperator("DELETE", expr.value, errors);
					break;
			}

			if (hasError(errors)) break;
		}

		if (hasError(errors)) break;
	}

	// Check for errors
	const error = checkErrors(errors);
	if (error) return error;

	return ast;
}

function resolveOperand(
	operand: Operand,
	errors: Record<string, string>,
): unknown {
	if (operand.type === "PathExpression") {
		return operand;
	}
	if (operand.type === "AttributeValue") {
		return operand;
	}
	if (operand.type === "FunctionCall") {
		return resolveFunction(operand, errors);
	}
	if (operand.type === "ArithmeticExpression") {
		const arithExpr = operand;
		const left = resolveOperand(arithExpr.left, errors);
		if (hasError(errors)) return null;

		const right = resolveOperand(arithExpr.right, errors);
		if (hasError(errors)) return null;

		const attrType = checkFunction(arithExpr.operator, [left, right], errors);
		if (hasError(errors)) return null;

		return {
			type: arithExpr.operator === "+" ? "add" : "subtract",
			args: [left, right],
			attrType: attrType,
		};
	}
	return operand;
}

function resolveFunction(
	func: FunctionForUpdate,
	errors: Record<string, string>,
): unknown {
	const resolvedArgs: unknown[] = [];

	for (const arg of func.args) {
		const resolved = resolveOperand(arg, errors);
		if (hasError(errors)) return null;
		resolvedArgs.push(resolved);
	}

	const attrType = checkFunction(func.name, resolvedArgs, errors);
	if (hasError(errors)) return null;

	return {
		type: "function",
		name: func.name,
		args: resolvedArgs,
		attrType: attrType,
	};
}

function checkFunction(
	name: string,
	args: unknown[],
	errors: Record<string, string>,
): string | null {
	if (errors.function) {
		return null;
	}

	const functions: Record<string, number> = {
		if_not_exists: 2,
		list_append: 2,
		"+": 2,
		"-": 2,
	};

	const numOperands = functions[name];
	if (numOperands !== args.length) {
		errors.function = `Incorrect number of operands for operator or function; operator or function: ${name}, number of operands: ${args.length}`;
		return null;
	}

	switch (name) {
		case "if_not_exists":
			if (
				!args[0] ||
				typeof args[0] !== "object" ||
				!("type" in args[0]) ||
				args[0].type !== "PathExpression"
			) {
				errors.function = `Operator or function requires a document path; operator or function: ${name}`;
				return null;
			}
			return getType(args[1]);
		case "list_append":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i]);
				if (type && type !== "L") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "L";
		case "+":
		case "-":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i]);
				if (type && type !== "N") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "N";
	}
	return null;
}

function checkOperator(
	operator: string,
	val: AttributeValue,
	errors: Record<string, string>,
): void {
	if (errors.operand || !val) {
		return;
	}
	const typeMappings: Record<string, string> = {
		S: "STRING",
		N: "NUMBER",
		B: "BINARY",
		NULL: "NULL",
		BOOL: "BOOLEAN",
		L: "LIST",
		M: "MAP",
		SS: "STRING_SET",
		NS: "NUMBER_SET",
		BS: "BINARY_SET",
	};
	const type = getType(val.value());
	if (type && typeMappings[type] && !(operator === "ADD" && type === "N")) {
		if (operator === "DELETE" && !type.endsWith("S")) {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		} else if (operator === "ADD" && type !== "N") {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		}
	}
}

function getType(val: unknown): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (val && typeof val === "object" && "attrType" in val) {
		return (val as { attrType: string }).attrType;
	}
	// For AttributeValueNode, resolve the actual value to get its type
	if (val instanceof AttributeValue) {
		const errors: Record<string, string> = {};
		const resolved = val.value();
		if (resolved && !errors.attrVal) {
			return getImmediateType(resolved);
		}
		return null;
	}
	return getImmediateType(val);
}

function getImmediateType(val: unknown): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (val && typeof val === "object" && "attrType" in val) return null;

	const types = ["S", "N", "B", "NULL", "BOOL", "SS", "NS", "BS", "L", "M"];
	for (let i = 0; i < types.length; i++) {
		if (
			val &&
			typeof val === "object" &&
			types[i] in val &&
			(val as Record<string, unknown>)[types[i]] != null
		) {
			return types[i];
		}
	}
	return null;
}

function checkErrors(errors: Record<string, string>): string | null {
	const errorOrder = ["operand", "function"];
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) return errors[errorOrder[i]];
	}
	return null;
}

function hasError(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}
