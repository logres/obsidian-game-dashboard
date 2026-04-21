import { Notice, Plugin, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import { CreateGameModal } from "./createGameModal";
import { IgdbClient } from "./igdb";
import { indexGames } from "./indexer";
import { DEFAULT_SETTINGS, GameDashboardSettingTab } from "./settings";
import { CreateGameInput, GameDashboardSettings, GameEntry, GameSearchCandidate } from "./types";
import { SteamClient } from "./steam";
import { GAME_DASHBOARD_VIEW_TYPE, GameDashboardView } from "./view";

function sanitizeFolderName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

function yamlScalar(value: string): string {
  return JSON.stringify(value ?? "");
}

function yamlList(values: string[]): string {
  return `[${values.map((item) => JSON.stringify(item)).join(", ")}]`;
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}

function choosePreferred(primary: string, secondary: string): string {
  return primary || secondary;
}

function chooseLonger(primary: string, secondary: string): string {
  if (!primary) return secondary;
  if (!secondary) return primary;
  return secondary.length > primary.length ? secondary : primary;
}

function mergeLists(primary: string[], secondary: string[]): string[] {
  return [...new Set([...primary, ...secondary].filter(Boolean))];
}

function chooseBySource(
  base: GameSearchCandidate,
  extra: GameSearchCandidate,
  field: "posterUrl" | "bannerUrl",
  preferred: "steam" | "igdb"
): string {
  const preferredValue =
    base.source === preferred ? base[field] : extra.source === preferred ? extra[field] : "";
  return preferredValue || base[field] || extra[field] || "";
}

async function ensureFolder(plugin: Plugin, path: string): Promise<TFolder> {
  const normalized = path.replace(/\/+$/g, "");
  const existing = plugin.app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFolder) return existing;
  if (existing instanceof TFile) throw new Error(`Path is a file: ${normalized}`);

  const segments = normalized.split("/").filter(Boolean);
  let current = "";

  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    const node = plugin.app.vault.getAbstractFileByPath(current);
    if (!node) {
      await plugin.app.vault.createFolder(current);
    } else if (!(node instanceof TFolder)) {
      throw new Error(`Path segment is a file: ${current}`);
    }
  }

  const resolved = plugin.app.vault.getAbstractFileByPath(normalized);
  if (!(resolved instanceof TFolder)) {
    throw new Error(`Unable to resolve folder: ${normalized}`);
  }
  return resolved;
}

