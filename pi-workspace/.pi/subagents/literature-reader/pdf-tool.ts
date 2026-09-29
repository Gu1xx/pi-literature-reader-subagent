import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const DEFAULT_PYTHON =
	"C:\\Users\\Gu1xx\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const SCRIPT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "extract_pdf.py");
const MAX_OUTPUT_BYTES = 800 * 1024;

const paramsSchema = Type.Object({
	path: Type.String({ description: "PDF path, absolute or relative to the delegated working directory" }),
	start_page: Type.Optional(Type.Integer({ minimum: 1, description: "First page to extract, 1-based" })),
	end_page: Type.Optional(Type.Integer({ minimum: 1, description: "Last page to extract, inclusive" })),
});

function isWithin(root: string, candidate: string): boolean {
	const relative = path.relative(root, candidate);
	return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", (event) => {
		// Defense in depth: discard ambient prompt additions and retain only this agent's declared skill/tools.
		event.systemPromptOptions.appendSystemPrompt = "";
		event.systemPromptOptions.contextFiles = [];
		event.systemPromptOptions.skills = event.systemPromptOptions.skills.filter(
			(skill) => skill.name === "literature-reading",
		);
		event.systemPromptOptions.selectedTools = event.systemPromptOptions.selectedTools.filter((tool) =>
			["read", "grep", "find", "ls", "extract_pdf"].includes(tool),
		);
	});

	pi.registerTool({
		name: "extract_pdf",
		label: "Extract PDF text",
		description: "Read a page range from a local PDF without modifying it. Returns page-numbered text.",
		parameters: paramsSchema,
		async execute(_toolCallId, params, signal) {
			const allowedRoot = path.resolve(process.env.PI_LITERATURE_ROOT || process.cwd());
			const absolutePath = path.resolve(allowedRoot, params.path);
			if (!isWithin(allowedRoot, absolutePath)) {
				throw new Error(`PDF must be inside the delegated working directory: ${allowedRoot}`);
			}
			if (path.extname(absolutePath).toLowerCase() !== ".pdf") {
				throw new Error("extract_pdf only accepts .pdf files");
			}
			if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
				throw new Error(`PDF not found: ${absolutePath}`);
			}
			if (params.end_page && params.start_page && params.end_page < params.start_page) {
				throw new Error("end_page must be greater than or equal to start_page");
			}

			const python = process.env.PI_PDF_PYTHON || DEFAULT_PYTHON;
			const args = [SCRIPT_PATH, absolutePath];
			if (params.start_page) args.push("--start", String(params.start_page));
			if (params.end_page) args.push("--end", String(params.end_page));

			const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
				const child = spawn(python, args, { shell: false, windowsHide: true });
				let stdout = "";
				let stderr = "";
				let overflow = false;
				const abort = () => child.kill();
				signal?.addEventListener("abort", abort, { once: true });

				child.stdout.on("data", (chunk) => {
					if (overflow) return;
					stdout += chunk.toString("utf8");
					if (Buffer.byteLength(stdout, "utf8") > MAX_OUTPUT_BYTES) {
						overflow = true;
						child.kill();
					}
				});
				child.stderr.on("data", (chunk) => {
					stderr += chunk.toString("utf8");
				});
				child.on("error", reject);
				child.on("close", (code) => {
					signal?.removeEventListener("abort", abort);
					if (overflow) return reject(new Error("PDF extraction exceeded 800 KiB; request a smaller page range"));
					resolve({ stdout, stderr, code: code ?? 1 });
				});
			});

			if (result.code !== 0) throw new Error(result.stderr.trim() || `PDF extraction failed (${result.code})`);
			return {
				content: [{ type: "text", text: result.stdout || "No extractable text was found in this page range." }],
				details: { path: absolutePath, startPage: params.start_page ?? 1, endPage: params.end_page },
			};
		},
	});
}
