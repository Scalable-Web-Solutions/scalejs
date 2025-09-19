import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { astToHtml } from "./astToHtml.js"; // keep .js if your runtime expects ESM file extensions

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const BASE_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

type TailwindPkgBin =
  | string
  | {
      tailwindcss?: string;
      [k: string]: string | undefined;
    };

interface TailwindPkgJson {
  bin?: TailwindPkgBin;
}

/**
 * Resolve the Tailwind CLI from the current project.
 */
async function resolveTailwindCli(): Promise<string> {
  const cwd = process.cwd();

  try {
    const pkgJsonPath = require.resolve("tailwindcss/package.json", { paths: [cwd] });
    const pkgDir = path.dirname(pkgJsonPath);
    const pkgRaw = await fs.readFile(pkgJsonPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as TailwindPkgJson;

    let binRel: string | undefined;
    if (typeof pkg.bin === "string") {
      binRel = pkg.bin;
    } else if (pkg.bin && typeof pkg.bin === "object") {
      binRel = pkg.bin.tailwindcss ?? Object.values(pkg.bin)[0];
    }
    if (!binRel) {
      throw new Error('No "bin" entry found in tailwindcss/package.json');
    }

    return path.join(pkgDir, binRel);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    try {
      // Historical path (older Tailwind versions)
      return require.resolve("tailwindcss/lib/cli.js", { paths: [cwd] });
    } catch {
      const tip = [
        "Tailwind CSS was not found in this project.",
        "Install it locally and re-run your command:",
        "  pnpm add -D tailwindcss",
        "  # or npm i -D tailwindcss",
        "  # or yarn add -D tailwindcss",
      ].join("\n");
      throw new Error(`${err.message}\n${tip}`);
    }
  }
}

/**
 * Pulls a safelist from an HTML comment:
 * <!-- tw:safelist class1 class2 ... -->
 */
function extractSafelist(template: string): string[] {
  const m = template.match(/<!--\s*tw:safelist\s+([^>]+?)\s*-->/);
  return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

/**
 * Convert your AST to HTML, then build Tailwind for it.
 * If you have a concrete AST type, replace `unknown` below.
 */
export async function buildTailwindFromAst(ast: unknown): Promise<string> {
  const templateHtml = astToHtml(ast as any);
  return buildTwForTemplate(templateHtml);
}

/**
 * Build Tailwind CSS for a given HTML template string.
 */
export async function buildTwForTemplate(templateHtml: string): Promise<string> {
  const safelist = extractSafelist(templateHtml);
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "scalejs-tw-"));
  const html = path.join(tmpDir, "in.html");
  const inCss = path.join(tmpDir, "in.css");
  const outCss = path.join(tmpDir, "out.css");
  const cfgPath = path.join(tmpDir, "tailwind.config.cjs");

  await fs.writeFile(html, templateHtml, "utf8");
  await fs.writeFile(inCss, BASE_CSS, "utf8");

  const cfg = `module.exports = {
  content: ["${html.replace(/\\/g, "\\\\")}"],
  theme: { extend: {} },
  safelist: ${JSON.stringify(safelist)},
  // corePlugins: { preflight: false }, // uncomment if you don't want resets in shadow DOM
}`;
  await fs.writeFile(cfgPath, cfg, "utf8");

  const cli = await resolveTailwindCli();

  await execFileAsync(process.execPath, [cli, "-i", inCss, "-c", cfgPath, "-o", outCss, "--minify"], {
    cwd: tmpDir,
    windowsHide: true,
  });

  const css = await fs.readFile(outCss, "utf8");
  return css;
}