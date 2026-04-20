import esbuild from "esbuild";
import process from "process";
import { pathToFileURL } from "url";

export function createBuildOptions({ watch = false, plugins = [] } = {}) {
  return {
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian", "electron"],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: watch ? "inline" : false,
    treeShaking: true,
    outfile: "main.js",
    plugins
  };
}

export async function runBuild({ watch = false, plugins = [] } = {}) {
  const context = await esbuild.context(createBuildOptions({ watch, plugins }));

  if (watch) {
    await context.watch();
    return context;
  }

  await context.rebuild();
  await context.dispose();
  return null;
}

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const watch = process.argv.includes("--watch");
  await runBuild({ watch });
}
