import {
	OverlappedPathError,
	PathConflictError,
	ReservedKeywordError,
	UnresolvableAttributeNameError,
} from "./AstError";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class ProjectionExpression implements IAstNode {
	readonly type = "ProjectionExpression";

	constructor(public readonly paths: PathExpression[]) {}

	traverse(visitor: (node: PathExpression) => void): void {
		for (const path of this.paths) {
			path.traverse(visitor);
		}
	}

	validate(): void {
		this.validateReservedKeywords();
		this.validatePathResolvability();
		this.validateOverlappedPaths();
		this.validatePathConflicts();
	}

	private validateReservedKeywords(): void {
		for (const path of this.paths) {
			const reserved = path.getReservedWord();
			if (reserved) {
				throw new ReservedKeywordError(reserved.value());
			}
		}
	}

	private validatePathResolvability(): void {
		for (const path of this.paths) {
			const unresolvableAlias = path.getUnresolvableAlias();
			if (unresolvableAlias) {
				throw new UnresolvableAttributeNameError(unresolvableAlias.toString());
			}
		}
	}

	private validateOverlappedPaths(): void {
		const pairs = this.getCombinations(this.paths);
		for (const [path1, path2] of pairs) {
			if (path1.isOverlappedOf(path2)) {
				throw new OverlappedPathError(path1.toString(), path2.toString());
			}
		}
	}

	private validatePathConflicts(): void {
		const pairs = this.getCombinations(this.paths);
		for (const [path1, path2] of pairs) {
			if (path1.isConflictWith(path2)) {
				throw new PathConflictError(path1.toString(), path2.toString());
			}
		}
	}

	/**
	 * Generates all unique pairs (combinations) of elements from a single array.
	 *
	 * @example
	 * const numbers = [1, 2, 3];
	 * const combinations = getCombinations(numbers);
	 * // Expected output: [[1, 2], [1, 3], [2, 3]]
	 *
	 * @example
	 * const letters = ['a', 'b', 'c', 'd'];
	 * const letterCombinations = getCombinations(letters);
	 * // Expected output:
	 * // [
	 * //   ['a', 'b'], ['a', 'c'], ['a', 'd'],
	 * //   ['b', 'c'], ['b', 'd'],
	 * //   ['c', 'd']
	 * // ]
	 *
	 * @example
	 * const singleElement = ['only'];
	 * const emptyCombinations = getCombinations(singleElement);
	 * // Expected output: []
	 *
	 * @example
	 * const emptyArray = [];
	 * const anotherEmptyCombinations = getCombinations(emptyArray);
	 * // Expected output: []
	 */
	private getCombinations<T>(arr: T[]): [T, T][] {
		const result: [T, T][] = [];

		for (let i = 0; i < arr.length; i++) {
			for (let j = i + 1; j < arr.length; j++) {
				result.push([arr[i], arr[j]]);
			}
		}

		return result;
	}
}
