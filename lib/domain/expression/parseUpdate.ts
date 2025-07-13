import type { AttributeValue } from "../types";
import type { PathSegment } from "./PathSegment";
import type { Context } from "./context";
import updateParser from "./update-grammar";

type PathExpression = {
	type: "PathExpression";
	segments: PathSegment[];
};

type Value = { type: "AttributeValue"; name: string }; // DynamoDB attribute values after resolution

type Operand = PathExpression | Value | FunctionCall | ArithmeticExpression;

type FunctionCall = {
	type: "FunctionCall";
	name: string;
	args: Operand[];
};

type ArithmeticExpression = {
	type: "ArithmeticExpression";
	operator: "+" | "-";
	left: Operand;
	right: Operand;
};

type SetExpression = {
	type: "SetExpression";
	path: PathExpression;
	value: Operand;
};

type RemoveExpression = {
	type: "RemoveExpression";
	path: PathExpression;
};

type AddExpression = {
	type: "AddExpression";
	path: PathExpression;
	value: Value;
};

type DeleteExpression = {
	type: "DeleteExpression";
	path: PathExpression;
	value: Value;
};

type Section = {
	type: "SET" | "REMOVE" | "ADD" | "DELETE";
	expressions: (
		| SetExpression
		| RemoveExpression
		| AddExpression
		| DeleteExpression
	)[];
};

type UpdateExpressionAST = {
	type: "UpdateExpression";
	sections: Section[];
};

export function parseUpdate(
	expression: string,
	options: {
		ExpressionAttributeNames: Record<string, string> | undefined;
		ExpressionAttributeValues: Record<string, AttributeValue> | undefined;
	},
) {
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: options.ExpressionAttributeValues ?? {},
	};

	const validationContext = {
		attrNames: options.ExpressionAttributeNames,
		attrVals: options.ExpressionAttributeValues,
	};

	// Parse to AST
	const ast: UpdateExpressionAST = updateParser.parse(expression, { context });

	// Process AST: resolve aliases and validate
	const errors: Record<string, string> = {};
	const sections: Record<string, boolean> = {};
	const paths: (string | number)[][] = [];
	const processedSections: unknown[] = [];

	for (const section of ast.sections) {
		// Check for duplicate sections
		if (sections[section.type]) {
			errors.section = `The "${section.type}" section can only be used once in an update expression;`;
			break;
		}
		sections[section.type] = true;

		const processedExpressions: unknown[] = [];

		for (const expr of section.expressions) {
			let processedExpr: unknown;

			// Validate path and check for errors, but keep AST structure
			validatePath(expr.path, validationContext, errors);
			if (errors.attrName || errors.reserved) break;

			// Still resolve path for internal tracking
			const resolvedPath = resolvePath(expr.path, validationContext, errors);
			if (errors.attrName || errors.reserved) break;

			// Check path conflicts
			checkPath(resolvedPath, paths, errors);
			if (errors.pathOverlap || errors.pathConflict) break;

			switch (expr.type) {
				case "SetExpression": {
					const resolvedValue = resolveOperand(
						expr.value,
						validationContext,
						errors,
					);
					if (hasError(errors)) break;

					const attrType = getType(resolvedValue, validationContext);
					processedExpr = {
						type: "set",
						path: expr.path,
						val: resolvedValue,
						attrType: attrType,
					};
					break;
				}
				case "RemoveExpression": {
					processedExpr = {
						type: "remove",
						path: expr.path,
					};
					break;
				}
				case "AddExpression": {
					// Validate value but keep AST structure
					validateValue(expr.value, validationContext, errors);
					if (errors.attrVal) break;

					// For type checking, we need the resolved value
					const resolvedValue = resolveValue(
						expr.value,
						validationContext,
						errors,
					);
					const attrType = checkOperator(
						"ADD",
						resolvedValue,
						validationContext,
						errors,
					);
					if (hasError(errors)) break;

					processedExpr = {
						type: "add",
						path: expr.path,
						val: expr.value,
						attrType: attrType,
					};
					break;
				}
				case "DeleteExpression": {
					// Validate value but keep AST structure
					validateValue(expr.value, validationContext, errors);
					if (errors.attrVal) break;

					// For type checking, we need the resolved value
					const resolvedValue = resolveValue(
						expr.value,
						validationContext,
						errors,
					);
					const attrType = checkOperator(
						"DELETE",
						resolvedValue,
						validationContext,
						errors,
					);
					if (hasError(errors)) break;

					processedExpr = {
						type: "delete",
						path: expr.path,
						val: expr.value,
						attrType: attrType,
					};
					break;
				}
			}

			if (hasError(errors)) break;
			processedExpressions.push(processedExpr);
		}

		if (hasError(errors)) break;
		processedSections.push(...processedExpressions);
	}

	// Check for errors
	const error = checkErrors(errors);
	if (error) return error;

	return processedSections;
}

