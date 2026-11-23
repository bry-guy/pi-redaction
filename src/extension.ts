// pi-redaction: best-effort secret redaction in every session, with or without a project, role or sandbox.
import { createLocalBashOperations, SettingsManager, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { guardWrite, lineFilter, redact, redactMessages, redactToolResult, rememberSecret } from "./redact.ts";

// For other extensions: redact text, or register a value to redact (pi-secret-broker does, for role secrets).
(globalThis as any)[Symbol.for("pi-redaction.v1")] = { redact, rememberSecret };

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", (e) => redactToolResult(e));
	pi.on("context", (e) => {
		const messages = redactMessages(e.messages);
		return messages === e.messages ? undefined : { messages };
	});
	pi.on("tool_call", (e) => guardWrite(e.toolName, e.input as Record<string, unknown>));
	// `!command` output: pi's own local shell, with output filtered. The first user_bash handler that returns wins, so
	// an extension that needs to run `!` commands elsewhere must load before this one.
	pi.on("user_bash", (e) => {
		const local = createLocalBashOperations({ shellPath: SettingsManager.create(e.cwd).getShellPath() });
		return {
			operations: {
				exec: (command, cwd, o) => {
					const f = lineFilter(o.onData);
					return local.exec(command, cwd, { ...o, onData: f.push }).finally(f.end);
				},
			},
		};
	});
}
