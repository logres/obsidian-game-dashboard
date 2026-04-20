import { App, CachedMetadata, TAbstractFile, TFile, TFolder } from "obsidian";
import { GameDashboardSettings, GameEntry } from "./types";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

function asFolder(file: TAbstractFile | null): TFolder | null {
  return file instanceof TFolder ? file : null;
}

function collectDirectMarkdownFiles(folder: TFolder): TFile[] {
  return folder.children.filter(
    (child): child is TFile => child instanceof TFile && child.extension === "md"
  );
}

function collectImageFiles(folder: TFolder): TFile[] {
  const files: TFile[] = [];
  const stack: TFolder[] = [folder];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const child of current.children) {
      if (child instanceof TFolder) {
        stack.push(child);
      } else if (child instanceof TFile && IMAGE_EXTENSIONS.has(child.extension.toLowerCase())) {
        files.push(child);
      }
    }
  }

  return files;
}

function metadataValue(cache: CachedMetadata | null | undefined, key: string): string {
  const value = cache?.frontmatter?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function fileMtime(file: TFile | null | undefined): number {
  return file?.stat?.mtime ?? 0;
}

function resolveImageFile(app: App, folder: TFolder, mainFile: TFile | null, field: string): TFile | null {
  const cache = mainFile ? app.metadataCache.getFileCache(mainFile) : null;
  const imageValue = cache?.frontmatter?.[field];

  if (typeof imageValue === "string" && imageValue.trim().length > 0) {
    const cleaned = imageValue.replace(/^\[\[/, "").replace(/\]\]$/, "");
    const resolved = app.metadataCache.getFirstLinkpathDest(cleaned, mainFile?.path ?? folder.path);
    if (resolved) return resolved;
  }

  return null;
}

function resolvePosterFile(app: App, folder: TFolder, mainFile: TFile | null): TFile | null {
  const explicitPoster =
    resolveImageFile(app, folder, mainFile, "poster") ??
    resolveImageFile(app, folder, mainFile, "cover");
  if (explicitPoster) return explicitPoster;
  const [firstImage] = collectImageFiles(folder);
  return firstImage ?? null;
}

function resolveBannerFile(app: App, folder: TFolder, mainFile: TFile | null, posterFile: TFile | null): TFile | null {
  const explicitBanner = resolveImageFile(app, folder, mainFile, "banner");
  if (explicitBanner) return explicitBanner;
  const images = collectImageFiles(folder);
  return images.find((file) => !posterFile || file.path !== posterFile.path) ?? posterFile ?? null;
}

export async function indexGames(app: App, settings: GameDashboardSettings): Promise<GameEntry[]> {
  const rootFolder = asFolder(app.vault.getAbstractFileByPath(settings.gamesRoot));
  if (!rootFolder) return [];

  const gameFolders = rootFolder.children.filter((child): child is TFolder => child instanceof TFolder);

  const entries = gameFolders.map((folder) => {
    const markdownFiles = collectDirectMarkdownFiles(folder);
    const mainFile = markdownFiles.find((file) => file.name === settings.mainNoteName) ?? markdownFiles[0] ?? null;
    const notes = markdownFiles.filter((file) => mainFile == null || file.path !== mainFile.path);
    const cache = mainFile ? app.metadataCache.getFileCache(mainFile) : null;
    const relativePath = folder.path.startsWith(rootFolder.path)
      ? folder.path.slice(rootFolder.path.length + 1)
      : folder.path;
    const updatedAt = Math.max(0, ...markdownFiles.map((file) => fileMtime(file)));

    const posterFile = resolvePosterFile(app, folder, mainFile);
    const bannerFile = resolveBannerFile(app, folder, mainFile, posterFile);

    return {
      folder,
      mainFile,
      notes,
      posterFile,
      bannerFile,
      relativePath,
      title: metadataValue(cache, "media_title") || metadataValue(cache, "title") || mainFile?.basename || folder.name,
      status: metadataValue(cache, "status") || "unsorted",
      developer: metadataValue(cache, "developer") || "",
      platform: metadataValue(cache, "platform") || "",
      year: metadataValue(cache, "year") || "",
      progress: metadataValue(cache, "progress") || "",
      rating: metadataValue(cache, "rating") || "",
      summary: metadataValue(cache, "summary") || "",
      officialUrl: metadataValue(cache, "official_url") || "",
      detailUrl: metadataValue(cache, "detail_url") || "",
      steamUrl: metadataValue(cache, "steam_url") || "",
      igdbUrl: metadataValue(cache, "igdb_url") || "",
      updatedAt,
      noteCount: notes.length
    } satisfies GameEntry;
  });

  return entries.sort((left, right) => {
    if (left.updatedAt !== right.updatedAt) return right.updatedAt - left.updatedAt;
    return left.title.localeCompare(right.title, "zh-Hans-CN");
  });
}