type ValidationContext = {
	attrNames?: Record<string, string>;
	attrVals?: Record<string, unknown>;
};

function validatePath(
	path: PathExpression,
	context: ValidationContext,
	errors: Record<string, string>,
): void {
	for (let i = 0; i < path.segments.length; i++) {
		const segment = path.segments[i];

		if (segment.type === "Identifier") {
			if (!errors.reserved && segment.isReserved()) {
				errors.reserved = `Attribute name is a reserved keyword; reserved keyword: ${segment.toString()}`;
			}
			if (errors.reserved) return;
		} else if (segment.type === "Alias") {
			if (!errors.attrName && segment.isUnresolvable()) {
				errors.attrName = `An expression attribute name used in the document path is not defined; attribute name: ${segment.toString()}`;
			}
			if (errors.attrName) return;
		}
	}
}

function resolvePath(
	path: PathExpression,
	context: ValidationContext,
	errors: Record<string, string>,
): (string | number)[] {
	const resolvedSegments: (string | number)[] = [];

	for (let i = 0; i < path.segments.length; i++) {
		const segment = path.segments[i];
		resolvedSegments.push(segment.value());
	}

	return resolvedSegments;
}

function resolveOperand(
	operand: Operand,
	context: ValidationContext,
	errors: Record<string, string>,
): unknown {
	if (operand.type === "PathExpression") {
		// Keep PathExpression as AST, but validate it
		validatePath(operand as PathExpression, context, errors);
		return operand;
	}
	if (operand.type === "AttributeValue") {
		// Keep AttributeValue as AST, but validate it
		validateValue(operand as Value, context, errors);
		return operand;
	}
	if (operand.type === "FunctionCall") {
		return resolveFunction(operand as FunctionCall, context, errors);
	}
	if (operand.type === "ArithmeticExpression") {
		const arithExpr = operand as ArithmeticExpression;
		const left = resolveOperand(arithExpr.left, context, errors);
		if (hasError(errors)) return null;

		const right = resolveOperand(arithExpr.right, context, errors);
		if (hasError(errors)) return null;

		const attrType = checkFunction(
			arithExpr.operator,
			[left, right],
			context,
			errors,
		);
		if (hasError(errors)) return null;

		return {
			type: arithExpr.operator === "+" ? "add" : "subtract",
			args: [left, right],
			attrType: attrType,
		};
	}
	return operand;
}

function validateValue(
	value: Value,
	context: ValidationContext,
	errors: Record<string, string>,
): void {
	if (
		value &&
		typeof value === "object" &&
		"type" in value &&
		value.type === "AttributeValue"
	) {
		const attrValue = value as { type: "AttributeValue"; name: string };
		// Validate that the attribute value exists
		resolveAttrVal(attrValue.name, context, errors);
	}
}

function resolveValue(
	value: Value,
	context: ValidationContext,
	errors: Record<string, string>,
): unknown {
	if (
		value &&
		typeof value === "object" &&
		"type" in value &&
		value.type === "AttributeValue"
	) {
		const attrValue = value as { type: "AttributeValue"; name: string };
		return resolveAttrVal(attrValue.name, context, errors);
	}
	return value;
}

