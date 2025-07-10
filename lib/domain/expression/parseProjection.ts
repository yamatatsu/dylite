import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import isReserved from "./isReserved";
import projectionParser from "./projection-grammar";

// AST Types
interface ProjectionExpression {
	type: "ProjectionExpression";
	paths: PathExpression[];
}

interface PathExpression {
	type: "PathExpression";
	segments: PathSegment[];
}

type PathSegment = IdentifierSegment | ArrayIndexSegment | AliasSegment;

interface IdentifierSegment {
	type: "Identifier";
	name: string;
}

interface ArrayIndexSegment {
	type: "ArrayIndex";
	index: number;
}

interface AliasSegment {
	type: "Alias";
	name: string;
}

export function parseProjection(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
	},
) {
	const context = {
		attrNames: options.ExpressionAttributeNames,
		/**
		 * Before parsing, it have all ExpressionAttributeNames.
		 * After parsing, attribute name used in the expression will be removed from this object.
		 */
		unusedAttrNames: replaceRecordValueToTrue(options.ExpressionAttributeNames),
		isReserved,
	};

	// Parse to AST
	let ast: ProjectionExpression;
	ast = projectionParser.parse(expression, { context });

	// Validate and transform AST
	const errors: {
		reserved?: string;
		attrNameVal?: string;
		pathOverlap?: string;
		pathConflict?: string;
	} = {};

	const paths: (string | number)[][] = [];
	const nestedPaths: Record<string, boolean> = Object.create(null);

	// Process each path
	for (const pathExpr of ast.paths) {
		const path: (string | number)[] = [];

		// Process segments
		for (const segment of pathExpr.segments) {
			if (segment.type === "Identifier") {
				// Check for reserved words
				if (!errors.reserved && isReserved(segment.name)) {
					errors.reserved = `Attribute name is a reserved keyword; reserved keyword: ${segment.name}`;
				}
				path.push(segment.name);
			} else if (segment.type === "Alias") {
				// Resolve alias
				if (!errors.attrNameVal) {
					const attrName = context.attrNames?.[segment.name];
					if (!attrName) {
						errors.attrNameVal = `An expression attribute name used in the document path is not defined; attribute name: ${segment.name}`;
					} else {
						delete context.unusedAttrNames[segment.name];
						path.push(attrName);
					}
				} else {
					// If there's already an error, just push empty to maintain path structure
					path.push("");
				}
			} else if (segment.type === "ArrayIndex") {
				path.push(segment.index);
			}
		}

		// Check for path conflicts/overlaps
		if (!errors.pathOverlap && !errors.pathConflict) {
			checkPath(path, paths, errors);
		}

		paths.push(path);

		// Track nested paths
		if (path.length > 1) {
			nestedPaths[path[0] as string] = true;
		}
	}

	// Check errors in order
	const errorOrder: (keyof typeof errors)[] = [
		"reserved",
		"attrNameVal",
		"pathOverlap",
		"pathConflict",
	];
	for (const errorKey of errorOrder) {
		if (errors[errorKey]) {
			return errors[errorKey];
		}
	}

	return { paths, nestedPaths };
}

function checkPath(
	newPath: (string | number)[],
	existingPaths: (string | number)[][],
	errors: {
		pathOverlap?: string;
		pathConflict?: string;
	},
) {
	for (const existingPath of existingPaths) {
		checkPaths(existingPath, newPath, errors);
		if (errors.pathOverlap || errors.pathConflict) {
			return;
		}
	}
}

function checkPaths(
	path1: (string | number)[],
	path2: (string | number)[],
	errors: {
		pathOverlap?: string;
		pathConflict?: string;
	},
) {
	for (let i = 0; i < path1.length && i < path2.length; i++) {
		if (typeof path1[i] !== typeof path2[i]) {
			errors.pathConflict = `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
			return;
		}
		if (path1[i] !== path2[i]) return;
	}

	errors.pathOverlap = `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
}

function pathStr(path: (string | number)[]): string {
	return `[${path
		.map((piece) => {
			return typeof piece === "number" ? `[${piece}]` : piece;
		})
		.join(", ")}]`;
}

///////////////////
// libs

function replaceRecordValueToTrue(
	record: Record<string, unknown> | undefined | null,
): Record<string, boolean> {
	if (!record) {
		return {};
	}
	return Object.keys(record).reduce(
		(acc, key) => {
			acc[key] = true;
			return acc;
		},
		{} as Record<string, boolean>,
	);
}