export default class GameDashboardPlugin extends Plugin {
  private static readonly IGDB_CLIENT_SECRET_KEY = "igdb-client-secret";
  settings: GameDashboardSettings = DEFAULT_SETTINGS;
  igdb = new IgdbClient(this);
  steam = new SteamClient();
  private refreshTimer: number | null = null;
  private refreshSuppressedCount = 0;
  private pendingRefreshWhileSuppressed = false;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new GameDashboardSettingTab(this.app, this));

    this.registerView(
      GAME_DASHBOARD_VIEW_TYPE,
      (leaf) => new GameDashboardView(leaf, this)
    );

    this.addRibbonIcon("gamepad-2", "Open dashboard", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-dashboard",
      name: "Open dashboard",
      callback: () => {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "create-game-entry",
      name: "Create game entry",
      callback: () => {
        this.openCreateGameModal();
      }
    });

    this.registerEvent(this.app.vault.on("create", () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.vault.on("delete", () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.vault.on("rename", () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.metadataCache.on("changed", () => this.requestRefreshAllViews()));
  }

  async loadSettings(): Promise<void> {
    const loaded = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as GameDashboardSettings & {
      igdbClientSecret?: string;
    };

    const legacySecret = loaded.igdbClientSecret?.trim();
    if (legacySecret && !this.getIgdbClientSecret()) {
      this.app.secretStorage.setSecret(GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY, legacySecret);
    }

    delete loaded.igdbClientSecret;
    this.settings = loaded;
    await this.saveData(this.settings);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  getIgdbClientSecret(): string {
    return this.app.secretStorage.getSecret(GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY) ?? "";
  }

  setIgdbClientSecret(value: string): void {
    this.app.secretStorage.setSecret(GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY, value);
  }

  beginModalSession(): void {
    this.refreshSuppressedCount += 1;
  }

  endModalSession(): void {
    this.refreshSuppressedCount = Math.max(0, this.refreshSuppressedCount - 1);
    if (this.refreshSuppressedCount === 0 && this.pendingRefreshWhileSuppressed) {
      this.pendingRefreshWhileSuppressed = false;
      this.requestRefreshAllViews();
    }
  }

  getGames(): Promise<GameEntry[]> {
    return Promise.resolve(indexGames(this.app, this.settings));
  }

  async refreshAllViews(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(GAME_DASHBOARD_VIEW_TYPE);
    await Promise.all(
      leaves.map(async (leaf) => {
        const view = leaf.view;
        if (view instanceof GameDashboardView) {
          await view.refresh();
        }
      })
    );
  }

  requestRefreshAllViews(): void {
    if (this.refreshSuppressedCount > 0) {
      this.pendingRefreshWhileSuppressed = true;
      return;
    }

    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshAllViews();
    }, 80);
  }

  async activateView(): Promise<void> {
    const workspace = this.app.workspace;
    let leaf: WorkspaceLeaf | null =
      workspace
        .getLeavesOfType(GAME_DASHBOARD_VIEW_TYPE)
        .find((candidate) => candidate.getRoot() === workspace.rootSplit) ?? null;

    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: GAME_DASHBOARD_VIEW_TYPE,
        active: true
      });
    }

    void workspace.revealLeaf(leaf);
  }

  openCreateGameModal(): void {
    new CreateGameModal(this.app, this).open();
  }

  async searchExternalGames(query: string): Promise<GameSearchCandidate[]> {
    const [igdbResults, steamResults] = await Promise.allSettled([
      this.igdb.searchGames(query),
      this.steam.searchGames(query)
    ]);

    const results: GameSearchCandidate[] = [];
    if (igdbResults.status === "fulfilled") results.push(...igdbResults.value);
    if (steamResults.status === "fulfilled") results.push(...steamResults.value);

    const deduped = new Map<string, GameSearchCandidate>();
    for (const result of results) {
      const key = `${result.source}:${result.title.toLowerCase()}:${result.year}`;
      if (!deduped.has(key)) deduped.set(key, result);
    }

    return [...deduped.values()];
  }

  async enrichImportedCandidate(candidate: GameSearchCandidate): Promise<GameSearchCandidate> {
    try {
      if (candidate.source === "steam") {
        const igdbMatch = await this.findBestComplement(candidate.title, "igdb");
        return igdbMatch ? this.mergeCandidates(candidate, igdbMatch) : candidate;
      }

      const steamMatch = await this.findBestComplement(candidate.title, "steam");
      return steamMatch ? this.mergeCandidates(candidate, steamMatch) : candidate;
    } catch (error) {
      console.error("Failed to enrich imported candidate", error);
      return candidate;
    }
  }

  async createGame(input: CreateGameInput): Promise<void> {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required.");

    const root = await ensureFolder(this, this.settings.gamesRoot);
    let folderName = sanitizeFolderName(title) || "Untitled Game";
    let folderPath = `${root.path}/${folderName}`;
    let suffix = 2;

    while (this.app.vault.getAbstractFileByPath(folderPath)) {
      folderPath = `${root.path}/${folderName} ${suffix}`;
      suffix += 1;
    }

    await ensureFolder(this, folderPath);
    const assetsPath = `${folderPath}/GameAssets`;
    await ensureFolder(this, assetsPath);

    const posterFileName = input.posterUrl
      ? await this.igdb.downloadImage(assetsPath, title, input.posterUrl, "poster")
      : "";
    const bannerFileName = input.bannerUrl
      ? await this.igdb.downloadImage(assetsPath, title, input.bannerUrl, "banner")
      : "";

    const filePath = `${folderPath}/${this.settings.mainNoteName}`;
    const file = await this.app.vault.create(filePath, this.buildMainNote(input, posterFileName, bannerFileName));

    if (this.settings.openNoteAfterCreate) {
      await this.app.workspace.getLeaf("tab").openFile(file);
    }

    await this.activateView();
    this.requestRefreshAllViews();
    new Notice(`Created ${title}`);
  }

  async deleteGame(entry: GameEntry): Promise<void> {
    await this.app.fileManager.trashFile(entry.folder);
    this.requestRefreshAllViews();
    new Notice(`Deleted ${entry.title}`);
  }

  private async findBestComplement(title: string, source: "steam" | "igdb"): Promise<GameSearchCandidate | null> {
    const candidates =
      source === "steam" ? await this.steam.searchGames(title) : await this.igdb.searchGames(title);
    if (candidates.length === 0) return null;

    const normalized = normalizeTitle(title);
    const exact = candidates.find((candidate) => normalizeTitle(candidate.title) === normalized);
    if (exact) return exact;

    const partial = candidates.find((candidate) => {
      const value = normalizeTitle(candidate.title);
      return value.includes(normalized) || normalized.includes(value);
    });
    return partial ?? candidates[0] ?? null;
  }

  private mergeCandidates(base: GameSearchCandidate, extra: GameSearchCandidate): GameSearchCandidate {
    return {
      id: base.id,
      source: base.source,
      title: choosePreferred(base.title, extra.title),
      summary: chooseLonger(base.summary, extra.summary),
      developer: choosePreferred(base.developer, extra.developer),
      publisher: choosePreferred(base.publisher, extra.publisher),
      platform: choosePreferred(base.platform, extra.platform),
      year: choosePreferred(base.year, extra.year),
      releaseDate: choosePreferred(base.releaseDate, extra.releaseDate),
      rating: choosePreferred(base.rating, extra.rating),
      officialUrl: choosePreferred(base.officialUrl, extra.officialUrl),
      detailUrl: choosePreferred(base.detailUrl, extra.detailUrl),
      steamUrl: choosePreferred(base.steamUrl, extra.steamUrl),
      igdbUrl: choosePreferred(base.igdbUrl, extra.igdbUrl),
      posterUrl: chooseBySource(base, extra, "posterUrl", "igdb"),
      bannerUrl: chooseBySource(base, extra, "bannerUrl", "steam"),
      storyline: chooseLonger(base.storyline, extra.storyline),
      genres: mergeLists(base.genres, extra.genres),
      themes: mergeLists(base.themes, extra.themes),
      modes: mergeLists(base.modes, extra.modes),
      screenshots: mergeLists(base.screenshots, extra.screenshots)
    };
  }

  private buildMainNote(input: CreateGameInput, posterFileName: string, bannerFileName: string): string {
    const metadataLines = [
      input.developer ? `- Developer: ${input.developer}` : "",
      input.publisher ? `- Publisher: ${input.publisher}` : "",
      input.platform ? `- Platform: ${input.platform}` : "",
      input.releaseDate ? `- Release Date: ${input.releaseDate}` : "",
      input.year ? `- Year: ${input.year}` : "",
      input.rating ? `- Rating: ${input.rating}` : "",
      input.genres.length ? `- Genres: ${input.genres.join(", ")}` : "",
      input.themes.length ? `- Themes: ${input.themes.join(", ")}` : "",
      input.modes.length ? `- Modes: ${input.modes.join(", ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const linksLines = [
      input.officialUrl ? `- Official: ${input.officialUrl}` : "",
      input.steamUrl ? `- Steam: ${input.steamUrl}` : "",
      input.igdbUrl ? `- IGDB: ${input.igdbUrl}` : "",
      input.detailUrl && input.detailUrl !== input.steamUrl && input.detailUrl !== input.igdbUrl ? `- Detail: ${input.detailUrl}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    return `---
type: media
media_type: game
media_title: ${yamlScalar(input.title)}
title: ${yamlScalar(input.title)}
status: ${yamlScalar(input.status)}
developer: ${yamlScalar(input.developer)}
publisher: ${yamlScalar(input.publisher)}
platform: ${yamlScalar(input.platform)}
year: ${yamlScalar(input.year)}
release_date: ${yamlScalar(input.releaseDate)}
progress: ${yamlScalar(input.progress)}
rating: ${yamlScalar(input.rating)}
summary: ${yamlScalar(input.summary)}
official_url: ${yamlScalar(input.officialUrl)}
detail_url: ${yamlScalar(input.detailUrl)}
steam_url: ${yamlScalar(input.steamUrl)}
igdb_url: ${yamlScalar(input.igdbUrl)}
cover: ${yamlScalar(posterFileName ? `GameAssets/${posterFileName}` : "")}
poster: ${yamlScalar(posterFileName ? `GameAssets/${posterFileName}` : "")}
banner: ${yamlScalar(bannerFileName ? `GameAssets/${bannerFileName}` : "")}
genres: ${yamlList(input.genres)}
themes: ${yamlList(input.themes)}
modes: ${yamlList(input.modes)}
screenshots: ${yamlList(input.screenshots)}
local_notes: []
---

# ${input.title}

## Summary

${input.summary || ""}

## Storyline

${input.storyline || ""}

## Metadata

${metadataLines || "-"}

## Links

${linksLines || "-"}

## Notes

-
`;
  }
}
