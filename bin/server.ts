import { type ServerType, serve } from "@hono/node-server";
import createApp from "../lib/app";

export class NodeServer {
	private server: ServerType | undefined;

	async listen(opts: { port?: number | string }) {
		const app = createApp();

		await new Promise((resolve) => {
			this.server = serve(
				{
					fetch: app.fetch,
					port: opts?.port ? Number(opts?.port) : undefined,
				},
				() => {
					resolve(undefined);
				},
			);
		});
	}

	async close() {
		await new Promise((resolve) => {
			this.server?.close(() => {
				resolve(undefined);
			});
		});
	}
}