function resolveFunction(
	func: FunctionCall,
	context: ValidationContext,
	errors: Record<string, string>,
): unknown {
	const resolvedArgs: unknown[] = [];

	for (const arg of func.args) {
		const resolved = resolveOperand(arg, context, errors);
		if (hasError(errors)) return null;
		resolvedArgs.push(resolved);
	}

	const attrType = checkFunction(func.name, resolvedArgs, context, errors);
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
	context: ValidationContext,
	errors: Record<string, string>,
): string | null {
	if (errors.unknownFunction) {
		return null;
	}

	const functions: Record<string, number> = {
		if_not_exists: 2,
		list_append: 2,
		"+": 2,
		"-": 2,
	};

	const numOperands = functions[name];
	if (numOperands == null) {
		errors.unknownFunction = `Invalid function name; function: ${name}`;
		return null;
	}

	if (errors.function) {
		return null;
	}

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
			return getType(args[1], context);
		case "list_append":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i], context);
				if (type && type !== "L") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "L";
		case "+":
		case "-":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i], context);
				if (type && type !== "N") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "N";
	}
	return null;
}

function resolveAttrName(
	name: string,
	context: ValidationContext,
	errors: Record<string, string>,
): string | null {
	if (errors.attrName) {
		return null;
	}
	if (!context.attrNames || !context.attrNames[name]) {
		errors.attrName = `An expression attribute name used in the document path is not defined; attribute name: ${name}`;
		return null;
	}
	return context.attrNames[name];
}

function resolveAttrVal(
	name: string,
	context: ValidationContext,
	errors: Record<string, string>,
): unknown {
	if (errors.attrVal) {
		return null;
	}
	if (!context.attrVals || !context.attrVals[name]) {
		errors.attrVal = `An expression attribute value used in expression is not defined; attribute value: ${name}`;
		return null;
	}
	return context.attrVals[name];
}

function checkPath(
	path: (string | number)[],
	paths: (string | number)[][],
	errors: Record<string, string>,
) {
	if (errors.pathOverlap || !Array.isArray(path)) {
		return;
	}
	for (let i = 0; i < paths.length; i++) {
		checkPaths(paths[i], path, errors);
		if (errors.pathOverlap || errors.pathConflict) {
			return;
		}
	}
	paths.push(path);
}

function checkPaths(
	path1: (string | number)[],
	path2: (string | number)[],
	errors: Record<string, string>,
) {
	for (let i = 0; i < path1.length && i < path2.length; i++) {
		if (typeof path1[i] !== typeof path2[i]) {
			errors.pathConflict = `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
			return;
		}
		if (path1[i] !== path2[i]) return;
	}
	if (!errors.pathOverlap) {
		errors.pathOverlap = `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
	}
}

function pathStr(path: (string | number)[]): string {
	return `[${path
		.map((piece) => {
			return typeof piece === "number" ? `[${piece}]` : piece;
		})
		.join(", ")}]`;
}

function checkOperator(
	operator: string,
	val: unknown,
	context: ValidationContext,
	errors: Record<string, string>,
): string | null {
	if (errors.operand || !val) {
		return null;
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
	const type = getType(val, context);
	if (type && typeMappings[type] && !(operator === "ADD" && type === "N")) {
		if (operator === "DELETE" && !type.endsWith("S")) {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		} else if (operator === "ADD" && type !== "N") {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		}
	}
	return type;
}

function getType(val: unknown, context?: ValidationContext): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (val && typeof val === "object" && "attrType" in val) {
		return (val as { attrType: string }).attrType;
	}
	// For AttributeValueNode, resolve the actual value to get its type
	if (
		val &&
		typeof val === "object" &&
		"type" in val &&
		val.type === "AttributeValue" &&
		context
	) {
		const attrValue = val as { type: "AttributeValue"; name: string };
		const errors: Record<string, string> = {};
		const resolved = resolveAttrVal(attrValue.name, context, errors);
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
	const errorOrder = [
		"reserved",
		"unknownFunction",
		"section",
		"attrName",
		"attrVal",
		"pathOverlap",
		"pathConflict",
		"operand",
		"function",
	];
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) return errors[errorOrder[i]];
	}
	return null;
}

function hasError(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}
