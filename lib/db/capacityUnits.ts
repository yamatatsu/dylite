import { itemSize } from "./itemSize";
import type { Item } from "./types";

export function capacityUnits(
	item: Item | null,
	isRead: boolean,
	isConsistent: boolean,
): number {
	const size = item ? Math.ceil(itemSize(item) / 1024 / (isRead ? 4 : 1)) : 1;
	return size / (!isRead || isConsistent ? 1 : 2);
}
