import { Plugin, rpc, type RpcServer } from "@ptah-sh/dualshock";
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
					.fn(async ({ args, context }) => {
						return server.registry()[args.name].fn(args.args, context);
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
