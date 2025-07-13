import type { PathSegment } from "./PathSegment";

export class PathExpression {
	public readonly type = "PathExpression";

	constructor(public readonly segments: PathSegment[]) {}

	getReservedWord(): PathSegment | undefined {
		for (const segment of this.segments) {
			if (segment.type === "Identifier" && segment.isReserved()) {
				return segment;
			}
		}
	}

	getUnresolvableAlias(): PathSegment | undefined {
		for (const segment of this.segments) {
			if (segment.type === "Alias" && segment.isUnresolvable()) {
				return segment;
			}
		}
	}

	/**
	 * returns true if this path expression has the same prefix as the other path expression.
	 * This means that the first n segments of both paths are equal.
	 *
	 * e.g.
	 *   this: [a, b, c]
	 *   other: [a, b]
	 *   returns true
	 *
	 * e.g.
	 *   this: [a, b]
	 *   other: [a, b, c]
	 *   returns true
	 *
	 * e.g.
	 *   this: [a, b, c]
	 *   other: [a, b, d]
	 *   returns false
	 */
	isOverlappedOf(other: PathExpression): boolean {
		for (let i = 0; i < this.size() && i < other.size(); i++) {
			if (this.segments[i].value() !== other.segments[i].value()) {
				return false;
			}
		}
		return true;
	}

	/**
	 * returns true if this path expression conflicts with the other path expression.
	 * This means that the first n segments of both paths are equal, but the last segment
	 * is different in terms of array index.
	 *
	 * e.g.
	 *   this: [a, b]
	 *   other: [a, 0]
	 *   returns true
	 *
	 * e.g.
	 *   this: [a, 0]
	 *   other: [a, 1]
	 *   returns false
	 */
	isConflictWith(other: PathExpression): boolean {
		for (let i = 0; i < this.size() && i < other.size(); i++) {
			if (this.segments[i].isArrayIndex !== other.segments[i].isArrayIndex) {
				return true;
			}
			if (this.segments[i].value() !== other.segments[i].value()) {
				return false;
			}
		}
		return false;
	}

	at(index: number): PathSegment | undefined {
		return this.segments[index];
	}

	size(): number {
		return this.segments.length;
	}

	toString(): string {
		return `[${this.segments.map((seg) => seg.toString()).join(", ")}]`;
	}
}
