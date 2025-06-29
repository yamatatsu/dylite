import { randomUUID } from "node:crypto";

export function getMetadata() {
	return {
		attempts: 1,
		cfId: undefined,
		extendedRequestId: undefined,
		httpStatusCode: 200,
		requestId: randomUUID(),
		totalRetryDelay: 0,
	};
}
