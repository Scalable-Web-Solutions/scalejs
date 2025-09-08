import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

// Tailwind entry (robust on Windows/macOS/Linux)
function resolveTailwindCli(): string {
  // Tailwind v3+: CLI file lives here
  return require.resolve("tailwindcss/lib/cli.js");
}

const BASE_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

function extractSafelist(template: string): string[] {
  const m = template.match(/<!--\s*tw:safelist\s+([^>]+?)\s*-->/);
  return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

export async function buildTwForTemplate(templateHtml: string): Promise<string> {
  const safelist = extractSafelist(templateHtml);

  const tmpDir  = await fs.mkdtemp(path.join(os.tmpdir(), "scalejs-tw-"));
  const html    = path.join(tmpDir, "in.html");
  const inCss   = path.join(tmpDir, "in.css");
  const outCss  = path.join(tmpDir, "out.css");
  const cfgPath = path.join(tmpDir, "tailwind.config.cjs");

  await fs.writeFile(html, templateHtml, "utf8");
  await fs.writeFile(inCss, BASE_CSS, "utf8");
  await fs.writeFile(
    cfgPath,
    `module.exports = {
      content: ["${html.replace(/\\/g, "\\\\")}"],
      theme: { extend: {} },
      safelist: ${JSON.stringify(safelist)},
      // corePlugins: { preflight: false }, // uncomment if you don't want resets in shadow DOM
    }`,
    "utf8"
  );

  const cli = resolveTailwindCli();

  // Run: node <tailwind-cli.js> -i in.css -c tailwind.config.cjs -o out.css --minify
  await execFileAsync(
    process.execPath,
    [cli, "-i", inCss, "-c", cfgPath, "-o", outCss, "--minify"],
    { cwd: tmpDir, windowsHide: true }
  );

  const css = await fs.readFile(outCss, "utf8");
  return css;
}
