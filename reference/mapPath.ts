import type { AttributeValue, Item } from "./types";

export function mapPath(path: string[], item: Item): AttributeValue | null {
	if (path.length === 1) {
		return item[path[0]] ?? null;
	}
	let resolved: { M: Item; L?: AttributeValue[] } | AttributeValue | null = {
		M: item,
	};
	for (let i = 0; i < path.length; i++) {
		const piece = path[i];
		if (typeof piece === "number" && resolved.L) {
			resolved = resolved.L[piece];
		} else if (resolved.M) {
			resolved = resolved.M[piece];
		} else {
			resolved = null;
		}
		if (resolved == null) {
			break;
		}
	}
	return resolved;
}
