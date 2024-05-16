import { Plugin, emits, rpc, type RpcServer } from "@ptah-sh/dualshock";
import { z } from "zod";

export class DualshockDebugPlugin extends Plugin<RpcServer> {
	constructor() {
		super("@ptah-sh/dualshock-plugin-debug");
	}

	async setup(server: RpcServer): Promise<void> {
		const registry = server.registry();

		server
			.ns("debug")
			.ns("server")
			.ns("clients")
			.emits(
				"connected",
				emits().payload(z.object({ connectionId: z.string() })),
			);
		// .emits(
		// 	"disconnected",
		// 	emits().payload(z.object({ connectionId: z.string() })),
		// );

		server.onConnection((connectionId) => {
			server.broadcast("debug:server:clients:connected", { connectionId });
		});

		server
			.ns("debug")
			.ns("server")
			.ns("rpc")
			.rpc(
				"invoke",
				rpc()
					.args(
						z.object({
							name: z.enum(Object.keys(registry) as [string, ...string[]]),
							args: z.any(),
							context: z.any(),
						}),
					)
					.returns(z.any())
					.fn(async ({ args, name, context }) => {
						// TODO: reuse server's logic to call the handler. Need to run all the same validation steps.
						const handler = registry[name];

						await handler.args.parseAsync(args);

						return handler.fn(args, context);
					}),
			);

		server
			.ns("debug")
			.ns("client")
			.ns("rpc")
			.rpc(
				"invoke",
				rpc()
					.args(
						z.object({
							connectionId: z.string().refine((s) => s in server.connections, {
								message: "Connection not found",
							}),
							name: z.string().min(1),
							args: z.any(),
						}),
					)
					.returns(z.any())
					.fn(async ({ connectionId, name, args }) => {
						return server.connections[connectionId].invoke(name, args);
					}),
			);
	}
}
