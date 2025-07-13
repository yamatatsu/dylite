import { compare } from "../compare";
import type { AttributeValue } from "../types";
import type { PathSegment } from "./PathSegment";
import conditionParser from "./condition-grammar";
import type { Context } from "./context";

// Type for compare function
type AttrVal = string | boolean | string[];
type Attr = Record<string, AttrVal>;

type PathExpression = {
	type: "PathExpression";
	segments: PathSegment[];
};

type AttributeValueNode = {
	type: "AttributeValue";
	name: string;
};

type FunctionNode = {
	type: "function";
	name: string;
	args: ASTNode[];
	attrType?: string | null;
};

type OperatorNode = {
	type:
		| "="
		| ">"
		| "<"
		| ">="
		| "<="
		| "<>"
		| "and"
		| "or"
		| "not"
		| "between"
		| "in";
	args: ASTNode[];
};

type RedundantParensNode = {
	type: "redundantParens";
	expr: ASTNode;
};

// Union type for all possible AST nodes
type ASTNode =
	| PathExpression
	| AttributeValueNode
	| FunctionNode
	| OperatorNode
	| RedundantParensNode
	| (string | number)[] // Resolved path
	| AttributeValue // Resolved attribute value
	| string // Identifier
	| number; // Array index

type ValidationContext = {
	attrNames: Record<string, string> | undefined;
	attrVals: Record<string, AttributeValue> | undefined;
	compare: (comp: string, x: AttributeValue, y: AttributeValue) => boolean;
};

type ValidationErrors = {
	reserved?: string;
	attrNameVal?: string;
	unknownFunction?: string;
	operand?: string;
	distinct?: string;
	function?: string;
	parens?: string;
	misusedFunction?: string;
	condition?: string;
};

export function parseCondition(
	expression: string,
	options: {
		ExpressionAttributeNames: Record<string, string> | undefined;
		ExpressionAttributeValues: Record<string, AttributeValue> | undefined;
	},
) {
	// Parse the expression to get raw AST with context
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: options.ExpressionAttributeValues ?? {},
	};
	const ast = conditionParser.parse(expression, { context }) as ASTNode;

	// Create validation context
	const validationContext: ValidationContext = {
		attrNames: options.ExpressionAttributeNames,
		attrVals: options.ExpressionAttributeValues as
			| Record<string, AttributeValue>
			| undefined,
		compare: (comp: string, x: AttributeValue, y: AttributeValue) => {
			return compare(comp, x as Attr, [y as Attr]);
		},
	};

	const errors: ValidationErrors = {};

	// Process the AST: validate and resolve aliases
	const processedAst = processNode(ast, validationContext, errors, true);

	// Check if size() is used at top level
	if (
		processedAst &&
		typeof processedAst === "object" &&
		!Array.isArray(processedAst) &&
		"type" in processedAst &&
		processedAst.type === "function" &&
		"name" in processedAst &&
		processedAst.name === "size"
	) {
		checkMisusedSize(processedAst, errors);
	}

	// Check for errors
	const error = checkErrors(errors);
	if (error) {
		return error;
	}

	return processedAst;
}

