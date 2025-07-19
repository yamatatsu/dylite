export function toUint8Array(str: string): Uint8Array {
	return Uint8Array.from(Buffer.from(str));
}
