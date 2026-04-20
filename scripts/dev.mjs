import esbuild from "esbuild";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { copyFile, mkdir, readFile } from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import { createBuildOptions } from "../esbuild.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const once = process.argv.includes("--once");
const manifestPath = path.join(repoRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const pluginId = manifest.id;
const runtimeFiles = ["manifest.json", "main.js", "styles.css", "versions.json"];
const localConfigPath = path.join(repoRoot, "dev.config.local.json");

async function loadConfig() {
  if (existsSync(localConfigPath)) {
    return JSON.parse(await readFile(localConfigPath, "utf8"));
  }

  return {
    pluginDir: process.env.OBSIDIAN_PLUGIN_DIR,
    obsidianExe: process.env.OBSIDIAN_EXE,
    reloadAfterSync: process.env.OBSIDIAN_RELOAD !== "false"
  };
}

function resolveObsidianExe(config) {
  if (config.obsidianExe) {
    return config.obsidianExe;
  }

  const defaultPath = "C:/Program Files/Obsidian/Obsidian.exe";
  return existsSync(defaultPath) ? defaultPath : null;
}

const config = await loadConfig();

if (!config.pluginDir) {
  throw new Error(
    "Missing pluginDir. Add dev.config.local.json or set OBSIDIAN_PLUGIN_DIR."
  );
}

async function syncRuntimeFiles() {
  await mkdir(config.pluginDir, { recursive: true });

  for (const fileName of runtimeFiles) {
    const source = path.join(repoRoot, fileName);
    const destination = path.join(config.pluginDir, fileName);
    await copyFile(source, destination);
  }
}

async function reloadPlugin() {
  if (config.reloadAfterSync === false) {
    return;
  }

  const obsidianExe = resolveObsidianExe(config);
  if (!obsidianExe) {
    console.warn("No Obsidian executable found. Skip reload.");
    return;
  }

  await new Promise((resolve, reject) => {
    const child = spawn(
      obsidianExe,
      ["plugin:reload", `id=${pluginId}`],
      {
        stdio: "ignore",
        windowsHide: true
      }
    );

    child.on("error", reject);
    child.on("exit", () => resolve());
  });
}

const syncPlugin = {
  name: "sync-to-obsidian",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) {
        console.error("Build failed. Skip sync.");
        return;
      }

      try {
        await syncRuntimeFiles();
        await reloadPlugin();
        console.log(`Synced ${pluginId} to ${config.pluginDir}`);
      } catch (error) {
        console.error("Sync failed:", error);
      }
    });
  }
};

if (once) {
  await esbuild.build(createBuildOptions({ plugins: [syncPlugin] }));
} else {
  const context = await esbuild.context(
    createBuildOptions({ watch: true, plugins: [syncPlugin] })
  );
  await context.watch();
  console.log(`Watching ${pluginId}. Build -> sync -> reload active.`);
}