function processNode(
	node: ASTNode,
	context: ValidationContext,
	errors: ValidationErrors,
	isConditionExpression = false,
): ASTNode {
	if (!node || typeof node !== "object") {
		return node;
	}

	// Handle arrays (resolved paths)
	if (Array.isArray(node)) {
		return node.map((item: string | number) =>
			processNode(item as ASTNode, context, errors, false),
		) as (string | number)[];
	}

	// Handle redundant parentheses
	if (isRedundantParensNode(node)) {
		if (!errors.parens) {
			errors.parens = "The expression has redundant parentheses;";
		}
		return processNode(node.expr, context, errors, isConditionExpression);
	}

	// Handle paths - keep AST structure, validate internally
	if (isPathExpression(node)) {
		// Validate segments
		for (const segment of node.segments) {
			if (segment.type === "Identifier") {
				if (!errors.reserved && segment.isReserved()) {
					errors.reserved = `Attribute name is a reserved keyword; reserved keyword: ${segment.toString()}`;
				}
				if (errors.reserved) return node;
			} else if (segment.type === "Alias") {
				if (!errors.attrNameVal && segment.isUnresolvable()) {
					errors.attrNameVal = `An expression attribute name used in the document path is not defined; attribute name: ${segment.toString()}`;
				}
				if (errors.attrNameVal) return node;
			}
		}

		// Return the original AST structure
		return node;
	}

	// Handle attribute values - keep AST structure, validate internally
	if (isAttributeValueNode(node)) {
		// Validate that the attribute value exists
		resolveAttrVal(node.name, context, errors);

		// Return the original AST structure
		return node;
	}

	// Handle functions
	if (isFunctionNode(node)) {
		const processedArgs = node.args.map((arg: ASTNode) =>
			processNode(arg, context, errors, false),
		);

		// Check for misused functions in arguments
		checkMisusedFunction(processedArgs, errors);

		// Validate function
		const attrType = validateFunction(
			node.name,
			processedArgs,
			context,
			errors,
		);

		// If this function is used as a condition expression, apply condition error checks
		if (isConditionExpression) {
			checkConditionErrors(errors);
		}

		return {
			type: "function",
			name: node.name,
			args: processedArgs,
			attrType: attrType || null,
		} as FunctionNode;
	}

	// Handle operators
	if (isOperatorNode(node)) {
		const processedArgs = node.args.map((arg: ASTNode) =>
			processNode(arg, context, errors, false),
		);

		// Validate based on operator type
		switch (node.type) {
			case "and":
			case "or":
				for (const arg of processedArgs) {
					checkMisusedSize(arg, errors);
				}
				break;
			case "not":
				checkMisusedSize(processedArgs[0], errors);
				break;
			case "=":
			case ">":
			case "<":
			case ">=":
			case "<=":
			case "<>":
				checkMisusedFunction(processedArgs, errors);
				checkDistinct(node.type, processedArgs, errors);
				checkConditionErrors(errors);
				break;
			case "between":
				checkMisusedFunction(processedArgs, errors);
				checkBetweenArgs(processedArgs[1], processedArgs[2], context, errors);
				checkConditionErrors(errors);
				break;
			case "in":
				checkMisusedFunction(processedArgs, errors);
				checkConditionErrors(errors);
				break;
		}

		return {
			type: node.type,
			args: processedArgs,
		} as OperatorNode;
	}

	// For any other node type, recursively process its properties
	const result: Record<string, unknown> = { ...node };
	for (const key in result) {
		if (key !== "type" && Object.hasOwn(result, key)) {
			result[key] = processNode(result[key] as ASTNode, context, errors, false);
		}
	}

	return result as ASTNode;
}

// Type guards
function isAttributeValueNode(node: unknown): node is AttributeValueNode {
	return (
		typeof node === "object" &&
		node !== null &&
		"type" in node &&
		node.type === "AttributeValue"
	);
}

function isPathExpression(node: unknown): node is PathExpression {
	return (
		typeof node === "object" &&
		node !== null &&
		"type" in node &&
		node.type === "PathExpression"
	);
}

function isFunctionNode(node: unknown): node is FunctionNode {
	return (
		typeof node === "object" &&
		node !== null &&
		"type" in node &&
		node.type === "function"
	);
}

function isOperatorNode(node: unknown): node is OperatorNode {
	return (
		typeof node === "object" &&
		node !== null &&
		"type" in node &&
		"args" in node &&
		typeof node.type === "string" &&
		[
			"=",
			">",
			"<",
			">=",
			"<=",
			"<>",
			"and",
			"or",
			"not",
			"between",
			"in",
		].includes(node.type)
	);
}

function isRedundantParensNode(node: unknown): node is RedundantParensNode {
	return (
		typeof node === "object" &&
		node !== null &&
		"type" in node &&
		node.type === "redundantParens"
	);
}

function isAttributeValue(node: unknown): node is AttributeValue {
	if (typeof node !== "object" || node === null || Array.isArray(node)) {
		return false;
	}
	const attributeTypes = [
		"S",
		"N",
		"B",
		"SS",
		"NS",
		"BS",
		"M",
		"L",
		"NULL",
		"BOOL",
	];
	return attributeTypes.some((type) => type in node);
}

function resolveAttrName(
	name: string,
	context: ValidationContext,
	errors: ValidationErrors,
): string | undefined {
	if (errors.attrNameVal) {
		return undefined;
	}
	if (!context.attrNames || !context.attrNames[name]) {
		errors.attrNameVal = `An expression attribute name used in the document path is not defined; attribute name: ${name}`;
		return undefined;
	}
	return context.attrNames[name];
}

function resolveAttrVal(
	name: string,
	context: ValidationContext,
	errors: ValidationErrors,
): AttributeValue | undefined {
	if (errors.attrNameVal) {
		return undefined;
	}
	if (!context.attrVals || !context.attrVals[name]) {
		errors.attrNameVal = `An expression attribute value used in expression is not defined; attribute value: ${name}`;
		return undefined;
	}
	return context.attrVals[name];
}

function validateFunction(
	name: string,
	args: ASTNode[],
	context: ValidationContext,
	errors: ValidationErrors,
): string | undefined {
	if (errors.unknownFunction) {
		return undefined;
	}

	const functions: Record<string, number> = {
		attribute_exists: 1,
		attribute_not_exists: 1,
		attribute_type: 2,
		begins_with: 2,
		contains: 2,
		size: 1,
	};

	const numOperands = functions[name];
	if (numOperands == null) {
		errors.unknownFunction = `Invalid function name; function: ${name}`;
		return undefined;
	}

	if (errors.operand) {
		return undefined;
	}
	if (numOperands !== args.length) {
		errors.operand = `Incorrect number of operands for operator or function; operator or function: ${name}, number of operands: ${args.length}`;
		return undefined;
	}

	checkDistinct(name, args, errors);

	if (errors.function) {
		return undefined;
	}

	switch (name) {
		case "attribute_exists":
		case "attribute_not_exists":
			if (!isPathExpression(args[0])) {
				errors.function = `Operator or function requires a document path; operator or function: ${name}`;
				return undefined;
			}
			return getType(args[1], context) || undefined;
		case "begins_with":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i], context);
				if (type && type !== "S" && type !== "B") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return undefined;
				}
			}
			return "BOOL";
		case "attribute_type": {
			const type = getType(args[1], context);
			if (type !== "S") {
				errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type || "{NS,SS,L,BS,N,M,B,BOOL,NULL,S}"}`;
				return undefined;
			}

			// Resolve AttributeValueNode to actual value for validation
			let attrVal = args[1] as AttributeValue;
			if (isAttributeValueNode(args[1])) {
				const tempErrors: ValidationErrors = {};
				const resolved = resolveAttrVal(args[1].name, context, tempErrors);
				if (tempErrors.attrNameVal) return undefined;
				attrVal = resolved as AttributeValue;
			}

			if (
				!["S", "N", "B", "NULL", "SS", "BOOL", "L", "BS", "NS", "M"].includes(
					attrVal.S || "",
				)
			) {
				errors.function = `Invalid attribute type name found; type: ${attrVal.S}, valid types: {B,NULL,SS,BOOL,L,BS,N,NS,S,M}`;
				return undefined;
			}
			return "BOOL";
		}
		case "size": {
			const type = getType(args[0], context);
			if (["N", "BOOL", "NULL"].includes(type as string)) {
				errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
				return undefined;
			}
			return "N";
		}
		case "contains":
			return "BOOL";
	}
}

function checkMisusedFunction(args: ASTNode[], errors: ValidationErrors) {
	if (errors.misusedFunction) {
		return;
	}
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (isFunctionNode(arg) && arg.name !== "size") {
			errors.misusedFunction = `The function is not allowed to be used this way in an expression; function: ${arg.name}`;
			return;
		}
	}
}

function checkMisusedSize(expr: ASTNode, errors: ValidationErrors) {
	if (isFunctionNode(expr) && expr.name === "size" && !errors.misusedFunction) {
		errors.misusedFunction = `The function is not allowed to be used this way in an expression; function: ${expr.name}`;
	}
}

function checkDistinct(
	name: string,
	args: ASTNode[],
	errors: ValidationErrors,
) {
	if (
		errors.distinct ||
		args.length !== 2 ||
		!isPathExpression(args[0]) ||
		!isPathExpression(args[1])
	) {
		return;
	}

	const path1 = args[0] as PathExpression;
	const path2 = args[1] as PathExpression;

	// Compare segments for equality
	if (path1.segments.length !== path2.segments.length) {
		return;
	}

	for (let i = 0; i < path1.segments.length; i++) {
		const seg1 = path1.segments[i];
		const seg2 = path2.segments[i];

		if (seg1.isArrayIndex !== seg2.isArrayIndex) {
			return;
		}

		if (seg1.value() !== seg2.value()) {
			return;
		}
	}

	errors.distinct = `The first operand must be distinct from the remaining operands for this operator or function; operator: ${name}, first operand: ${pathToString(path1)}`;
}

function checkBetweenArgs(
	x: ASTNode,
	y: ASTNode,
	context: ValidationContext,
	errors: ValidationErrors,
) {
	if (errors.function) {
		return;
	}

	// Resolve AttributeValueNode to actual values for comparison
	let xResolved = x;
	let yResolved = y;

	if (isAttributeValueNode(x)) {
		const tempErrors: ValidationErrors = {};
		const resolved = resolveAttrVal(x.name, context, tempErrors);
		if (tempErrors.attrNameVal || !resolved) return;
		xResolved = resolved as ASTNode;
	}

	if (isAttributeValueNode(y)) {
		const tempErrors: ValidationErrors = {};
		const resolved = resolveAttrVal(y.name, context, tempErrors);
		if (tempErrors.attrNameVal || !resolved) return;
		yResolved = resolved as ASTNode;
	}

	const type1 = getImmediateType(xResolved);
	const type2 = getImmediateType(yResolved);
	if (type1 && type2) {
		if (type1 !== type2) {
			const xVal = xResolved as AttributeValue;
			const yVal = yResolved as AttributeValue;
			errors.function = `The BETWEEN operator requires same data type for lower and upper bounds; lower bound operand: AttributeValue: {${type1}:${xVal[type1 as keyof AttributeValue]}}, upper bound operand: AttributeValue: {${type2}:${yVal[type2 as keyof AttributeValue]}}`;
		} else if (
			isAttributeValue(xResolved) &&
			isAttributeValue(yResolved) &&
			context.compare("GT", xResolved, yResolved)
		) {
			const xVal = xResolved as AttributeValue;
			const yVal = yResolved as AttributeValue;
			errors.function = `The BETWEEN operator requires upper bound to be greater than or equal to lower bound; lower bound operand: AttributeValue: {${type1}:${xVal[type1 as keyof AttributeValue]}}, upper bound operand: AttributeValue: {${type2}:${yVal[type2 as keyof AttributeValue]}}`;
		}
	}
}

function pathStr(path: (string | number)[]): string {
	return `[${path
		.map((piece) => (typeof piece === "number" ? `[${piece}]` : piece))
		.join(", ")}]`;
}

function pathToString(pathExpr: PathExpression): string {
	return `[${pathExpr.segments.map((seg) => seg.toString()).join(", ")}]`;
}

function getType(val: ASTNode, context?: ValidationContext): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (isFunctionNode(val) && val.attrType) return val.attrType;
	// For AttributeValueNode, resolve the actual value to get its type
	if (isAttributeValueNode(val) && context) {
		const errors: ValidationErrors = {};
		const resolved = resolveAttrVal(val.name, context, errors);
		if (resolved && !errors.attrNameVal) {
			return getImmediateType(resolved);
		}
		return null;
	}
	return getImmediateType(val);
}

function getImmediateType(val: ASTNode): string | null {
	if (
		!val ||
		typeof val !== "object" ||
		Array.isArray(val) ||
		(isFunctionNode(val) && val.attrType)
	)
		return null;

	if (!isAttributeValue(val)) {
		return null;
	}

	const types = [
		"S",
		"N",
		"B",
		"NULL",
		"BOOL",
		"SS",
		"NS",
		"BS",
		"L",
		"M",
	] as const;

	for (const type of types) {
		if (type in val && val[type] != null) return type;
	}
	return null;
}

function checkConditionErrors(errors: ValidationErrors) {
	if (errors.condition) {
		return;
	}
	const errorOrder = [
		"attrNameVal",
		"operand",
		"distinct",
		"function",
	] as const;
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) {
			errors.condition = errors[errorOrder[i]];
			return;
		}
	}
}

function checkErrors(errors: ValidationErrors): string | null {
	const errorOrder = [
		"parens",
		"unknownFunction",
		"misusedFunction",
		"reserved",
		"condition",
	] as const;
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) return errors[errorOrder[i]] as string;
	}
	return null;
}
