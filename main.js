var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GameDashboardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/createGameModal.ts
var import_obsidian = require("obsidian");
var STATUSES = [
  { value: "active", label: "\u8FDB\u884C\u4E2D" },
  { value: "backlog", label: "\u5F85\u5F00\u59CB" },
  { value: "paused", label: "\u6682\u505C" },
  { value: "completed", label: "\u5DF2\u5B8C\u6210" },
  { value: "archived", label: "\u5DF2\u5F52\u6863" }
];
function emptyInput() {
  return {
    title: "",
    status: "backlog",
    developer: "",
    publisher: "",
    platform: "",
    year: "",
    releaseDate: "",
    progress: "",
    rating: "",
    summary: "",
    storyline: "",
    officialUrl: "",
    detailUrl: "",
    steamUrl: "",
    igdbUrl: "",
    posterUrl: "",
    bannerUrl: "",
    genres: [],
    themes: [],
    modes: [],
    screenshots: []
  };
}
var CreateGameModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.values = emptyInput();
    this.searchQuery = "";
    this.searchResults = [];
    this.selectedCandidateId = null;
    this.isApplying = false;
    this.isSearching = false;
    this.formEl = null;
    this.resultsEl = null;
    this.searchInputEl = null;
    this.titleInputEl = null;
    this.progressInputEl = null;
    this.statusSelectEl = null;
    this.summaryInputEl = null;
    this.storylineInputEl = null;
    this.importedEl = null;
    this.readOnlyGridEl = null;
    this.plugin = plugin;
  }
  onOpen() {
    this.plugin.beginModalSession();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("game-dashboard-create-modal");
    contentEl.createEl("h2", { text: "Create Game Entry" });
    const searchSection = contentEl.createDiv({ cls: "game-dashboard-import-search" });
    const searchHeader = searchSection.createDiv({ cls: "game-dashboard-import-search-row" });
    this.searchInputEl = searchHeader.createEl("input", {
      type: "text",
      placeholder: "Search IGDB, e.g. Disco Elysium"
    });
    this.focusPrimaryInput();
    this.searchInputEl.addEventListener("input", () => {
      if (!this.searchInputEl) return;
      this.searchQuery = this.searchInputEl.value.trim();
    });
    const searchButton = searchHeader.createEl("button", { text: "Search IGDB" });
    searchButton.addEventListener("click", async () => {
      await this.runSearch();
    });
    this.searchInputEl.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      await this.runSearch();
    });
    searchSection.createDiv({
      cls: "setting-item-description",
      text: "\u914D\u7F6E\u597D IGDB Client ID / Client Secret \u540E\uFF0C\u8FD9\u91CC\u4F1A\u4ECE IGDB \u641C\u7D22\u5E76\u5BFC\u5165\u8BE6\u7EC6\u4FE1\u606F\u3002"
    });
    this.resultsEl = searchSection.createDiv({ cls: "game-dashboard-import-results" });
    this.formEl = contentEl.createDiv({ cls: "game-dashboard-modal-form" });
    this.renderResults();
    this.renderForm();
  }
  onClose() {
    this.plugin.endModalSession();
  }
  async runSearch() {
    if (!this.searchQuery) {
      new import_obsidian.Notice("Search query is required.");
      return;
    }
    this.isSearching = true;
    this.renderResults();
    try {
      this.searchResults = await this.plugin.searchExternalGames(this.searchQuery);
      if (this.searchResults.length === 0) {
        new import_obsidian.Notice("No IGDB results found.");
      }
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "IGDB search failed.");
      this.searchResults = [];
    } finally {
      this.isSearching = false;
      this.renderResults();
    }
  }
  renderResults() {
    if (!this.resultsEl) return;
    this.resultsEl.empty();
    if (this.isSearching) {
      this.resultsEl.createDiv({ cls: "game-dashboard-import-empty", text: "Searching..." });
      return;
    }
    if (this.searchResults.length === 0) {
      this.resultsEl.createDiv({ cls: "game-dashboard-import-empty", text: "No result yet. Search Steam / IGDB above." });
      return;
    }
    this.searchResults.forEach((candidate) => {
      const item = this.resultsEl.createDiv({
        cls: `game-dashboard-import-result ${this.selectedCandidateId === candidate.id ? "is-selected" : ""}`
      });
      const cover = item.createDiv({ cls: "game-dashboard-import-result-cover" });
      if (candidate.coverUrl) {
        cover.createEl("img", {
          attr: {
            src: candidate.coverUrl,
            alt: `${candidate.title} cover`
          }
        });
      } else {
        cover.createDiv({ cls: "game-dashboard-card-fallback", text: "\u{1F3AE}" });
      }
      const content = item.createDiv({ cls: "game-dashboard-import-result-content" });
      content.createDiv({
        cls: "game-dashboard-import-result-source",
        text: candidate.source === "steam" ? "Steam" : "IGDB"
      });
      content.createDiv({ cls: "game-dashboard-import-result-title", text: candidate.title });
      content.createDiv({
        cls: "game-dashboard-import-result-meta",
        text: [candidate.developer, candidate.platform, candidate.year].filter(Boolean).join(" \xB7 ") || "No metadata"
      });
      content.createDiv({
        cls: "game-dashboard-import-result-summary",
        text: candidate.summary || candidate.storyline || "No summary"
      });
      const action = item.createEl("button", { text: "Use" });
      if (this.isApplying && this.selectedCandidateId === candidate.id) {
        action.disabled = true;
        action.textContent = "Loading...";
      }
      action.addEventListener("click", async () => {
        if (this.isApplying) return;
        this.isApplying = true;
        this.selectedCandidateId = candidate.id;
        this.renderResults();
        const enriched = await this.plugin.enrichImportedCandidate(candidate);
        this.applyCandidate(enriched);
        this.isApplying = false;
        this.renderResults();
      });
    });
  }
  renderForm() {
    if (!this.formEl) return;
    const form = this.formEl;
    form.empty();
    const titleLabel = form.createEl("label", { text: "Title" });
    this.titleInputEl = titleLabel.createEl("input", { type: "text" });
    this.titleInputEl.value = this.values.title;
    this.titleInputEl.addEventListener("input", () => {
      if (!this.titleInputEl) return;
      this.values.title = this.titleInputEl.value;
    });
    this.readOnlyGridEl = form.createDiv({ cls: "game-dashboard-modal-grid" });
    this.renderReadOnlyGrid();
    const statusLabel = this.readOnlyGridEl.createEl("label", { text: "Status" });
    this.statusSelectEl = statusLabel.createEl("select");
    for (const status of STATUSES) {
      this.statusSelectEl.createEl("option", { value: status.value, text: status.label });
    }
    this.statusSelectEl.value = this.values.status;
    this.statusSelectEl.addEventListener("change", () => {
      if (!this.statusSelectEl) return;
      this.values.status = this.statusSelectEl.value;
    });
    this.importedEl = form.createDiv({ cls: "game-dashboard-imported-meta" });
    this.renderImportedMetadata();
    const summaryLabel = form.createEl("label", { text: "Summary" });
    this.summaryInputEl = summaryLabel.createEl("textarea");
    this.summaryInputEl.rows = 4;
    this.summaryInputEl.value = this.values.summary;
    this.summaryInputEl.addEventListener("input", () => {
      if (!this.summaryInputEl) return;
      this.values.summary = this.summaryInputEl.value;
    });
    const storylineLabel = form.createEl("label", { text: "Storyline" });
    this.storylineInputEl = storylineLabel.createEl("textarea");
    this.storylineInputEl.rows = 4;
    this.storylineInputEl.value = this.values.storyline;
    this.storylineInputEl.addEventListener("input", () => {
      if (!this.storylineInputEl) return;
      this.values.storyline = this.storylineInputEl.value;
    });
    const actions = form.createDiv({ cls: "game-dashboard-modal-actions" });
    new import_obsidian.Setting(actions).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("Create").setCta().onClick(async () => {
        if (!this.values.title) {
          new import_obsidian.Notice("Game title is required.");
          return;
        }
        try {
          await this.plugin.createGame(this.values);
          this.close();
        } catch (error) {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to create game entry.");
        }
      })
    );
  }
  applyCandidate(candidate) {
    this.values = {
      ...emptyInput(),
      ...this.values,
      title: candidate.title,
      developer: candidate.developer,
      publisher: candidate.publisher,
      platform: candidate.platform,
      year: candidate.year,
      releaseDate: candidate.releaseDate,
      rating: candidate.rating,
      summary: candidate.summary,
      storyline: candidate.storyline,
      officialUrl: candidate.officialUrl,
      detailUrl: candidate.detailUrl,
      steamUrl: candidate.steamUrl,
      igdbUrl: candidate.igdbUrl,
      posterUrl: candidate.posterUrl,
      bannerUrl: candidate.bannerUrl,
      genres: candidate.genres,
      themes: candidate.themes,
      modes: candidate.modes,
      screenshots: candidate.screenshots
    };
    this.syncFormValues();
  }
  renderReadOnlyGrid() {
    if (!this.readOnlyGridEl) return;
    const progressValue = this.values.progress;
    const statusValue = this.values.status;
    this.readOnlyGridEl.empty();
    this.addReadOnly(this.readOnlyGridEl, "Developer", this.values.developer || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Publisher", this.values.publisher || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Platform", this.values.platform || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Release Date", this.values.releaseDate || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Year", this.values.year || "Auto");
    this.progressInputEl = this.addInput(this.readOnlyGridEl, "Progress", progressValue, (value) => this.values.progress = value);
    this.addReadOnly(this.readOnlyGridEl, "Rating", this.values.rating || "Auto");
    const statusLabel = this.readOnlyGridEl.createEl("label", { text: "Status" });
    this.statusSelectEl = statusLabel.createEl("select");
    for (const status of STATUSES) {
      this.statusSelectEl.createEl("option", { value: status.value, text: status.label });
    }
    this.statusSelectEl.value = statusValue;
    this.statusSelectEl.addEventListener("change", () => {
      if (!this.statusSelectEl) return;
      this.values.status = this.statusSelectEl.value;
    });
  }
  renderImportedMetadata() {
    var _a;
    if (!this.importedEl) return;
    this.importedEl.empty();
    this.importedEl.createDiv({
      cls: "game-dashboard-imported-meta-title",
      text: "Imported Metadata"
    });
    if (this.selectedCandidateId !== null) {
      this.importedEl.createDiv({
        cls: "game-dashboard-imported-meta-source",
        text: `Primary Source: ${((_a = this.searchResults.find((item) => item.id === this.selectedCandidateId)) == null ? void 0 : _a.source) === "steam" ? "Steam" : "IGDB"}`
      });
    }
    [
      ["Official URL", this.values.officialUrl],
      ["Detail URL", this.values.detailUrl],
      ["Steam URL", this.values.steamUrl],
      ["IGDB URL", this.values.igdbUrl],
      ["Poster", this.values.posterUrl],
      ["Banner", this.values.bannerUrl],
      ["Genres", this.values.genres.join(", ")],
      ["Themes", this.values.themes.join(", ")],
      ["Modes", this.values.modes.join(", ")]
    ].filter(([, value]) => Boolean(value)).forEach(([label, value]) => {
      const row = this.importedEl.createDiv({ cls: "game-dashboard-imported-meta-row" });
      row.createDiv({ cls: "game-dashboard-imported-meta-label", text: `${label}` });
      row.createDiv({ cls: "game-dashboard-imported-meta-value", text: value });
    });
  }
  syncFormValues() {
    if (this.titleInputEl) this.titleInputEl.value = this.values.title;
    if (this.progressInputEl) this.progressInputEl.value = this.values.progress;
    if (this.statusSelectEl) this.statusSelectEl.value = this.values.status;
    if (this.summaryInputEl) this.summaryInputEl.value = this.values.summary;
    if (this.storylineInputEl) this.storylineInputEl.value = this.values.storyline;
    this.renderReadOnlyGrid();
    this.renderImportedMetadata();
  }
  focusPrimaryInput() {
    const applyFocus = () => {
      var _a;
      const target = (_a = this.searchInputEl) != null ? _a : this.titleInputEl;
      if (!target) return;
      target.focus();
      if ("setSelectionRange" in target) {
        const length = target.value.length;
        target.setSelectionRange(length, length);
      }
    };
    window.requestAnimationFrame(() => {
      applyFocus();
      window.requestAnimationFrame(applyFocus);
    });
  }
  addReadOnly(container, label, value) {
    const wrapper = container.createDiv({ cls: "game-dashboard-readonly-field" });
    wrapper.createDiv({ cls: "game-dashboard-readonly-label", text: label });
    wrapper.createDiv({ cls: "game-dashboard-readonly-value", text: value });
  }
  addInput(container, label, initialValue, onChange) {
    const wrapper = container.createEl("label", { text: label });
    const input = wrapper.createEl("input", { type: "text" });
    input.value = initialValue;
    input.addEventListener("input", () => onChange(input.value.trim()));
    return input;
  }
};

// src/igdb.ts
var import_obsidian2 = require("obsidian");
function igdbImageUrl(imageId, size = "cover_big_2x") {
  if (!imageId) return "";
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}
function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}
function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}
function datePartsFromUnix(timestamp) {
  if (!timestamp) return { year: "", releaseDate: "" };
  const date = new Date(timestamp * 1e3);
  if (Number.isNaN(date.getTime())) return { year: "", releaseDate: "" };
  return {
    year: String(date.getFullYear()),
    releaseDate: date.toISOString().slice(0, 10)
  };
}
function websiteUrl(record, matcher) {
  var _a, _b;
  const urls = ((_a = record.websites) != null ? _a : []).map((item) => {
    var _a2;
    return (_a2 = item.url) != null ? _a2 : "";
  }).map((url) => url.startsWith("//") ? `https:${url}` : url).filter(Boolean);
  return (_b = urls.find(matcher)) != null ? _b : "";
}
function firstExternalUrl(record) {
  var _a, _b;
  return (_b = ((_a = record.websites) != null ? _a : []).map((item) => {
    var _a2;
    return (_a2 = item.url) != null ? _a2 : "";
  }).map((url) => url.startsWith("//") ? `https:${url}` : url).find(Boolean)) != null ? _b : "";
}
function companies(record, kind) {
  var _a;
  const names2 = ((_a = record.involved_companies) != null ? _a : []).filter((company) => Boolean(company[kind])).map((company) => {
    var _a2, _b;
    return (_b = (_a2 = company.company) == null ? void 0 : _a2.name) != null ? _b : "";
  }).filter(Boolean);
  return uniqueValues(names2).join(", ");
}
function names(values) {
  return uniqueValues((values != null ? values : []).map((item) => {
    var _a;
    return (_a = item.name) != null ? _a : "";
  }));
}
function coverFileName(title, url) {
  var _a, _b;
  const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = (_b = (_a = extensionMatch == null ? void 0 : extensionMatch[1]) == null ? void 0 : _a.toLowerCase()) != null ? _b : "jpg";
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim() || "cover";
  return `${safeTitle}.${extension}`;
}
var IgdbClient = class {
  constructor(plugin) {
    this.tokenCache = null;
    this.plugin = plugin;
  }
  async searchGames(query) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const token = await this.getAccessToken();
    const body = [
      "fields id,name,summary,storyline,first_release_date,rating,aggregated_rating,slug,",
      "cover.image_id,cover.url,artworks.image_id,artworks.url,websites.url,",
      "involved_companies.developer,involved_companies.publisher,involved_companies.company.name,",
      "genres.name,themes.name,game_modes.name,platforms.name,screenshots.image_id,screenshots.url;",
      `search "${trimmed.replace(/"/g, '\\"')}";`,
      "where version_parent = null;",
      "limit 8;"
    ].join("");
    const response = await (0, import_obsidian2.requestUrl)({
      url: "https://api.igdb.com/v4/games",
      method: "POST",
      headers: {
        "Client-ID": this.plugin.settings.igdbClientId,
        Authorization: `Bearer ${token}`
      },
      body
    });
    const records = Array.isArray(response.json) ? response.json : [];
    return records.map((record) => this.toCandidate(record));
  }
  async downloadImage(folderPath, title, imageUrl, purpose) {
    if (!imageUrl) return "";
    const normalizedUrl = normalizeImageUrl(imageUrl);
    if (!normalizedUrl) return "";
    const fileName = `${purpose}-${coverFileName(title, normalizedUrl)}`;
    const filePath = `${folderPath}/${fileName}`;
    const existing = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (existing) return fileName;
    const response = await (0, import_obsidian2.requestUrl)({
      url: normalizedUrl,
      method: "GET"
    });
    await this.plugin.app.vault.createBinary(filePath, response.arrayBuffer);
    return fileName;
  }
  async getAccessToken() {
    var _a;
    if (!this.plugin.settings.igdbClientId || !this.plugin.settings.igdbClientSecret) {
      throw new Error("IGDB Client ID / Client Secret \u672A\u914D\u7F6E\u3002");
    }
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 6e4) {
      return this.tokenCache.accessToken;
    }
    const response = await (0, import_obsidian2.requestUrl)({
      url: `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(this.plugin.settings.igdbClientId)}&client_secret=${encodeURIComponent(this.plugin.settings.igdbClientSecret)}&grant_type=client_credentials`,
      method: "POST"
    });
    const json = response.json;
    if (!(json == null ? void 0 : json.access_token)) {
      new import_obsidian2.Notice("IGDB token request failed.");
      throw new Error("Unable to fetch IGDB access token.");
    }
    this.tokenCache = {
      accessToken: json.access_token,
      expiresAt: Date.now() + ((_a = json.expires_in) != null ? _a : 0) * 1e3
    };
    return json.access_token;
  }
  toCandidate(record) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const steamUrl = websiteUrl(record, (url) => /store\.steampowered\.com\/app\//i.test(url));
    const externalUrl = firstExternalUrl(record);
    const posterUrl = igdbImageUrl((_a = record.cover) == null ? void 0 : _a.image_id, "cover_big_2x") || normalizeImageUrl((_b = record.cover) == null ? void 0 : _b.url);
    const bannerUrl = igdbImageUrl((_d = (_c = record.artworks) == null ? void 0 : _c[0]) == null ? void 0 : _d.image_id, "screenshot_huge") || normalizeImageUrl((_f = (_e = record.artworks) == null ? void 0 : _e[0]) == null ? void 0 : _f.url) || posterUrl;
    const { year, releaseDate } = datePartsFromUnix(record.first_release_date);
    const rating = (_g = record.aggregated_rating) != null ? _g : record.rating;
    return {
      id: (_h = record.id) != null ? _h : Math.trunc(Math.random() * 1e9),
      source: "igdb",
      title: (_i = record.name) != null ? _i : "Untitled Game",
      summary: (_j = record.summary) != null ? _j : "",
      developer: companies(record, "developer"),
      publisher: companies(record, "publisher"),
      platform: names(record.platforms).join(", "),
      year,
      releaseDate,
      rating: rating ? rating.toFixed(1) : "",
      officialUrl: steamUrl || externalUrl,
      detailUrl: steamUrl || (record.slug ? `https://www.igdb.com/games/${record.slug}` : externalUrl),
      steamUrl,
      igdbUrl: record.slug ? `https://www.igdb.com/games/${record.slug}` : "",
      posterUrl,
      bannerUrl,
      storyline: (_k = record.storyline) != null ? _k : "",
      genres: names(record.genres),
      themes: names(record.themes),
      modes: names(record.game_modes),
      screenshots: uniqueValues(
        ((_l = record.screenshots) != null ? _l : []).map((item) => igdbImageUrl(item.image_id, "screenshot_huge") || normalizeImageUrl(item.url))
      )
    };
  }
};

// src/indexer.ts
var import_obsidian3 = require("obsidian");
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);
function asFolder(file) {
  return file instanceof import_obsidian3.TFolder ? file : null;
}
function collectDirectMarkdownFiles(folder) {
  return folder.children.filter(
    (child) => child instanceof import_obsidian3.TFile && child.extension === "md"
  );
}
function collectImageFiles(folder) {
  const files = [];
  const stack = [folder];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const child of current.children) {
      if (child instanceof import_obsidian3.TFolder) {
        stack.push(child);
      } else if (child instanceof import_obsidian3.TFile && IMAGE_EXTENSIONS.has(child.extension.toLowerCase())) {
        files.push(child);
      }
    }
  }
  return files;
}
function metadataValue(cache, key) {
  var _a;
  const value = (_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function fileMtime(file) {
  var _a, _b;
  return (_b = (_a = file == null ? void 0 : file.stat) == null ? void 0 : _a.mtime) != null ? _b : 0;
}
function resolveImageFile(app, folder, mainFile, field) {
  var _a, _b;
  const cache = mainFile ? app.metadataCache.getFileCache(mainFile) : null;
  const imageValue = (_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a[field];
  if (typeof imageValue === "string" && imageValue.trim().length > 0) {
    const cleaned = imageValue.replace(/^\[\[/, "").replace(/\]\]$/, "");
    const resolved = app.metadataCache.getFirstLinkpathDest(cleaned, (_b = mainFile == null ? void 0 : mainFile.path) != null ? _b : folder.path);
    if (resolved) return resolved;
  }
  return null;
}
function resolvePosterFile(app, folder, mainFile) {
  var _a;
  const explicitPoster = (_a = resolveImageFile(app, folder, mainFile, "poster")) != null ? _a : resolveImageFile(app, folder, mainFile, "cover");
  if (explicitPoster) return explicitPoster;
  const [firstImage] = collectImageFiles(folder);
  return firstImage != null ? firstImage : null;
}
function resolveBannerFile(app, folder, mainFile, posterFile) {
  var _a, _b;
  const explicitBanner = resolveImageFile(app, folder, mainFile, "banner");
  if (explicitBanner) return explicitBanner;
  const images = collectImageFiles(folder);
  return (_b = (_a = images.find((file) => !posterFile || file.path !== posterFile.path)) != null ? _a : posterFile) != null ? _b : null;
}
async function indexGames(app, settings) {
  const rootFolder = asFolder(app.vault.getAbstractFileByPath(settings.gamesRoot));
  if (!rootFolder) return [];
  const gameFolders = rootFolder.children.filter((child) => child instanceof import_obsidian3.TFolder);
  const entries = gameFolders.map((folder) => {
    var _a, _b;
    const markdownFiles = collectDirectMarkdownFiles(folder);
    const mainFile = (_b = (_a = markdownFiles.find((file) => file.name === settings.mainNoteName)) != null ? _a : markdownFiles[0]) != null ? _b : null;
    const notes = markdownFiles.filter((file) => mainFile == null || file.path !== mainFile.path);
    const cache = mainFile ? app.metadataCache.getFileCache(mainFile) : null;
    const relativePath = folder.path.startsWith(rootFolder.path) ? folder.path.slice(rootFolder.path.length + 1) : folder.path;
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
      title: metadataValue(cache, "media_title") || metadataValue(cache, "title") || (mainFile == null ? void 0 : mainFile.basename) || folder.name,
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
    };
  });
  return entries.sort((left, right) => {
    if (left.updatedAt !== right.updatedAt) return right.updatedAt - left.updatedAt;
    return left.title.localeCompare(right.title, "zh-Hans-CN");
  });
}

// src/settings.ts
var import_obsidian4 = require("obsidian");
var DEFAULT_SETTINGS = {
  gamesRoot: "2-Knowledge/Media Library/Games",
  mainNoteName: "Game.md",
  openNoteAfterCreate: true,
  igdbClientId: "",
  igdbClientSecret: ""
};
var GameDashboardSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Game Dashboard" });
    new import_obsidian4.Setting(containerEl).setName("Games root folder").setDesc("Each direct subfolder under this path is treated as one game entry. Each game folder should contain Game.md and an optional GameAssets folder.").addText(
      (text) => text.setPlaceholder("2-Knowledge/Media Library/Games").setValue(this.plugin.settings.gamesRoot).onChange(async (value) => {
        this.plugin.settings.gamesRoot = value.trim();
        await this.plugin.saveSettings();
        await this.plugin.refreshAllViews();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Main note name").setDesc("The main details note created inside each game folder.").addText(
      (text) => text.setPlaceholder("Game.md").setValue(this.plugin.settings.mainNoteName).onChange(async (value) => {
        const nextValue = value.trim() || DEFAULT_SETTINGS.mainNoteName;
        this.plugin.settings.mainNoteName = nextValue.endsWith(".md") ? nextValue : `${nextValue}.md`;
        await this.plugin.saveSettings();
        await this.plugin.refreshAllViews();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Open note after create").setDesc("Open the newly created main note after the creation modal completes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openNoteAfterCreate).onChange(async (value) => {
        this.plugin.settings.openNoteAfterCreate = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "IGDB Import" });
    new import_obsidian4.Setting(containerEl).setName("IGDB Client ID").setDesc("Twitch application Client ID used for IGDB search and import.").addText(
      (text) => text.setPlaceholder("Your Twitch Client ID").setValue(this.plugin.settings.igdbClientId).onChange(async (value) => {
        this.plugin.settings.igdbClientId = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("IGDB Client Secret").setDesc("Twitch application Client Secret used to request IGDB access tokens.").addText(
      (text) => text.setPlaceholder("Your Twitch Client Secret").setValue(this.plugin.settings.igdbClientSecret).onChange(async (value) => {
        this.plugin.settings.igdbClientSecret = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Open dashboard").setDesc("Open or reveal the Game Dashboard view.").addButton(
      (button) => button.setButtonText("Open").onClick(async () => {
        await this.plugin.activateView();
      })
    );
  }
};

// src/steam.ts
var import_obsidian5 = require("obsidian");
function parseSteamYear(dateText) {
  var _a;
  if (!dateText) return { year: "", releaseDate: "" };
  const parsed = Date.parse(dateText);
  if (Number.isNaN(parsed)) {
    const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
    return { year: (_a = yearMatch == null ? void 0 : yearMatch[0]) != null ? _a : "", releaseDate: dateText };
  }
  const date = new Date(parsed);
  return {
    year: String(date.getFullYear()),
    releaseDate: date.toISOString().slice(0, 10)
  };
}
function platformText(platforms) {
  if (!platforms) return "";
  const values = [
    platforms.windows ? "Windows" : "",
    platforms.mac ? "macOS" : "",
    platforms.linux ? "Linux" : ""
  ].filter(Boolean);
  return values.join(", ");
}
function stripHtml(input) {
  return (input != null ? input : "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
var SteamClient = class {
  async searchGames(query) {
    var _a;
    const trimmed = query.trim();
    if (!trimmed) return [];
    const search = await (0, import_obsidian5.requestUrl)({
      url: `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(trimmed)}&l=english&cc=us`,
      method: "GET"
    });
    const searchJson = search.json;
    const items = ((_a = searchJson.items) != null ? _a : []).slice(0, 8);
    const details = await Promise.all(items.map(async (item) => await this.getAppCandidate(item.id)));
    return details.filter((item) => item !== null);
  }
  async getAppCandidate(appId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    const response = await (0, import_obsidian5.requestUrl)({
      url: `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`,
      method: "GET"
    });
    const payload = (_a = response.json) == null ? void 0 : _a[String(appId)];
    if (!(payload == null ? void 0 : payload.success) || !(payload == null ? void 0 : payload.data)) return null;
    const data = payload.data;
    if (data.type && data.type !== "game") return null;
    const { year, releaseDate } = parseSteamYear((_b = data.release_date) == null ? void 0 : _b.date);
    const summary = stripHtml(data.short_description);
    const storyline = stripHtml(data.detailed_description);
    return {
      id: appId,
      source: "steam",
      title: (_c = data.name) != null ? _c : `Steam App ${appId}`,
      summary,
      developer: ((_d = data.developers) != null ? _d : []).join(", "),
      publisher: ((_e = data.publishers) != null ? _e : []).join(", "),
      platform: platformText(data.platforms),
      year,
      releaseDate,
      rating: "",
      officialUrl: (_f = data.website) != null ? _f : `https://store.steampowered.com/app/${appId}`,
      detailUrl: `https://store.steampowered.com/app/${appId}`,
      steamUrl: `https://store.steampowered.com/app/${appId}`,
      igdbUrl: "",
      posterUrl: (_i = (_h = (_g = data.capsule_imagev5) != null ? _g : data.capsule_image) != null ? _h : data.header_image) != null ? _i : "",
      bannerUrl: (_l = (_k = (_j = data.header_image) != null ? _j : data.capsule_imagev5) != null ? _k : data.capsule_image) != null ? _l : "",
      storyline,
      genres: ((_m = data.genres) != null ? _m : []).map((genre) => {
        var _a2;
        return (_a2 = genre.description) != null ? _a2 : "";
      }).filter(Boolean),
      themes: [],
      modes: ((_n = data.categories) != null ? _n : []).map((category) => {
        var _a2;
        return (_a2 = category.description) != null ? _a2 : "";
      }).filter(Boolean),
      screenshots: []
    };
  }
};

// src/view.ts
var import_obsidian6 = require("obsidian");
var GAME_DASHBOARD_VIEW_TYPE = "game-dashboard-view";
var STATUS_LABELS = {
  active: "\u8FDB\u884C\u4E2D",
  backlog: "\u5F85\u5F00\u59CB",
  paused: "\u6682\u505C",
  completed: "\u5DF2\u5B8C\u6210",
  archived: "\u5DF2\u5F52\u6863",
  unsorted: "\u672A\u6574\u7406"
};
var SECTIONS = [
  {
    key: "playing",
    title: "\u6B63\u5728\u6E38\u73A9",
    subtitle: "\u8FDB\u884C\u4E2D / \u6682\u505C\u4E2D\u7684\u6E38\u620F",
    collapsedByDefault: false,
    match: (entry) => entry.status === "active" || entry.status === "paused"
  },
  {
    key: "all",
    title: "\u6240\u6709\u6E38\u620F",
    subtitle: "\u5B8C\u6574\u6E38\u620F\u5E93",
    collapsedByDefault: false,
    match: (_entry) => true
  }
];
function createNode(tag, options = {}) {
  const el = document.createElement(tag);
  if (options.cls) el.className = options.cls;
  if (options.text != null) el.textContent = options.text;
  return el;
}
var DeleteGameConfirmModal = class extends import_obsidian6.Modal {
  constructor(app, entry, onConfirm) {
    super(app);
    this.entry = entry;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    var _a, _b;
    const plugin = (_b = (_a = this.app.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b["game-dashboard"];
    if (plugin && typeof plugin.beginModalSession === "function") {
      plugin.beginModalSession();
    }
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u5220\u9664\u6E38\u620F" });
    contentEl.createEl("p", {
      text: `\u5C06\u5220\u9664\u201C${this.entry.title}\u201D\u5BF9\u5E94\u7684\u6574\u4E2A\u6E38\u620F\u6587\u4EF6\u5939\u3002\u8FD9\u4E2A\u64CD\u4F5C\u4F1A\u5220\u9664 Game.md\u3001\u5173\u8054\u7B14\u8BB0\u548C GameAssets\u3002`
    });
    new import_obsidian6.Setting(contentEl).addButton(
      (button) => button.setButtonText("\u53D6\u6D88").onClick(() => {
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("\u5220\u9664").setWarning().onClick(async () => {
        this.close();
        window.setTimeout(() => {
          void this.onConfirm();
          window.setTimeout(() => window.focus(), 0);
        }, 0);
      })
    );
  }
  onClose() {
    var _a, _b;
    const plugin = (_b = (_a = this.app.plugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b["game-dashboard"];
    if (plugin && typeof plugin.endModalSession === "function") {
      plugin.endModalSession();
    }
  }
};
var GameDashboardView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.entries = [];
    this.query = "";
    this.sortMode = "updated";
    this.statusFilter = "all";
    this.selectedPath = null;
    this.collapsedSections = Object.fromEntries(
      SECTIONS.map((section) => [section.key, section.collapsedByDefault])
    );
    this.floatingTooltipEl = null;
    this.shellEl = null;
    this.detailHostEl = null;
    this.sectionsHostEl = null;
    this.endcapHostEl = null;
    this.filterBarEl = null;
    this.plugin = plugin;
  }
  getViewType() {
    return GAME_DASHBOARD_VIEW_TYPE;
  }
  getDisplayText() {
    return "Game Dashboard";
  }
  getIcon() {
    return "gamepad-2";
  }
  async onOpen() {
    this.contentEl.addClass("game-dashboard-view");
    this.ensureFloatingTooltip();
    await this.refresh();
  }
  async onClose() {
    var _a;
    (_a = this.floatingTooltipEl) == null ? void 0 : _a.remove();
    this.floatingTooltipEl = null;
  }
  async refresh() {
    try {
      this.entries = await this.plugin.getGames();
      this.render(this.entries);
    } catch (error) {
      console.error("Game Dashboard render failed", error);
      this.contentEl.empty();
      this.contentEl.addClass("game-dashboard-view");
      const shell = this.contentEl.createDiv({ cls: "game-dashboard-shell" });
      const panel = shell.createDiv({ cls: "game-dashboard-detail-card" });
      const content = panel.createDiv({ cls: "game-dashboard-detail-content" });
      content.createDiv({
        cls: "game-dashboard-empty",
        text: `Render failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  ensureFloatingTooltip() {
    var _a;
    (_a = this.floatingTooltipEl) == null ? void 0 : _a.remove();
    const el = document.createElement("div");
    el.className = "game-dashboard-floating-tooltip";
    document.body.appendChild(el);
    this.floatingTooltipEl = el;
  }
  render(entries) {
    const root = this.contentEl;
    root.empty();
    const filteredEntries = this.filterEntries(entries);
    if (!this.selectedPath && filteredEntries.length > 0) {
      this.selectedPath = filteredEntries[0].folder.path;
    }
    if (filteredEntries.length > 0 && !filteredEntries.some((entry) => entry.folder.path === this.selectedPath)) {
      this.selectedPath = filteredEntries[0].folder.path;
    }
    const shell = root.createDiv({ cls: "game-dashboard-shell" });
    this.shellEl = shell;
    this.renderHero(shell, entries);
    this.renderToolbar(shell);
    this.filterBarEl = shell.createDiv({ cls: "game-dashboard-filterbar" });
    this.renderFilterBar(entries);
    this.detailHostEl = shell.createDiv({ cls: "game-dashboard-detail-host" });
    this.sectionsHostEl = shell.createDiv({ cls: "game-dashboard-sections-host" });
    this.endcapHostEl = shell.createDiv({ cls: "game-dashboard-endcap-host" });
    this.renderContent();
  }
  renderContent() {
    var _a, _b, _c, _d;
    const filteredEntries = this.filterEntries(this.entries);
    if (!this.selectedPath && filteredEntries.length > 0) {
      this.selectedPath = filteredEntries[0].folder.path;
    }
    if (filteredEntries.length > 0 && !filteredEntries.some((entry) => entry.folder.path === this.selectedPath)) {
      this.selectedPath = filteredEntries[0].folder.path;
    }
    const selected = (_a = filteredEntries.find((entry) => entry.folder.path === this.selectedPath)) != null ? _a : null;
    (_b = this.detailHostEl) == null ? void 0 : _b.empty();
    (_c = this.sectionsHostEl) == null ? void 0 : _c.empty();
    (_d = this.endcapHostEl) == null ? void 0 : _d.empty();
    if (this.detailHostEl) this.renderDetail(this.detailHostEl, selected);
    if (this.sectionsHostEl) this.renderSections(this.sectionsHostEl, filteredEntries);
    if (this.endcapHostEl) this.renderEndcap(this.endcapHostEl, filteredEntries.length);
  }
  getScrollContainer() {
    var _a;
    return (_a = this.contentEl.closest(".view-content")) != null ? _a : this.contentEl;
  }
  preserveScroll(callback) {
    const container = this.getScrollContainer();
    const top = container.scrollTop;
    callback();
    window.requestAnimationFrame(() => {
      container.scrollTop = top;
    });
  }
  renderHero(container, entries) {
    const hero = container.createDiv({ cls: "game-dashboard-hero" });
    const heading = hero.createDiv({ cls: "game-dashboard-hero-copy" });
    heading.createDiv({ cls: "game-dashboard-kicker", text: "Game Library" });
    heading.createEl("h2", { cls: "game-dashboard-hero-title", text: "Steam \u98CE\u683C\u6D4F\u89C8\u4F60\u7684\u6E38\u620F\u5E93" });
    heading.createDiv({
      cls: "game-dashboard-hero-text",
      text: "\u70B9\u51FB\u5C01\u9762\u5207\u6362\u8BE6\u60C5\uFF0C\u53CC\u51FB\u5C01\u9762\u6253\u5F00\u4E3B\u7B14\u8BB0\u3002\u6BCF\u4E2A\u6E38\u620F\u6587\u4EF6\u5939\u5305\u542B\u4E00\u4E2A\u4E3B\u6587\u6863\u548C\u82E5\u5E72\u5173\u8054\u7B14\u8BB0\u3002"
    });
    const stats = hero.createDiv({ cls: "game-dashboard-stats" });
    const playingCount = entries.filter((entry) => entry.status === "active" || entry.status === "paused").length;
    const completedCount = entries.filter((entry) => entry.status === "completed").length;
    [
      ["\u{1F3AE} \u6240\u6709\u6E38\u620F", String(entries.length)],
      ["\u{1F579} \u6B63\u5728\u6E38\u73A9", String(playingCount)],
      ["\u{1F3C1} \u5DF2\u5B8C\u6210", String(completedCount)]
    ].forEach(([label, value]) => {
      const stat = stats.createDiv({ cls: "game-dashboard-stat" });
      stat.createDiv({ cls: "game-dashboard-stat-label", text: label });
      stat.createDiv({ cls: "game-dashboard-stat-value", text: value });
    });
  }
  formatUpdatedAt(timestamp) {
    if (!timestamp) return "Unknown";
    const value = new Date(timestamp);
    return Number.isNaN(value.getTime()) ? "Unknown" : value.toLocaleString();
  }
  renderToolbar(container) {
    const toolbar = container.createDiv({ cls: "game-dashboard-toolbar" });
    const left = toolbar.createDiv({ cls: "game-dashboard-toolbar-group" });
    const search = left.createEl("input", {
      cls: "game-dashboard-input",
      type: "text",
      placeholder: "\u641C\u7D22\u6E38\u620F\u3001\u5E73\u53F0\u3001\u5F00\u53D1\u5546"
    });
    search.value = this.query;
    search.addEventListener("input", () => {
      this.query = search.value.trim();
      this.renderContent();
    });
    const sort = left.createEl("select", { cls: "game-dashboard-select" });
    [
      ["updated", "\u6700\u8FD1\u66F4\u65B0"],
      ["name", "\u6309\u6807\u9898"]
    ].forEach(([value, label]) => sort.createEl("option", { value, text: label }));
    sort.value = this.sortMode;
    sort.addEventListener("change", () => {
      this.sortMode = sort.value;
      this.renderContent();
    });
    const right = toolbar.createDiv({ cls: "game-dashboard-toolbar-group" });
    const refreshButton = right.createEl("button", { cls: "game-dashboard-button subtle", text: "Refresh" });
    refreshButton.addEventListener("click", async () => {
      await this.refresh();
    });
    const createButton = right.createEl("button", { cls: "game-dashboard-button", text: "+ New Game" });
    createButton.addEventListener("click", () => this.plugin.openCreateGameModal());
  }
  renderFilterBar(entries) {
    var _a;
    const bar = this.filterBarEl;
    if (!bar) return;
    bar.empty();
    const counts = /* @__PURE__ */ new Map();
    counts.set("all", entries.length);
    for (const entry of entries) {
      counts.set(entry.status, ((_a = counts.get(entry.status)) != null ? _a : 0) + 1);
    }
    [
      ["all", "\u5168\u90E8"],
      ["active", "\u8FDB\u884C\u4E2D"],
      ["backlog", "\u5F85\u5F00\u59CB"],
      ["paused", "\u6682\u505C"],
      ["completed", "\u5DF2\u5B8C\u6210"],
      ["archived", "\u5DF2\u5F52\u6863"],
      ["unsorted", "\u672A\u6574\u7406"]
    ].forEach(([value, label]) => {
      var _a2;
      const button = bar.createEl("button", {
        cls: `game-dashboard-filter-chip ${this.statusFilter === value ? "is-active" : ""}`,
        text: `${label} ${(_a2 = counts.get(value)) != null ? _a2 : 0}`
      });
      button.addEventListener("click", () => {
        this.statusFilter = value;
        this.renderFilterBar(this.entries);
        this.preserveScroll(() => this.renderContent());
      });
    });
  }
  renderDetail(container, entry) {
    const panel = container.createDiv({ cls: "game-dashboard-detail-panel" });
    if (!entry) {
      panel.createDiv({ cls: "game-dashboard-empty game-dashboard-detail-empty", text: "\u5F53\u524D\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u6E38\u620F\u6761\u76EE\u3002" });
      return;
    }
    const card = panel.createDiv({ cls: "game-dashboard-detail-card" });
    const preview = card.createDiv({ cls: "game-dashboard-detail-preview" });
    if (entry.posterFile) {
      preview.createEl("img", {
        attr: {
          src: this.app.vault.getResourcePath(entry.posterFile),
          alt: `${entry.title} poster`
        }
      });
    } else {
      preview.createDiv({ cls: "game-dashboard-detail-fallback", text: "\u{1F3AE}" });
    }
    preview.appendChild(this.renderPosterOverlay(entry, false));
    const content = card.createDiv({ cls: "game-dashboard-detail-content" });
    const body = content.createDiv({ cls: "game-dashboard-detail-main" });
    const kicker = body.createDiv({ cls: "game-dashboard-detail-kicker" });
    kicker.createEl("span", { text: entry.relativePath });
    kicker.createEl("span", { text: `Updated ${this.formatUpdatedAt(entry.updatedAt)}` });
    const titleRow = body.createDiv({ cls: "game-dashboard-detail-title-row" });
    const title = titleRow.createEl("h3", { cls: "game-dashboard-detail-title" });
    title.appendChild(this.createFileLink(entry.title, entry.mainFile));
    titleRow.appendChild(this.createStatusPill(entry.status));
    const meta = [
      entry.developer,
      entry.platform,
      entry.year,
      entry.progress,
      entry.rating && `\u8BC4\u5206 ${entry.rating}`
    ].filter(Boolean).join(" \xB7 ");
    if (meta) body.createDiv({ cls: "game-dashboard-detail-meta", text: meta });
    const facts = body.createDiv({ cls: "game-dashboard-detail-facts" });
    [
      entry.platform ? `Platform \xB7 ${entry.platform}` : "",
      entry.progress ? `Progress \xB7 ${entry.progress}` : "",
      entry.rating ? `Rating \xB7 ${entry.rating}` : ""
    ].filter(Boolean).forEach((text) => {
      facts.createDiv({ cls: "game-dashboard-detail-fact", text });
    });
    if (facts.childElementCount === 0) facts.remove();
    const summary = body.createEl("p", {
      cls: "game-dashboard-detail-summary",
      text: entry.summary || "\u6682\u65E0\u6458\u8981\u3002\u540E\u7EED\u53EF\u4EE5\u901A\u8FC7\u4E3B\u6587\u6863 frontmatter \u6216\u6B63\u6587\u540C\u6B65\u8865\u5168\u3002"
    });
    summary.setAttribute("dir", "auto");
    const actions = body.createDiv({ cls: "game-dashboard-action-row" });
    actions.appendChild(this.createFileLink("\u6253\u5F00\u4E3B\u7B14\u8BB0", entry.mainFile, "game-dashboard-button primary"));
    if (entry.officialUrl) actions.appendChild(this.createExternalLink("\u5B98\u65B9\u94FE\u63A5", entry.officialUrl, "game-dashboard-button"));
    if (entry.detailUrl) actions.appendChild(this.createExternalLink("\u8BE6\u60C5\u9875", entry.detailUrl, "game-dashboard-button"));
    const deleteButton = actions.createEl("button", { cls: "game-dashboard-button danger", text: "\u5220\u9664\u6E38\u620F" });
    deleteButton.addEventListener("click", async () => {
      new DeleteGameConfirmModal(this.app, entry, async () => {
        this.hideTooltip();
        if (this.selectedPath === entry.folder.path) this.selectedPath = null;
        await this.plugin.deleteGame(entry);
      }).open();
    });
    const side = content.createDiv({ cls: "game-dashboard-detail-side" });
    const related = side.createDiv({ cls: "game-dashboard-related" });
    related.createEl("h4", { cls: "game-dashboard-side-title", text: "\u5173\u8054\u7B14\u8BB0" });
    const notes = related.createDiv({ cls: "game-dashboard-note-list" });
    if (entry.notes.length === 0) {
      notes.createDiv({ cls: "game-dashboard-empty-inline", text: "\u8FD8\u6CA1\u6709\u5173\u8054\u7B14\u8BB0\u3002" });
    } else {
      entry.notes.forEach((file) => {
        notes.appendChild(this.createFileLink(file.basename, file, "game-dashboard-note-chip"));
      });
    }
  }
  renderSections(container, entries) {
    const host = container.createDiv({ cls: "game-dashboard-sections" });
    for (const section of SECTIONS) {
      const items = entries.filter(section.match);
      const collapsed = this.collapsedSections[section.key];
      const wrapper = host.createDiv({
        cls: `game-dashboard-section ${collapsed ? "is-collapsed" : "is-expanded"}`
      });
      const header = wrapper.createDiv({ cls: "game-dashboard-section-header" });
      const heading = header.createDiv({ cls: "game-dashboard-section-heading" });
      heading.createEl("h3", { cls: "game-dashboard-section-title", text: section.title });
      heading.createDiv({
        cls: "game-dashboard-section-subtitle",
        text: `${items.length} items \xB7 ${section.subtitle}`
      });
      const toggle = header.createEl("button", {
        cls: "game-dashboard-toggle",
        text: collapsed ? "\u5C55\u5F00" : "\u6536\u8D77"
      });
      toggle.addEventListener("click", () => {
        this.collapsedSections[section.key] = !this.collapsedSections[section.key];
        wrapper.toggleClass("is-collapsed", this.collapsedSections[section.key]);
        wrapper.toggleClass("is-expanded", !this.collapsedSections[section.key]);
        toggle.setText(this.collapsedSections[section.key] ? "\u5C55\u5F00" : "\u6536\u8D77");
      });
      const body = wrapper.createDiv({ cls: "game-dashboard-section-body" });
      const grid = body.createDiv({ cls: "game-dashboard-grid" });
      if (items.length === 0) {
        grid.createDiv({ cls: "game-dashboard-empty", text: "\u5F53\u524D\u5206\u7EC4\u6CA1\u6709\u5339\u914D\u6761\u76EE\u3002" });
      } else {
        items.forEach((entry) => grid.appendChild(this.buildCard(entry)));
      }
    }
  }
  renderEndcap(container, count) {
    const endcap = container.createDiv({ cls: "game-dashboard-endcap" });
    endcap.createDiv({ cls: "game-dashboard-endcap-line" });
    endcap.createDiv({
      cls: "game-dashboard-endcap-text",
      text: count > 0 ? `End of Library \xB7 ${count} visible` : "End of Library"
    });
  }
  buildCard(entry) {
    const card = createNode("button", { cls: "game-dashboard-card" });
    if (entry.folder.path === this.selectedPath) card.addClass("is-selected");
    card.addEventListener("click", async () => {
      this.selectedPath = entry.folder.path;
      this.hideTooltip();
      this.preserveScroll(() => this.renderContent());
    });
    card.addEventListener("dblclick", async () => {
      this.hideTooltip();
      if (entry.mainFile) await this.app.workspace.getLeaf("tab").openFile(entry.mainFile);
    });
    card.addEventListener("mouseenter", () => this.showTooltip(card, entry));
    card.addEventListener("mouseleave", () => this.hideTooltip());
    card.addEventListener("focus", () => this.showTooltip(card, entry));
    card.addEventListener("blur", () => this.hideTooltip());
    const cover = card.createDiv({ cls: "game-dashboard-card-cover" });
    if (entry.posterFile) {
      cover.createEl("img", {
        attr: {
          src: this.app.vault.getResourcePath(entry.posterFile),
          alt: `${entry.title} poster`
        }
      });
    } else {
      cover.createDiv({ cls: "game-dashboard-card-fallback", text: "\u{1F3AE}" });
    }
    cover.createDiv({ cls: "game-dashboard-card-gloss" });
    return card;
  }
  renderPosterOverlay(entry, compact) {
    const overlay = createNode("div", {
      cls: compact ? "game-dashboard-poster-overlay compact" : "game-dashboard-poster-overlay"
    });
    const meta = overlay.createDiv({ cls: "game-dashboard-poster-meta" });
    meta.createDiv({ cls: "game-dashboard-poster-kind", text: "\u6E38\u620F" });
    meta.appendChild(this.createStatusPill(entry.status));
    overlay.createDiv({ cls: "game-dashboard-poster-title", text: entry.title });
    const sub = [entry.developer, entry.platform, entry.progress].filter(Boolean).join(" \xB7 ");
    if (sub) overlay.createDiv({ cls: "game-dashboard-poster-sub", text: sub });
    return overlay;
  }
  createStatusPill(status) {
    var _a;
    return createNode("span", {
      cls: `game-dashboard-pill game-dashboard-pill-${status || "unsorted"}`,
      text: (_a = STATUS_LABELS[status]) != null ? _a : STATUS_LABELS.unsorted
    });
  }
  createFileLink(label, file, className = "") {
    const link = createNode(file ? "a" : "span", { text: label, cls: className });
    if (!file) return link;
    link.href = file.path;
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.app.workspace.getLeaf("tab").openFile(file);
    });
    return link;
  }
  createExternalLink(label, url, className = "") {
    const link = createNode("a", { text: label, cls: className });
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }
  showTooltip(anchor, entry) {
    if (!this.floatingTooltipEl) return;
    this.floatingTooltipEl.empty();
    const card = this.floatingTooltipEl.createDiv({ cls: "game-dashboard-tooltip-card" });
    const title = card.createDiv({ cls: "game-dashboard-tooltip-title", text: entry.title });
    const preview = card.createDiv({ cls: "game-dashboard-tooltip-preview" });
    if (entry.posterFile) {
      preview.createEl("img", {
        attr: {
          src: this.app.vault.getResourcePath(entry.posterFile),
          alt: `${entry.title} poster`
        }
      });
    } else {
      preview.createDiv({ cls: "game-dashboard-card-fallback", text: "\u{1F3AE}" });
    }
    const tooltipWidth = 280;
    const tooltipHeight = 320;
    const gap = 16;
    const rect = anchor.getBoundingClientRect();
    const placeRight = window.innerWidth - rect.right >= tooltipWidth + gap || rect.left < tooltipWidth;
    const left = placeRight ? Math.min(rect.right + gap, window.innerWidth - tooltipWidth - 12) : Math.max(12, rect.left - tooltipWidth - gap);
    const top = Math.max(12, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 12));
    this.floatingTooltipEl.style.left = `${left}px`;
    this.floatingTooltipEl.style.top = `${top}px`;
    this.floatingTooltipEl.classList.add("is-visible");
  }
  hideTooltip() {
    if (!this.floatingTooltipEl) return;
    this.floatingTooltipEl.classList.remove("is-visible");
    this.floatingTooltipEl.style.left = "-9999px";
    this.floatingTooltipEl.style.top = "-9999px";
  }
  filterEntries(entries) {
    const query = this.query.toLowerCase();
    const filtered = entries.filter((entry) => {
      if (this.statusFilter !== "all" && entry.status !== this.statusFilter) return false;
      if (!query) return true;
      return entry.title.toLowerCase().includes(query) || entry.developer.toLowerCase().includes(query) || entry.platform.toLowerCase().includes(query) || entry.relativePath.toLowerCase().includes(query);
    });
    if (this.sortMode === "name") {
      return filtered.sort((left, right) => left.title.localeCompare(right.title, "zh-Hans-CN"));
    }
    return filtered.sort((left, right) => right.updatedAt - left.updatedAt);
  }
};

// src/main.ts
function sanitizeFolderName(name) {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}
function yamlScalar(value) {
  return JSON.stringify(value != null ? value : "");
}
function yamlList(values) {
  return `[${values.map((item) => JSON.stringify(item)).join(", ")}]`;
}
function normalizeTitle(value) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}
function choosePreferred(primary, secondary) {
  return primary || secondary;
}
function chooseLonger(primary, secondary) {
  if (!primary) return secondary;
  if (!secondary) return primary;
  return secondary.length > primary.length ? secondary : primary;
}
function mergeLists(primary, secondary) {
  return [...new Set([...primary, ...secondary].filter(Boolean))];
}
function chooseBySource(base, extra, field, preferred) {
  const preferredValue = base.source === preferred ? base[field] : extra.source === preferred ? extra[field] : "";
  return preferredValue || base[field] || extra[field] || "";
}
async function ensureFolder(plugin, path) {
  const normalized = path.replace(/\/+$/g, "");
  const existing = plugin.app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian7.TFolder) return existing;
  if (existing instanceof import_obsidian7.TFile) throw new Error(`Path is a file: ${normalized}`);
  const segments = normalized.split("/").filter(Boolean);
  let current = "";
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    const node = plugin.app.vault.getAbstractFileByPath(current);
    if (!node) {
      await plugin.app.vault.createFolder(current);
    } else if (!(node instanceof import_obsidian7.TFolder)) {
      throw new Error(`Path segment is a file: ${current}`);
    }
  }
  const resolved = plugin.app.vault.getAbstractFileByPath(normalized);
  if (!(resolved instanceof import_obsidian7.TFolder)) {
    throw new Error(`Unable to resolve folder: ${normalized}`);
  }
  return resolved;
}
var GameDashboardPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.igdb = new IgdbClient(this);
    this.steam = new SteamClient();
    this.refreshTimer = null;
    this.refreshSuppressedCount = 0;
    this.pendingRefreshWhileSuppressed = false;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GameDashboardSettingTab(this.app, this));
    this.registerView(
      GAME_DASHBOARD_VIEW_TYPE,
      (leaf) => new GameDashboardView(leaf, this)
    );
    this.addRibbonIcon("gamepad-2", "Open Game Dashboard", async () => {
      await this.activateView();
    });
    this.addCommand({
      id: "open-game-dashboard",
      name: "Open Game Dashboard",
      callback: async () => {
        await this.activateView();
      }
    });
    this.addCommand({
      id: "create-game-entry",
      name: "Create game entry",
      callback: () => {
        this.openCreateGameModal();
      }
    });
    this.registerEvent(this.app.vault.on("create", async () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.vault.on("delete", async () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.vault.on("rename", async () => this.requestRefreshAllViews()));
    this.registerEvent(this.app.metadataCache.on("changed", async () => this.requestRefreshAllViews()));
  }
  async onunload() {
    await this.app.workspace.detachLeavesOfType(GAME_DASHBOARD_VIEW_TYPE);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  beginModalSession() {
    this.refreshSuppressedCount += 1;
  }
  endModalSession() {
    this.refreshSuppressedCount = Math.max(0, this.refreshSuppressedCount - 1);
    if (this.refreshSuppressedCount === 0 && this.pendingRefreshWhileSuppressed) {
      this.pendingRefreshWhileSuppressed = false;
      void this.requestRefreshAllViews();
    }
  }
  async getGames() {
    return await indexGames(this.app, this.settings);
  }
  async refreshAllViews() {
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
  async requestRefreshAllViews() {
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
  async activateView() {
    var _a;
    const workspace = this.app.workspace;
    let leaf = (_a = workspace.getLeavesOfType(GAME_DASHBOARD_VIEW_TYPE).find((candidate) => candidate.getRoot() === workspace.rootSplit)) != null ? _a : null;
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: GAME_DASHBOARD_VIEW_TYPE,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  openCreateGameModal() {
    new CreateGameModal(this.app, this).open();
  }
  async searchExternalGames(query) {
    const [igdbResults, steamResults] = await Promise.allSettled([
      this.igdb.searchGames(query),
      this.steam.searchGames(query)
    ]);
    const results = [];
    if (igdbResults.status === "fulfilled") results.push(...igdbResults.value);
    if (steamResults.status === "fulfilled") results.push(...steamResults.value);
    const deduped = /* @__PURE__ */ new Map();
    for (const result of results) {
      const key = `${result.source}:${result.title.toLowerCase()}:${result.year}`;
      if (!deduped.has(key)) deduped.set(key, result);
    }
    return [...deduped.values()];
  }
  async enrichImportedCandidate(candidate) {
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
  async createGame(input) {
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
    const posterFileName = input.posterUrl ? await this.igdb.downloadImage(assetsPath, title, input.posterUrl, "poster") : "";
    const bannerFileName = input.bannerUrl ? await this.igdb.downloadImage(assetsPath, title, input.bannerUrl, "banner") : "";
    const filePath = `${folderPath}/${this.settings.mainNoteName}`;
    const file = await this.app.vault.create(filePath, this.buildMainNote(input, posterFileName, bannerFileName));
    if (this.settings.openNoteAfterCreate) {
      await this.app.workspace.getLeaf("tab").openFile(file);
    }
    await this.activateView();
    await this.requestRefreshAllViews();
    new import_obsidian7.Notice(`Created ${title}`);
  }
  async deleteGame(entry) {
    await this.app.vault.trash(entry.folder, false);
    await this.requestRefreshAllViews();
    new import_obsidian7.Notice(`Deleted ${entry.title}`);
  }
  async findBestComplement(title, source) {
    var _a;
    const candidates = source === "steam" ? await this.steam.searchGames(title) : await this.igdb.searchGames(title);
    if (candidates.length === 0) return null;
    const normalized = normalizeTitle(title);
    const exact = candidates.find((candidate) => normalizeTitle(candidate.title) === normalized);
    if (exact) return exact;
    const partial = candidates.find((candidate) => {
      const value = normalizeTitle(candidate.title);
      return value.includes(normalized) || normalized.includes(value);
    });
    return (_a = partial != null ? partial : candidates[0]) != null ? _a : null;
  }
  mergeCandidates(base, extra) {
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
  buildMainNote(input, posterFileName, bannerFileName) {
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
    ].filter(Boolean).join("\n");
    const linksLines = [
      input.officialUrl ? `- Official: ${input.officialUrl}` : "",
      input.steamUrl ? `- Steam: ${input.steamUrl}` : "",
      input.igdbUrl ? `- IGDB: ${input.igdbUrl}` : "",
      input.detailUrl && input.detailUrl !== input.steamUrl && input.detailUrl !== input.igdbUrl ? `- Detail: ${input.detailUrl}` : ""
    ].filter(Boolean).join("\n");
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
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL2NyZWF0ZUdhbWVNb2RhbC50cyIsICJzcmMvaWdkYi50cyIsICJzcmMvaW5kZXhlci50cyIsICJzcmMvc2V0dGluZ3MudHMiLCAic3JjL3N0ZWFtLnRzIiwgInNyYy92aWV3LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgVEZpbGUsIFRGb2xkZXIsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IENyZWF0ZUdhbWVNb2RhbCB9IGZyb20gXCIuL2NyZWF0ZUdhbWVNb2RhbFwiO1xuaW1wb3J0IHsgSWdkYkNsaWVudCB9IGZyb20gXCIuL2lnZGJcIjtcbmltcG9ydCB7IGluZGV4R2FtZXMgfSBmcm9tIFwiLi9pbmRleGVyXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCBHYW1lRGFzaGJvYXJkU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBDcmVhdGVHYW1lSW5wdXQsIEdhbWVEYXNoYm9hcmRTZXR0aW5ncywgR2FtZUVudHJ5LCBHYW1lU2VhcmNoQ2FuZGlkYXRlIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IFN0ZWFtQ2xpZW50IH0gZnJvbSBcIi4vc3RlYW1cIjtcbmltcG9ydCB7IEdBTUVfREFTSEJPQVJEX1ZJRVdfVFlQRSwgR2FtZURhc2hib2FyZFZpZXcgfSBmcm9tIFwiLi92aWV3XCI7XG5cbmZ1bmN0aW9uIHNhbml0aXplRm9sZGVyTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbmFtZS5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgXCJcIikudHJpbSgpO1xufVxuXG5mdW5jdGlvbiB5YW1sU2NhbGFyKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUgPz8gXCJcIik7XG59XG5cbmZ1bmN0aW9uIHlhbWxMaXN0KHZhbHVlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYFske3ZhbHVlcy5tYXAoKGl0ZW0pID0+IEpTT04uc3RyaW5naWZ5KGl0ZW0pKS5qb2luKFwiLCBcIil9XWA7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRpdGxlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXmEtejAtOVxcdTRlMDAtXFx1OWZhNV0rL2csIFwiXCIpO1xufVxuXG5mdW5jdGlvbiBjaG9vc2VQcmVmZXJyZWQocHJpbWFyeTogc3RyaW5nLCBzZWNvbmRhcnk6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwcmltYXJ5IHx8IHNlY29uZGFyeTtcbn1cblxuZnVuY3Rpb24gY2hvb3NlTG9uZ2VyKHByaW1hcnk6IHN0cmluZywgc2Vjb25kYXJ5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXByaW1hcnkpIHJldHVybiBzZWNvbmRhcnk7XG4gIGlmICghc2Vjb25kYXJ5KSByZXR1cm4gcHJpbWFyeTtcbiAgcmV0dXJuIHNlY29uZGFyeS5sZW5ndGggPiBwcmltYXJ5Lmxlbmd0aCA/IHNlY29uZGFyeSA6IHByaW1hcnk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlTGlzdHMocHJpbWFyeTogc3RyaW5nW10sIHNlY29uZGFyeTogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHJldHVybiBbLi4ubmV3IFNldChbLi4ucHJpbWFyeSwgLi4uc2Vjb25kYXJ5XS5maWx0ZXIoQm9vbGVhbikpXTtcbn1cblxuZnVuY3Rpb24gY2hvb3NlQnlTb3VyY2UoXG4gIGJhc2U6IEdhbWVTZWFyY2hDYW5kaWRhdGUsXG4gIGV4dHJhOiBHYW1lU2VhcmNoQ2FuZGlkYXRlLFxuICBmaWVsZDogXCJwb3N0ZXJVcmxcIiB8IFwiYmFubmVyVXJsXCIsXG4gIHByZWZlcnJlZDogXCJzdGVhbVwiIHwgXCJpZ2RiXCJcbik6IHN0cmluZyB7XG4gIGNvbnN0IHByZWZlcnJlZFZhbHVlID1cbiAgICBiYXNlLnNvdXJjZSA9PT0gcHJlZmVycmVkID8gYmFzZVtmaWVsZF0gOiBleHRyYS5zb3VyY2UgPT09IHByZWZlcnJlZCA/IGV4dHJhW2ZpZWxkXSA6IFwiXCI7XG4gIHJldHVybiBwcmVmZXJyZWRWYWx1ZSB8fCBiYXNlW2ZpZWxkXSB8fCBleHRyYVtmaWVsZF0gfHwgXCJcIjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlRm9sZGVyKHBsdWdpbjogUGx1Z2luLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHBhdGgucmVwbGFjZSgvXFwvKyQvZywgXCJcIik7XG4gIGNvbnN0IGV4aXN0aW5nID0gcGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybiBleGlzdGluZztcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHRocm93IG5ldyBFcnJvcihgUGF0aCBpcyBhIGZpbGU6ICR7bm9ybWFsaXplZH1gKTtcblxuICBjb25zdCBzZWdtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoXCIvXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgbGV0IGN1cnJlbnQgPSBcIlwiO1xuXG4gIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgIGN1cnJlbnQgPSBjdXJyZW50ID8gYCR7Y3VycmVudH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xuICAgIGNvbnN0IG5vZGUgPSBwbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50KTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIGF3YWl0IHBsdWdpbi5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cnJlbnQpO1xuICAgIH0gZWxzZSBpZiAoIShub2RlIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGF0aCBzZWdtZW50IGlzIGEgZmlsZTogJHtjdXJyZW50fWApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlc29sdmVkID0gcGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZCk7XG4gIGlmICghKHJlc29sdmVkIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZXNvbHZlIGZvbGRlcjogJHtub3JtYWxpemVkfWApO1xuICB9XG4gIHJldHVybiByZXNvbHZlZDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2FtZURhc2hib2FyZFBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBHYW1lRGFzaGJvYXJkU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuICBpZ2RiID0gbmV3IElnZGJDbGllbnQodGhpcyk7XG4gIHN0ZWFtID0gbmV3IFN0ZWFtQ2xpZW50KCk7XG4gIHByaXZhdGUgcmVmcmVzaFRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWZyZXNoU3VwcHJlc3NlZENvdW50ID0gMDtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVmcmVzaFdoaWxlU3VwcHJlc3NlZCA9IGZhbHNlO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBHYW1lRGFzaGJvYXJkU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoXG4gICAgICBHQU1FX0RBU0hCT0FSRF9WSUVXX1RZUEUsXG4gICAgICAobGVhZikgPT4gbmV3IEdhbWVEYXNoYm9hcmRWaWV3KGxlYWYsIHRoaXMpXG4gICAgKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImdhbWVwYWQtMlwiLCBcIk9wZW4gR2FtZSBEYXNoYm9hcmRcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLWdhbWUtZGFzaGJvYXJkXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gR2FtZSBEYXNoYm9hcmRcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuYWN0aXZhdGVWaWV3KCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiY3JlYXRlLWdhbWUtZW50cnlcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIGdhbWUgZW50cnlcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XG4gICAgICAgIHRoaXMub3BlbkNyZWF0ZUdhbWVNb2RhbCgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwiY3JlYXRlXCIsIGFzeW5jICgpID0+IHRoaXMucmVxdWVzdFJlZnJlc2hBbGxWaWV3cygpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwiZGVsZXRlXCIsIGFzeW5jICgpID0+IHRoaXMucmVxdWVzdFJlZnJlc2hBbGxWaWV3cygpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKFwicmVuYW1lXCIsIGFzeW5jICgpID0+IHRoaXMucmVxdWVzdFJlZnJlc2hBbGxWaWV3cygpKSk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJjaGFuZ2VkXCIsIGFzeW5jICgpID0+IHRoaXMucmVxdWVzdFJlZnJlc2hBbGxWaWV3cygpKSk7XG4gIH1cblxuICBhc3luYyBvbnVubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKEdBTUVfREFTSEJPQVJEX1ZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIGJlZ2luTW9kYWxTZXNzaW9uKCk6IHZvaWQge1xuICAgIHRoaXMucmVmcmVzaFN1cHByZXNzZWRDb3VudCArPSAxO1xuICB9XG5cbiAgZW5kTW9kYWxTZXNzaW9uKCk6IHZvaWQge1xuICAgIHRoaXMucmVmcmVzaFN1cHByZXNzZWRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMucmVmcmVzaFN1cHByZXNzZWRDb3VudCAtIDEpO1xuICAgIGlmICh0aGlzLnJlZnJlc2hTdXBwcmVzc2VkQ291bnQgPT09IDAgJiYgdGhpcy5wZW5kaW5nUmVmcmVzaFdoaWxlU3VwcHJlc3NlZCkge1xuICAgICAgdGhpcy5wZW5kaW5nUmVmcmVzaFdoaWxlU3VwcHJlc3NlZCA9IGZhbHNlO1xuICAgICAgdm9pZCB0aGlzLnJlcXVlc3RSZWZyZXNoQWxsVmlld3MoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRHYW1lcygpOiBQcm9taXNlPEdhbWVFbnRyeVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IGluZGV4R2FtZXModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgYXN5bmMgcmVmcmVzaEFsbFZpZXdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoR0FNRV9EQVNIQk9BUkRfVklFV19UWVBFKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGxlYXZlcy5tYXAoYXN5bmMgKGxlYWYpID0+IHtcbiAgICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBHYW1lRGFzaGJvYXJkVmlldykge1xuICAgICAgICAgIGF3YWl0IHZpZXcucmVmcmVzaCgpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyByZXF1ZXN0UmVmcmVzaEFsbFZpZXdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnJlZnJlc2hTdXBwcmVzc2VkQ291bnQgPiAwKSB7XG4gICAgICB0aGlzLnBlbmRpbmdSZWZyZXNoV2hpbGVTdXBwcmVzc2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZWZyZXNoVGltZXIgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5yZWZyZXNoVGltZXIpO1xuICAgIH1cblxuICAgIHRoaXMucmVmcmVzaFRpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5yZWZyZXNoVGltZXIgPSBudWxsO1xuICAgICAgdm9pZCB0aGlzLnJlZnJlc2hBbGxWaWV3cygpO1xuICAgIH0sIDgwKTtcbiAgfVxuXG4gIGFzeW5jIGFjdGl2YXRlVmlldygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB3b3Jrc3BhY2UgPSB0aGlzLmFwcC53b3Jrc3BhY2U7XG4gICAgbGV0IGxlYWY6IFdvcmtzcGFjZUxlYWYgfCBudWxsID1cbiAgICAgIHdvcmtzcGFjZVxuICAgICAgICAuZ2V0TGVhdmVzT2ZUeXBlKEdBTUVfREFTSEJPQVJEX1ZJRVdfVFlQRSlcbiAgICAgICAgLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLmdldFJvb3QoKSA9PT0gd29ya3NwYWNlLnJvb3RTcGxpdCkgPz8gbnVsbDtcblxuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuICAgICAgICB0eXBlOiBHQU1FX0RBU0hCT0FSRF9WSUVXX1RZUEUsXG4gICAgICAgIGFjdGl2ZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBvcGVuQ3JlYXRlR2FtZU1vZGFsKCk6IHZvaWQge1xuICAgIG5ldyBDcmVhdGVHYW1lTW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIHNlYXJjaEV4dGVybmFsR2FtZXMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8R2FtZVNlYXJjaENhbmRpZGF0ZVtdPiB7XG4gICAgY29uc3QgW2lnZGJSZXN1bHRzLCBzdGVhbVJlc3VsdHNdID0gYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtcbiAgICAgIHRoaXMuaWdkYi5zZWFyY2hHYW1lcyhxdWVyeSksXG4gICAgICB0aGlzLnN0ZWFtLnNlYXJjaEdhbWVzKHF1ZXJ5KVxuICAgIF0pO1xuXG4gICAgY29uc3QgcmVzdWx0czogR2FtZVNlYXJjaENhbmRpZGF0ZVtdID0gW107XG4gICAgaWYgKGlnZGJSZXN1bHRzLnN0YXR1cyA9PT0gXCJmdWxmaWxsZWRcIikgcmVzdWx0cy5wdXNoKC4uLmlnZGJSZXN1bHRzLnZhbHVlKTtcbiAgICBpZiAoc3RlYW1SZXN1bHRzLnN0YXR1cyA9PT0gXCJmdWxmaWxsZWRcIikgcmVzdWx0cy5wdXNoKC4uLnN0ZWFtUmVzdWx0cy52YWx1ZSk7XG5cbiAgICBjb25zdCBkZWR1cGVkID0gbmV3IE1hcDxzdHJpbmcsIEdhbWVTZWFyY2hDYW5kaWRhdGU+KCk7XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgY29uc3Qga2V5ID0gYCR7cmVzdWx0LnNvdXJjZX06JHtyZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKX06JHtyZXN1bHQueWVhcn1gO1xuICAgICAgaWYgKCFkZWR1cGVkLmhhcyhrZXkpKSBkZWR1cGVkLnNldChrZXksIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFsuLi5kZWR1cGVkLnZhbHVlcygpXTtcbiAgfVxuXG4gIGFzeW5jIGVucmljaEltcG9ydGVkQ2FuZGlkYXRlKGNhbmRpZGF0ZTogR2FtZVNlYXJjaENhbmRpZGF0ZSk6IFByb21pc2U8R2FtZVNlYXJjaENhbmRpZGF0ZT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoY2FuZGlkYXRlLnNvdXJjZSA9PT0gXCJzdGVhbVwiKSB7XG4gICAgICAgIGNvbnN0IGlnZGJNYXRjaCA9IGF3YWl0IHRoaXMuZmluZEJlc3RDb21wbGVtZW50KGNhbmRpZGF0ZS50aXRsZSwgXCJpZ2RiXCIpO1xuICAgICAgICByZXR1cm4gaWdkYk1hdGNoID8gdGhpcy5tZXJnZUNhbmRpZGF0ZXMoY2FuZGlkYXRlLCBpZ2RiTWF0Y2gpIDogY2FuZGlkYXRlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGVhbU1hdGNoID0gYXdhaXQgdGhpcy5maW5kQmVzdENvbXBsZW1lbnQoY2FuZGlkYXRlLnRpdGxlLCBcInN0ZWFtXCIpO1xuICAgICAgcmV0dXJuIHN0ZWFtTWF0Y2ggPyB0aGlzLm1lcmdlQ2FuZGlkYXRlcyhjYW5kaWRhdGUsIHN0ZWFtTWF0Y2gpIDogY2FuZGlkYXRlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGVucmljaCBpbXBvcnRlZCBjYW5kaWRhdGVcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVHYW1lKGlucHV0OiBDcmVhdGVHYW1lSW5wdXQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB0aXRsZSA9IGlucHV0LnRpdGxlLnRyaW0oKTtcbiAgICBpZiAoIXRpdGxlKSB0aHJvdyBuZXcgRXJyb3IoXCJUaXRsZSBpcyByZXF1aXJlZC5cIik7XG5cbiAgICBjb25zdCByb290ID0gYXdhaXQgZW5zdXJlRm9sZGVyKHRoaXMsIHRoaXMuc2V0dGluZ3MuZ2FtZXNSb290KTtcbiAgICBsZXQgZm9sZGVyTmFtZSA9IHNhbml0aXplRm9sZGVyTmFtZSh0aXRsZSkgfHwgXCJVbnRpdGxlZCBHYW1lXCI7XG4gICAgbGV0IGZvbGRlclBhdGggPSBgJHtyb290LnBhdGh9LyR7Zm9sZGVyTmFtZX1gO1xuICAgIGxldCBzdWZmaXggPSAyO1xuXG4gICAgd2hpbGUgKHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoKSkge1xuICAgICAgZm9sZGVyUGF0aCA9IGAke3Jvb3QucGF0aH0vJHtmb2xkZXJOYW1lfSAke3N1ZmZpeH1gO1xuICAgICAgc3VmZml4ICs9IDE7XG4gICAgfVxuXG4gICAgYXdhaXQgZW5zdXJlRm9sZGVyKHRoaXMsIGZvbGRlclBhdGgpO1xuICAgIGNvbnN0IGFzc2V0c1BhdGggPSBgJHtmb2xkZXJQYXRofS9HYW1lQXNzZXRzYDtcbiAgICBhd2FpdCBlbnN1cmVGb2xkZXIodGhpcywgYXNzZXRzUGF0aCk7XG5cbiAgICBjb25zdCBwb3N0ZXJGaWxlTmFtZSA9IGlucHV0LnBvc3RlclVybFxuICAgICAgPyBhd2FpdCB0aGlzLmlnZGIuZG93bmxvYWRJbWFnZShhc3NldHNQYXRoLCB0aXRsZSwgaW5wdXQucG9zdGVyVXJsLCBcInBvc3RlclwiKVxuICAgICAgOiBcIlwiO1xuICAgIGNvbnN0IGJhbm5lckZpbGVOYW1lID0gaW5wdXQuYmFubmVyVXJsXG4gICAgICA/IGF3YWl0IHRoaXMuaWdkYi5kb3dubG9hZEltYWdlKGFzc2V0c1BhdGgsIHRpdGxlLCBpbnB1dC5iYW5uZXJVcmwsIFwiYmFubmVyXCIpXG4gICAgICA6IFwiXCI7XG5cbiAgICBjb25zdCBmaWxlUGF0aCA9IGAke2ZvbGRlclBhdGh9LyR7dGhpcy5zZXR0aW5ncy5tYWluTm90ZU5hbWV9YDtcbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKGZpbGVQYXRoLCB0aGlzLmJ1aWxkTWFpbk5vdGUoaW5wdXQsIHBvc3RlckZpbGVOYW1lLCBiYW5uZXJGaWxlTmFtZSkpO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Mub3Blbk5vdGVBZnRlckNyZWF0ZSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIikub3BlbkZpbGUoZmlsZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcbiAgICBhd2FpdCB0aGlzLnJlcXVlc3RSZWZyZXNoQWxsVmlld3MoKTtcbiAgICBuZXcgTm90aWNlKGBDcmVhdGVkICR7dGl0bGV9YCk7XG4gIH1cblxuICBhc3luYyBkZWxldGVHYW1lKGVudHJ5OiBHYW1lRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC50cmFzaChlbnRyeS5mb2xkZXIsIGZhbHNlKTtcbiAgICBhd2FpdCB0aGlzLnJlcXVlc3RSZWZyZXNoQWxsVmlld3MoKTtcbiAgICBuZXcgTm90aWNlKGBEZWxldGVkICR7ZW50cnkudGl0bGV9YCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGZpbmRCZXN0Q29tcGxlbWVudCh0aXRsZTogc3RyaW5nLCBzb3VyY2U6IFwic3RlYW1cIiB8IFwiaWdkYlwiKTogUHJvbWlzZTxHYW1lU2VhcmNoQ2FuZGlkYXRlIHwgbnVsbD4ge1xuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPVxuICAgICAgc291cmNlID09PSBcInN0ZWFtXCIgPyBhd2FpdCB0aGlzLnN0ZWFtLnNlYXJjaEdhbWVzKHRpdGxlKSA6IGF3YWl0IHRoaXMuaWdkYi5zZWFyY2hHYW1lcyh0aXRsZSk7XG4gICAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVUaXRsZSh0aXRsZSk7XG4gICAgY29uc3QgZXhhY3QgPSBjYW5kaWRhdGVzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gbm9ybWFsaXplVGl0bGUoY2FuZGlkYXRlLnRpdGxlKSA9PT0gbm9ybWFsaXplZCk7XG4gICAgaWYgKGV4YWN0KSByZXR1cm4gZXhhY3Q7XG5cbiAgICBjb25zdCBwYXJ0aWFsID0gY2FuZGlkYXRlcy5maW5kKChjYW5kaWRhdGUpID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplVGl0bGUoY2FuZGlkYXRlLnRpdGxlKTtcbiAgICAgIHJldHVybiB2YWx1ZS5pbmNsdWRlcyhub3JtYWxpemVkKSB8fCBub3JtYWxpemVkLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGFydGlhbCA/PyBjYW5kaWRhdGVzWzBdID8/IG51bGw7XG4gIH1cblxuICBwcml2YXRlIG1lcmdlQ2FuZGlkYXRlcyhiYXNlOiBHYW1lU2VhcmNoQ2FuZGlkYXRlLCBleHRyYTogR2FtZVNlYXJjaENhbmRpZGF0ZSk6IEdhbWVTZWFyY2hDYW5kaWRhdGUge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogYmFzZS5pZCxcbiAgICAgIHNvdXJjZTogYmFzZS5zb3VyY2UsXG4gICAgICB0aXRsZTogY2hvb3NlUHJlZmVycmVkKGJhc2UudGl0bGUsIGV4dHJhLnRpdGxlKSxcbiAgICAgIHN1bW1hcnk6IGNob29zZUxvbmdlcihiYXNlLnN1bW1hcnksIGV4dHJhLnN1bW1hcnkpLFxuICAgICAgZGV2ZWxvcGVyOiBjaG9vc2VQcmVmZXJyZWQoYmFzZS5kZXZlbG9wZXIsIGV4dHJhLmRldmVsb3BlciksXG4gICAgICBwdWJsaXNoZXI6IGNob29zZVByZWZlcnJlZChiYXNlLnB1Ymxpc2hlciwgZXh0cmEucHVibGlzaGVyKSxcbiAgICAgIHBsYXRmb3JtOiBjaG9vc2VQcmVmZXJyZWQoYmFzZS5wbGF0Zm9ybSwgZXh0cmEucGxhdGZvcm0pLFxuICAgICAgeWVhcjogY2hvb3NlUHJlZmVycmVkKGJhc2UueWVhciwgZXh0cmEueWVhciksXG4gICAgICByZWxlYXNlRGF0ZTogY2hvb3NlUHJlZmVycmVkKGJhc2UucmVsZWFzZURhdGUsIGV4dHJhLnJlbGVhc2VEYXRlKSxcbiAgICAgIHJhdGluZzogY2hvb3NlUHJlZmVycmVkKGJhc2UucmF0aW5nLCBleHRyYS5yYXRpbmcpLFxuICAgICAgb2ZmaWNpYWxVcmw6IGNob29zZVByZWZlcnJlZChiYXNlLm9mZmljaWFsVXJsLCBleHRyYS5vZmZpY2lhbFVybCksXG4gICAgICBkZXRhaWxVcmw6IGNob29zZVByZWZlcnJlZChiYXNlLmRldGFpbFVybCwgZXh0cmEuZGV0YWlsVXJsKSxcbiAgICAgIHN0ZWFtVXJsOiBjaG9vc2VQcmVmZXJyZWQoYmFzZS5zdGVhbVVybCwgZXh0cmEuc3RlYW1VcmwpLFxuICAgICAgaWdkYlVybDogY2hvb3NlUHJlZmVycmVkKGJhc2UuaWdkYlVybCwgZXh0cmEuaWdkYlVybCksXG4gICAgICBwb3N0ZXJVcmw6IGNob29zZUJ5U291cmNlKGJhc2UsIGV4dHJhLCBcInBvc3RlclVybFwiLCBcImlnZGJcIiksXG4gICAgICBiYW5uZXJVcmw6IGNob29zZUJ5U291cmNlKGJhc2UsIGV4dHJhLCBcImJhbm5lclVybFwiLCBcInN0ZWFtXCIpLFxuICAgICAgc3RvcnlsaW5lOiBjaG9vc2VMb25nZXIoYmFzZS5zdG9yeWxpbmUsIGV4dHJhLnN0b3J5bGluZSksXG4gICAgICBnZW5yZXM6IG1lcmdlTGlzdHMoYmFzZS5nZW5yZXMsIGV4dHJhLmdlbnJlcyksXG4gICAgICB0aGVtZXM6IG1lcmdlTGlzdHMoYmFzZS50aGVtZXMsIGV4dHJhLnRoZW1lcyksXG4gICAgICBtb2RlczogbWVyZ2VMaXN0cyhiYXNlLm1vZGVzLCBleHRyYS5tb2RlcyksXG4gICAgICBzY3JlZW5zaG90czogbWVyZ2VMaXN0cyhiYXNlLnNjcmVlbnNob3RzLCBleHRyYS5zY3JlZW5zaG90cylcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZE1haW5Ob3RlKGlucHV0OiBDcmVhdGVHYW1lSW5wdXQsIHBvc3RlckZpbGVOYW1lOiBzdHJpbmcsIGJhbm5lckZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IG1ldGFkYXRhTGluZXMgPSBbXG4gICAgICBpbnB1dC5kZXZlbG9wZXIgPyBgLSBEZXZlbG9wZXI6ICR7aW5wdXQuZGV2ZWxvcGVyfWAgOiBcIlwiLFxuICAgICAgaW5wdXQucHVibGlzaGVyID8gYC0gUHVibGlzaGVyOiAke2lucHV0LnB1Ymxpc2hlcn1gIDogXCJcIixcbiAgICAgIGlucHV0LnBsYXRmb3JtID8gYC0gUGxhdGZvcm06ICR7aW5wdXQucGxhdGZvcm19YCA6IFwiXCIsXG4gICAgICBpbnB1dC5yZWxlYXNlRGF0ZSA/IGAtIFJlbGVhc2UgRGF0ZTogJHtpbnB1dC5yZWxlYXNlRGF0ZX1gIDogXCJcIixcbiAgICAgIGlucHV0LnllYXIgPyBgLSBZZWFyOiAke2lucHV0LnllYXJ9YCA6IFwiXCIsXG4gICAgICBpbnB1dC5yYXRpbmcgPyBgLSBSYXRpbmc6ICR7aW5wdXQucmF0aW5nfWAgOiBcIlwiLFxuICAgICAgaW5wdXQuZ2VucmVzLmxlbmd0aCA/IGAtIEdlbnJlczogJHtpbnB1dC5nZW5yZXMuam9pbihcIiwgXCIpfWAgOiBcIlwiLFxuICAgICAgaW5wdXQudGhlbWVzLmxlbmd0aCA/IGAtIFRoZW1lczogJHtpbnB1dC50aGVtZXMuam9pbihcIiwgXCIpfWAgOiBcIlwiLFxuICAgICAgaW5wdXQubW9kZXMubGVuZ3RoID8gYC0gTW9kZXM6ICR7aW5wdXQubW9kZXMuam9pbihcIiwgXCIpfWAgOiBcIlwiXG4gICAgXVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG5cbiAgICBjb25zdCBsaW5rc0xpbmVzID0gW1xuICAgICAgaW5wdXQub2ZmaWNpYWxVcmwgPyBgLSBPZmZpY2lhbDogJHtpbnB1dC5vZmZpY2lhbFVybH1gIDogXCJcIixcbiAgICAgIGlucHV0LnN0ZWFtVXJsID8gYC0gU3RlYW06ICR7aW5wdXQuc3RlYW1Vcmx9YCA6IFwiXCIsXG4gICAgICBpbnB1dC5pZ2RiVXJsID8gYC0gSUdEQjogJHtpbnB1dC5pZ2RiVXJsfWAgOiBcIlwiLFxuICAgICAgaW5wdXQuZGV0YWlsVXJsICYmIGlucHV0LmRldGFpbFVybCAhPT0gaW5wdXQuc3RlYW1VcmwgJiYgaW5wdXQuZGV0YWlsVXJsICE9PSBpbnB1dC5pZ2RiVXJsID8gYC0gRGV0YWlsOiAke2lucHV0LmRldGFpbFVybH1gIDogXCJcIlxuICAgIF1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgcmV0dXJuIGAtLS1cbnR5cGU6IG1lZGlhXG5tZWRpYV90eXBlOiBnYW1lXG5tZWRpYV90aXRsZTogJHt5YW1sU2NhbGFyKGlucHV0LnRpdGxlKX1cbnRpdGxlOiAke3lhbWxTY2FsYXIoaW5wdXQudGl0bGUpfVxuc3RhdHVzOiAke3lhbWxTY2FsYXIoaW5wdXQuc3RhdHVzKX1cbmRldmVsb3BlcjogJHt5YW1sU2NhbGFyKGlucHV0LmRldmVsb3Blcil9XG5wdWJsaXNoZXI6ICR7eWFtbFNjYWxhcihpbnB1dC5wdWJsaXNoZXIpfVxucGxhdGZvcm06ICR7eWFtbFNjYWxhcihpbnB1dC5wbGF0Zm9ybSl9XG55ZWFyOiAke3lhbWxTY2FsYXIoaW5wdXQueWVhcil9XG5yZWxlYXNlX2RhdGU6ICR7eWFtbFNjYWxhcihpbnB1dC5yZWxlYXNlRGF0ZSl9XG5wcm9ncmVzczogJHt5YW1sU2NhbGFyKGlucHV0LnByb2dyZXNzKX1cbnJhdGluZzogJHt5YW1sU2NhbGFyKGlucHV0LnJhdGluZyl9XG5zdW1tYXJ5OiAke3lhbWxTY2FsYXIoaW5wdXQuc3VtbWFyeSl9XG5vZmZpY2lhbF91cmw6ICR7eWFtbFNjYWxhcihpbnB1dC5vZmZpY2lhbFVybCl9XG5kZXRhaWxfdXJsOiAke3lhbWxTY2FsYXIoaW5wdXQuZGV0YWlsVXJsKX1cbnN0ZWFtX3VybDogJHt5YW1sU2NhbGFyKGlucHV0LnN0ZWFtVXJsKX1cbmlnZGJfdXJsOiAke3lhbWxTY2FsYXIoaW5wdXQuaWdkYlVybCl9XG5jb3ZlcjogJHt5YW1sU2NhbGFyKHBvc3RlckZpbGVOYW1lID8gYEdhbWVBc3NldHMvJHtwb3N0ZXJGaWxlTmFtZX1gIDogXCJcIil9XG5wb3N0ZXI6ICR7eWFtbFNjYWxhcihwb3N0ZXJGaWxlTmFtZSA/IGBHYW1lQXNzZXRzLyR7cG9zdGVyRmlsZU5hbWV9YCA6IFwiXCIpfVxuYmFubmVyOiAke3lhbWxTY2FsYXIoYmFubmVyRmlsZU5hbWUgPyBgR2FtZUFzc2V0cy8ke2Jhbm5lckZpbGVOYW1lfWAgOiBcIlwiKX1cbmdlbnJlczogJHt5YW1sTGlzdChpbnB1dC5nZW5yZXMpfVxudGhlbWVzOiAke3lhbWxMaXN0KGlucHV0LnRoZW1lcyl9XG5tb2RlczogJHt5YW1sTGlzdChpbnB1dC5tb2Rlcyl9XG5zY3JlZW5zaG90czogJHt5YW1sTGlzdChpbnB1dC5zY3JlZW5zaG90cyl9XG5sb2NhbF9ub3RlczogW11cbi0tLVxuXG4jICR7aW5wdXQudGl0bGV9XG5cbiMjIFN1bW1hcnlcblxuJHtpbnB1dC5zdW1tYXJ5IHx8IFwiXCJ9XG5cbiMjIFN0b3J5bGluZVxuXG4ke2lucHV0LnN0b3J5bGluZSB8fCBcIlwifVxuXG4jIyBNZXRhZGF0YVxuXG4ke21ldGFkYXRhTGluZXMgfHwgXCItXCJ9XG5cbiMjIExpbmtzXG5cbiR7bGlua3NMaW5lcyB8fCBcIi1cIn1cblxuIyMgTm90ZXNcblxuLVxuYDtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgR2FtZURhc2hib2FyZFBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBDcmVhdGVHYW1lSW5wdXQsIEdhbWVTZWFyY2hDYW5kaWRhdGUgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5jb25zdCBTVEFUVVNFUyA9IFtcbiAgeyB2YWx1ZTogXCJhY3RpdmVcIiwgbGFiZWw6IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIgfSxcbiAgeyB2YWx1ZTogXCJiYWNrbG9nXCIsIGxhYmVsOiBcIlx1NUY4NVx1NUYwMFx1NTlDQlwiIH0sXG4gIHsgdmFsdWU6IFwicGF1c2VkXCIsIGxhYmVsOiBcIlx1NjY4Mlx1NTA1Q1wiIH0sXG4gIHsgdmFsdWU6IFwiY29tcGxldGVkXCIsIGxhYmVsOiBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiIH0sXG4gIHsgdmFsdWU6IFwiYXJjaGl2ZWRcIiwgbGFiZWw6IFwiXHU1REYyXHU1RjUyXHU2ODYzXCIgfVxuXTtcblxuZnVuY3Rpb24gZW1wdHlJbnB1dCgpOiBDcmVhdGVHYW1lSW5wdXQge1xuICByZXR1cm4ge1xuICAgIHRpdGxlOiBcIlwiLFxuICAgIHN0YXR1czogXCJiYWNrbG9nXCIsXG4gICAgZGV2ZWxvcGVyOiBcIlwiLFxuICAgIHB1Ymxpc2hlcjogXCJcIixcbiAgICBwbGF0Zm9ybTogXCJcIixcbiAgICB5ZWFyOiBcIlwiLFxuICAgIHJlbGVhc2VEYXRlOiBcIlwiLFxuICAgIHByb2dyZXNzOiBcIlwiLFxuICAgIHJhdGluZzogXCJcIixcbiAgICBzdW1tYXJ5OiBcIlwiLFxuICAgIHN0b3J5bGluZTogXCJcIixcbiAgICBvZmZpY2lhbFVybDogXCJcIixcbiAgICBkZXRhaWxVcmw6IFwiXCIsXG4gICAgc3RlYW1Vcmw6IFwiXCIsXG4gICAgaWdkYlVybDogXCJcIixcbiAgICBwb3N0ZXJVcmw6IFwiXCIsXG4gICAgYmFubmVyVXJsOiBcIlwiLFxuICAgIGdlbnJlczogW10sXG4gICAgdGhlbWVzOiBbXSxcbiAgICBtb2RlczogW10sXG4gICAgc2NyZWVuc2hvdHM6IFtdXG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBDcmVhdGVHYW1lTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHBsdWdpbjogR2FtZURhc2hib2FyZFBsdWdpbjtcbiAgdmFsdWVzOiBDcmVhdGVHYW1lSW5wdXQgPSBlbXB0eUlucHV0KCk7XG4gIHNlYXJjaFF1ZXJ5ID0gXCJcIjtcbiAgc2VhcmNoUmVzdWx0czogR2FtZVNlYXJjaENhbmRpZGF0ZVtdID0gW107XG4gIHNlbGVjdGVkQ2FuZGlkYXRlSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBpc0FwcGx5aW5nID0gZmFsc2U7XG4gIGlzU2VhcmNoaW5nID0gZmFsc2U7XG4gIGZvcm1FbDogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcmVzdWx0c0VsOiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBzZWFyY2hJbnB1dEVsOiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHRpdGxlSW5wdXRFbDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcm9ncmVzc0lucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgc3RhdHVzU2VsZWN0RWw6IEhUTUxTZWxlY3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHN1bW1hcnlJbnB1dEVsOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHN0b3J5bGluZUlucHV0RWw6IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgaW1wb3J0ZWRFbDogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcmVhZE9ubHlHcmlkRWw6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogR2FtZURhc2hib2FyZFBsdWdpbikge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4uYmVnaW5Nb2RhbFNlc3Npb24oKTtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb250ZW50RWwuYWRkQ2xhc3MoXCJnYW1lLWRhc2hib2FyZC1jcmVhdGUtbW9kYWxcIik7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkNyZWF0ZSBHYW1lIEVudHJ5XCIgfSk7XG5cbiAgICBjb25zdCBzZWFyY2hTZWN0aW9uID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1pbXBvcnQtc2VhcmNoXCIgfSk7XG4gICAgY29uc3Qgc2VhcmNoSGVhZGVyID0gc2VhcmNoU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0LXNlYXJjaC1yb3dcIiB9KTtcbiAgICB0aGlzLnNlYXJjaElucHV0RWwgPSBzZWFyY2hIZWFkZXIuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBJR0RCLCBlLmcuIERpc2NvIEVseXNpdW1cIlxuICAgIH0pO1xuICAgIHRoaXMuZm9jdXNQcmltYXJ5SW5wdXQoKTtcbiAgICB0aGlzLnNlYXJjaElucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zZWFyY2hJbnB1dEVsKSByZXR1cm47XG4gICAgICB0aGlzLnNlYXJjaFF1ZXJ5ID0gdGhpcy5zZWFyY2hJbnB1dEVsLnZhbHVlLnRyaW0oKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaEJ1dHRvbiA9IHNlYXJjaEhlYWRlci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiU2VhcmNoIElHREJcIiB9KTtcbiAgICBzZWFyY2hCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucnVuU2VhcmNoKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNlYXJjaElucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIkVudGVyXCIpIHJldHVybjtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBhd2FpdCB0aGlzLnJ1blNlYXJjaCgpO1xuICAgIH0pO1xuXG4gICAgc2VhcmNoU2VjdGlvbi5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgICAgdGV4dDogXCJcdTkxNERcdTdGNkVcdTU5N0QgSUdEQiBDbGllbnQgSUQgLyBDbGllbnQgU2VjcmV0IFx1NTQwRVx1RkYwQ1x1OEZEOVx1OTFDQ1x1NEYxQVx1NEVDRSBJR0RCIFx1NjQxQ1x1N0QyMlx1NUU3Nlx1NUJGQ1x1NTE2NVx1OEJFNlx1N0VDNlx1NEZFMVx1NjA2Rlx1MzAwMlwiXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc3VsdHNFbCA9IHNlYXJjaFNlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydC1yZXN1bHRzXCIgfSk7XG4gICAgdGhpcy5mb3JtRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLW1vZGFsLWZvcm1cIiB9KTtcbiAgICB0aGlzLnJlbmRlclJlc3VsdHMoKTtcbiAgICB0aGlzLnJlbmRlckZvcm0oKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5wbHVnaW4uZW5kTW9kYWxTZXNzaW9uKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blNlYXJjaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoUXVlcnkpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJTZWFyY2ggcXVlcnkgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaXNTZWFyY2hpbmcgPSB0cnVlO1xuICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VhcmNoUmVzdWx0cyA9IGF3YWl0IHRoaXMucGx1Z2luLnNlYXJjaEV4dGVybmFsR2FtZXModGhpcy5zZWFyY2hRdWVyeSk7XG4gICAgICBpZiAodGhpcy5zZWFyY2hSZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBuZXcgTm90aWNlKFwiTm8gSUdEQiByZXN1bHRzIGZvdW5kLlwiKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICBuZXcgTm90aWNlKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogXCJJR0RCIHNlYXJjaCBmYWlsZWQuXCIpO1xuICAgICAgdGhpcy5zZWFyY2hSZXN1bHRzID0gW107XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuaXNTZWFyY2hpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVzdWx0cygpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMucmVzdWx0c0VsKSByZXR1cm47XG4gICAgdGhpcy5yZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLmlzU2VhcmNoaW5nKSB7XG4gICAgICB0aGlzLnJlc3VsdHNFbC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0LWVtcHR5XCIsIHRleHQ6IFwiU2VhcmNoaW5nLi4uXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2VhcmNoUmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMucmVzdWx0c0VsLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1pbXBvcnQtZW1wdHlcIiwgdGV4dDogXCJObyByZXN1bHQgeWV0LiBTZWFyY2ggU3RlYW0gLyBJR0RCIGFib3ZlLlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2VhcmNoUmVzdWx0cy5mb3JFYWNoKChjYW5kaWRhdGUpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLnJlc3VsdHNFbCEuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBgZ2FtZS1kYXNoYm9hcmQtaW1wb3J0LXJlc3VsdCAke3RoaXMuc2VsZWN0ZWRDYW5kaWRhdGVJZCA9PT0gY2FuZGlkYXRlLmlkID8gXCJpcy1zZWxlY3RlZFwiIDogXCJcIn1gXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY292ZXIgPSBpdGVtLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1pbXBvcnQtcmVzdWx0LWNvdmVyXCIgfSk7XG4gICAgICBpZiAoY2FuZGlkYXRlLmNvdmVyVXJsKSB7XG4gICAgICAgIGNvdmVyLmNyZWF0ZUVsKFwiaW1nXCIsIHtcbiAgICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgICBzcmM6IGNhbmRpZGF0ZS5jb3ZlclVybCxcbiAgICAgICAgICAgIGFsdDogYCR7Y2FuZGlkYXRlLnRpdGxlfSBjb3ZlcmBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY292ZXIuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWNhcmQtZmFsbGJhY2tcIiwgdGV4dDogXCJcdUQ4M0NcdURGQUVcIiB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY29udGVudCA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydC1yZXN1bHQtY29udGVudFwiIH0pO1xuICAgICAgY29udGVudC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0LXJlc3VsdC1zb3VyY2VcIixcbiAgICAgICAgdGV4dDogY2FuZGlkYXRlLnNvdXJjZSA9PT0gXCJzdGVhbVwiID8gXCJTdGVhbVwiIDogXCJJR0RCXCJcbiAgICAgIH0pO1xuICAgICAgY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0LXJlc3VsdC10aXRsZVwiLCB0ZXh0OiBjYW5kaWRhdGUudGl0bGUgfSk7XG4gICAgICBjb250ZW50LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJnYW1lLWRhc2hib2FyZC1pbXBvcnQtcmVzdWx0LW1ldGFcIixcbiAgICAgICAgdGV4dDogW2NhbmRpZGF0ZS5kZXZlbG9wZXIsIGNhbmRpZGF0ZS5wbGF0Zm9ybSwgY2FuZGlkYXRlLnllYXJdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiIFx1MDBCNyBcIikgfHwgXCJObyBtZXRhZGF0YVwiXG4gICAgICB9KTtcbiAgICAgIGNvbnRlbnQuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydC1yZXN1bHQtc3VtbWFyeVwiLFxuICAgICAgICB0ZXh0OiBjYW5kaWRhdGUuc3VtbWFyeSB8fCBjYW5kaWRhdGUuc3RvcnlsaW5lIHx8IFwiTm8gc3VtbWFyeVwiXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYWN0aW9uID0gaXRlbS5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiVXNlXCIgfSk7XG4gICAgICBpZiAodGhpcy5pc0FwcGx5aW5nICYmIHRoaXMuc2VsZWN0ZWRDYW5kaWRhdGVJZCA9PT0gY2FuZGlkYXRlLmlkKSB7XG4gICAgICAgIGFjdGlvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIGFjdGlvbi50ZXh0Q29udGVudCA9IFwiTG9hZGluZy4uLlwiO1xuICAgICAgfVxuICAgICAgYWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzQXBwbHlpbmcpIHJldHVybjtcbiAgICAgICAgdGhpcy5pc0FwcGx5aW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZENhbmRpZGF0ZUlkID0gY2FuZGlkYXRlLmlkO1xuICAgICAgICB0aGlzLnJlbmRlclJlc3VsdHMoKTtcbiAgICAgICAgY29uc3QgZW5yaWNoZWQgPSBhd2FpdCB0aGlzLnBsdWdpbi5lbnJpY2hJbXBvcnRlZENhbmRpZGF0ZShjYW5kaWRhdGUpO1xuICAgICAgICB0aGlzLmFwcGx5Q2FuZGlkYXRlKGVucmljaGVkKTtcbiAgICAgICAgdGhpcy5pc0FwcGx5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVuZGVyUmVzdWx0cygpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckZvcm0oKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmZvcm1FbCkgcmV0dXJuO1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLmZvcm1FbDtcbiAgICBmb3JtLmVtcHR5KCk7XG5cbiAgICBjb25zdCB0aXRsZUxhYmVsID0gZm9ybS5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJUaXRsZVwiIH0pO1xuICAgIHRoaXMudGl0bGVJbnB1dEVsID0gdGl0bGVMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7XG4gICAgdGhpcy50aXRsZUlucHV0RWwudmFsdWUgPSB0aGlzLnZhbHVlcy50aXRsZTtcbiAgICB0aGlzLnRpdGxlSW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnRpdGxlSW5wdXRFbCkgcmV0dXJuO1xuICAgICAgdGhpcy52YWx1ZXMudGl0bGUgPSB0aGlzLnRpdGxlSW5wdXRFbC52YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVhZE9ubHlHcmlkRWwgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1tb2RhbC1ncmlkXCIgfSk7XG4gICAgdGhpcy5yZW5kZXJSZWFkT25seUdyaWQoKTtcblxuICAgIGNvbnN0IHN0YXR1c0xhYmVsID0gdGhpcy5yZWFkT25seUdyaWRFbC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJTdGF0dXNcIiB9KTtcbiAgICB0aGlzLnN0YXR1c1NlbGVjdEVsID0gc3RhdHVzTGFiZWwuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZm9yIChjb25zdCBzdGF0dXMgb2YgU1RBVFVTRVMpIHtcbiAgICAgIHRoaXMuc3RhdHVzU2VsZWN0RWwuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZTogc3RhdHVzLnZhbHVlLCB0ZXh0OiBzdGF0dXMubGFiZWwgfSk7XG4gICAgfVxuICAgIHRoaXMuc3RhdHVzU2VsZWN0RWwudmFsdWUgPSB0aGlzLnZhbHVlcy5zdGF0dXM7XG4gICAgdGhpcy5zdGF0dXNTZWxlY3RFbC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zdGF0dXNTZWxlY3RFbCkgcmV0dXJuO1xuICAgICAgdGhpcy52YWx1ZXMuc3RhdHVzID0gdGhpcy5zdGF0dXNTZWxlY3RFbC52YWx1ZTtcbiAgICB9KTtcblxuICAgIHRoaXMuaW1wb3J0ZWRFbCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydGVkLW1ldGFcIiB9KTtcbiAgICB0aGlzLnJlbmRlckltcG9ydGVkTWV0YWRhdGEoKTtcblxuICAgIGNvbnN0IHN1bW1hcnlMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiU3VtbWFyeVwiIH0pO1xuICAgIHRoaXMuc3VtbWFyeUlucHV0RWwgPSBzdW1tYXJ5TGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcbiAgICB0aGlzLnN1bW1hcnlJbnB1dEVsLnJvd3MgPSA0O1xuICAgIHRoaXMuc3VtbWFyeUlucHV0RWwudmFsdWUgPSB0aGlzLnZhbHVlcy5zdW1tYXJ5O1xuICAgIHRoaXMuc3VtbWFyeUlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zdW1tYXJ5SW5wdXRFbCkgcmV0dXJuO1xuICAgICAgdGhpcy52YWx1ZXMuc3VtbWFyeSA9IHRoaXMuc3VtbWFyeUlucHV0RWwudmFsdWU7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzdG9yeWxpbmVMYWJlbCA9IGZvcm0uY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiU3RvcnlsaW5lXCIgfSk7XG4gICAgdGhpcy5zdG9yeWxpbmVJbnB1dEVsID0gc3RvcnlsaW5lTGFiZWwuY3JlYXRlRWwoXCJ0ZXh0YXJlYVwiKTtcbiAgICB0aGlzLnN0b3J5bGluZUlucHV0RWwucm93cyA9IDQ7XG4gICAgdGhpcy5zdG9yeWxpbmVJbnB1dEVsLnZhbHVlID0gdGhpcy52YWx1ZXMuc3RvcnlsaW5lO1xuICAgIHRoaXMuc3RvcnlsaW5lSW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnN0b3J5bGluZUlucHV0RWwpIHJldHVybjtcbiAgICAgIHRoaXMudmFsdWVzLnN0b3J5bGluZSA9IHRoaXMuc3RvcnlsaW5lSW5wdXRFbC52YWx1ZTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGlvbnMgPSBmb3JtLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1tb2RhbC1hY3Rpb25zXCIgfSk7XG4gICAgbmV3IFNldHRpbmcoYWN0aW9ucylcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkNyZWF0ZVwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZXMudGl0bGUpIHtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkdhbWUgdGl0bGUgaXMgcmVxdWlyZWQuXCIpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmNyZWF0ZUdhbWUodGhpcy52YWx1ZXMpO1xuICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgbmV3IE5vdGljZShlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiRmFpbGVkIHRvIGNyZWF0ZSBnYW1lIGVudHJ5LlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDYW5kaWRhdGUoY2FuZGlkYXRlOiBHYW1lU2VhcmNoQ2FuZGlkYXRlKTogdm9pZCB7XG4gICAgdGhpcy52YWx1ZXMgPSB7XG4gICAgICAuLi5lbXB0eUlucHV0KCksXG4gICAgICAuLi50aGlzLnZhbHVlcyxcbiAgICAgIHRpdGxlOiBjYW5kaWRhdGUudGl0bGUsXG4gICAgICBkZXZlbG9wZXI6IGNhbmRpZGF0ZS5kZXZlbG9wZXIsXG4gICAgICBwdWJsaXNoZXI6IGNhbmRpZGF0ZS5wdWJsaXNoZXIsXG4gICAgICBwbGF0Zm9ybTogY2FuZGlkYXRlLnBsYXRmb3JtLFxuICAgICAgeWVhcjogY2FuZGlkYXRlLnllYXIsXG4gICAgICByZWxlYXNlRGF0ZTogY2FuZGlkYXRlLnJlbGVhc2VEYXRlLFxuICAgICAgcmF0aW5nOiBjYW5kaWRhdGUucmF0aW5nLFxuICAgICAgc3VtbWFyeTogY2FuZGlkYXRlLnN1bW1hcnksXG4gICAgICBzdG9yeWxpbmU6IGNhbmRpZGF0ZS5zdG9yeWxpbmUsXG4gICAgICBvZmZpY2lhbFVybDogY2FuZGlkYXRlLm9mZmljaWFsVXJsLFxuICAgICAgZGV0YWlsVXJsOiBjYW5kaWRhdGUuZGV0YWlsVXJsLFxuICAgICAgc3RlYW1Vcmw6IGNhbmRpZGF0ZS5zdGVhbVVybCxcbiAgICAgIGlnZGJVcmw6IGNhbmRpZGF0ZS5pZ2RiVXJsLFxuICAgICAgcG9zdGVyVXJsOiBjYW5kaWRhdGUucG9zdGVyVXJsLFxuICAgICAgYmFubmVyVXJsOiBjYW5kaWRhdGUuYmFubmVyVXJsLFxuICAgICAgZ2VucmVzOiBjYW5kaWRhdGUuZ2VucmVzLFxuICAgICAgdGhlbWVzOiBjYW5kaWRhdGUudGhlbWVzLFxuICAgICAgbW9kZXM6IGNhbmRpZGF0ZS5tb2RlcyxcbiAgICAgIHNjcmVlbnNob3RzOiBjYW5kaWRhdGUuc2NyZWVuc2hvdHNcbiAgICB9O1xuICAgIHRoaXMuc3luY0Zvcm1WYWx1ZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUmVhZE9ubHlHcmlkKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5yZWFkT25seUdyaWRFbCkgcmV0dXJuO1xuICAgIGNvbnN0IHByb2dyZXNzVmFsdWUgPSB0aGlzLnZhbHVlcy5wcm9ncmVzcztcbiAgICBjb25zdCBzdGF0dXNWYWx1ZSA9IHRoaXMudmFsdWVzLnN0YXR1cztcbiAgICB0aGlzLnJlYWRPbmx5R3JpZEVsLmVtcHR5KCk7XG4gICAgdGhpcy5hZGRSZWFkT25seSh0aGlzLnJlYWRPbmx5R3JpZEVsLCBcIkRldmVsb3BlclwiLCB0aGlzLnZhbHVlcy5kZXZlbG9wZXIgfHwgXCJBdXRvXCIpO1xuICAgIHRoaXMuYWRkUmVhZE9ubHkodGhpcy5yZWFkT25seUdyaWRFbCwgXCJQdWJsaXNoZXJcIiwgdGhpcy52YWx1ZXMucHVibGlzaGVyIHx8IFwiQXV0b1wiKTtcbiAgICB0aGlzLmFkZFJlYWRPbmx5KHRoaXMucmVhZE9ubHlHcmlkRWwsIFwiUGxhdGZvcm1cIiwgdGhpcy52YWx1ZXMucGxhdGZvcm0gfHwgXCJBdXRvXCIpO1xuICAgIHRoaXMuYWRkUmVhZE9ubHkodGhpcy5yZWFkT25seUdyaWRFbCwgXCJSZWxlYXNlIERhdGVcIiwgdGhpcy52YWx1ZXMucmVsZWFzZURhdGUgfHwgXCJBdXRvXCIpO1xuICAgIHRoaXMuYWRkUmVhZE9ubHkodGhpcy5yZWFkT25seUdyaWRFbCwgXCJZZWFyXCIsIHRoaXMudmFsdWVzLnllYXIgfHwgXCJBdXRvXCIpO1xuICAgIHRoaXMucHJvZ3Jlc3NJbnB1dEVsID0gdGhpcy5hZGRJbnB1dCh0aGlzLnJlYWRPbmx5R3JpZEVsLCBcIlByb2dyZXNzXCIsIHByb2dyZXNzVmFsdWUsICh2YWx1ZSkgPT4gKHRoaXMudmFsdWVzLnByb2dyZXNzID0gdmFsdWUpKTtcbiAgICB0aGlzLmFkZFJlYWRPbmx5KHRoaXMucmVhZE9ubHlHcmlkRWwsIFwiUmF0aW5nXCIsIHRoaXMudmFsdWVzLnJhdGluZyB8fCBcIkF1dG9cIik7XG5cbiAgICBjb25zdCBzdGF0dXNMYWJlbCA9IHRoaXMucmVhZE9ubHlHcmlkRWwuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiU3RhdHVzXCIgfSk7XG4gICAgdGhpcy5zdGF0dXNTZWxlY3RFbCA9IHN0YXR1c0xhYmVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIGZvciAoY29uc3Qgc3RhdHVzIG9mIFNUQVRVU0VTKSB7XG4gICAgICB0aGlzLnN0YXR1c1NlbGVjdEVsLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdmFsdWU6IHN0YXR1cy52YWx1ZSwgdGV4dDogc3RhdHVzLmxhYmVsIH0pO1xuICAgIH1cbiAgICB0aGlzLnN0YXR1c1NlbGVjdEVsLnZhbHVlID0gc3RhdHVzVmFsdWU7XG4gICAgdGhpcy5zdGF0dXNTZWxlY3RFbC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5zdGF0dXNTZWxlY3RFbCkgcmV0dXJuO1xuICAgICAgdGhpcy52YWx1ZXMuc3RhdHVzID0gdGhpcy5zdGF0dXNTZWxlY3RFbC52YWx1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVySW1wb3J0ZWRNZXRhZGF0YSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW1wb3J0ZWRFbCkgcmV0dXJuO1xuICAgIHRoaXMuaW1wb3J0ZWRFbC5lbXB0eSgpO1xuICAgIHRoaXMuaW1wb3J0ZWRFbC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydGVkLW1ldGEtdGl0bGVcIixcbiAgICAgIHRleHQ6IFwiSW1wb3J0ZWQgTWV0YWRhdGFcIlxuICAgIH0pO1xuICAgIGlmICh0aGlzLnNlbGVjdGVkQ2FuZGlkYXRlSWQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuaW1wb3J0ZWRFbC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0ZWQtbWV0YS1zb3VyY2VcIixcbiAgICAgICAgdGV4dDogYFByaW1hcnkgU291cmNlOiAke3RoaXMuc2VhcmNoUmVzdWx0cy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSB0aGlzLnNlbGVjdGVkQ2FuZGlkYXRlSWQpPy5zb3VyY2UgPT09IFwic3RlYW1cIiA/IFwiU3RlYW1cIiA6IFwiSUdEQlwifWBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBbXG4gICAgICBbXCJPZmZpY2lhbCBVUkxcIiwgdGhpcy52YWx1ZXMub2ZmaWNpYWxVcmxdLFxuICAgICAgW1wiRGV0YWlsIFVSTFwiLCB0aGlzLnZhbHVlcy5kZXRhaWxVcmxdLFxuICAgICAgW1wiU3RlYW0gVVJMXCIsIHRoaXMudmFsdWVzLnN0ZWFtVXJsXSxcbiAgICAgIFtcIklHREIgVVJMXCIsIHRoaXMudmFsdWVzLmlnZGJVcmxdLFxuICAgICAgW1wiUG9zdGVyXCIsIHRoaXMudmFsdWVzLnBvc3RlclVybF0sXG4gICAgICBbXCJCYW5uZXJcIiwgdGhpcy52YWx1ZXMuYmFubmVyVXJsXSxcbiAgICAgIFtcIkdlbnJlc1wiLCB0aGlzLnZhbHVlcy5nZW5yZXMuam9pbihcIiwgXCIpXSxcbiAgICAgIFtcIlRoZW1lc1wiLCB0aGlzLnZhbHVlcy50aGVtZXMuam9pbihcIiwgXCIpXSxcbiAgICAgIFtcIk1vZGVzXCIsIHRoaXMudmFsdWVzLm1vZGVzLmpvaW4oXCIsIFwiKV1cbiAgICBdXG4gICAgICAuZmlsdGVyKChbLCB2YWx1ZV0pID0+IEJvb2xlYW4odmFsdWUpKVxuICAgICAgLmZvckVhY2goKFtsYWJlbCwgdmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXMuaW1wb3J0ZWRFbCEuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydGVkLW1ldGEtcm93XCIgfSk7XG4gICAgICAgIHJvdy5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtaW1wb3J0ZWQtbWV0YS1sYWJlbFwiLCB0ZXh0OiBgJHtsYWJlbH1gIH0pO1xuICAgICAgICByb3cuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWltcG9ydGVkLW1ldGEtdmFsdWVcIiwgdGV4dDogdmFsdWUgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc3luY0Zvcm1WYWx1ZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudGl0bGVJbnB1dEVsKSB0aGlzLnRpdGxlSW5wdXRFbC52YWx1ZSA9IHRoaXMudmFsdWVzLnRpdGxlO1xuICAgIGlmICh0aGlzLnByb2dyZXNzSW5wdXRFbCkgdGhpcy5wcm9ncmVzc0lucHV0RWwudmFsdWUgPSB0aGlzLnZhbHVlcy5wcm9ncmVzcztcbiAgICBpZiAodGhpcy5zdGF0dXNTZWxlY3RFbCkgdGhpcy5zdGF0dXNTZWxlY3RFbC52YWx1ZSA9IHRoaXMudmFsdWVzLnN0YXR1cztcbiAgICBpZiAodGhpcy5zdW1tYXJ5SW5wdXRFbCkgdGhpcy5zdW1tYXJ5SW5wdXRFbC52YWx1ZSA9IHRoaXMudmFsdWVzLnN1bW1hcnk7XG4gICAgaWYgKHRoaXMuc3RvcnlsaW5lSW5wdXRFbCkgdGhpcy5zdG9yeWxpbmVJbnB1dEVsLnZhbHVlID0gdGhpcy52YWx1ZXMuc3RvcnlsaW5lO1xuICAgIHRoaXMucmVuZGVyUmVhZE9ubHlHcmlkKCk7XG4gICAgdGhpcy5yZW5kZXJJbXBvcnRlZE1ldGFkYXRhKCk7XG4gIH1cblxuICBwcml2YXRlIGZvY3VzUHJpbWFyeUlucHV0KCk6IHZvaWQge1xuICAgIGNvbnN0IGFwcGx5Rm9jdXMgPSAoKSA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0aGlzLnNlYXJjaElucHV0RWwgPz8gdGhpcy50aXRsZUlucHV0RWw7XG4gICAgICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICAgICAgdGFyZ2V0LmZvY3VzKCk7XG4gICAgICBpZiAoXCJzZXRTZWxlY3Rpb25SYW5nZVwiIGluIHRhcmdldCkge1xuICAgICAgICBjb25zdCBsZW5ndGggPSB0YXJnZXQudmFsdWUubGVuZ3RoO1xuICAgICAgICB0YXJnZXQuc2V0U2VsZWN0aW9uUmFuZ2UobGVuZ3RoLCBsZW5ndGgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIGFwcGx5Rm9jdXMoKTtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYXBwbHlGb2N1cyk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFJlYWRPbmx5KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGxhYmVsOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCB3cmFwcGVyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1yZWFkb25seS1maWVsZFwiIH0pO1xuICAgIHdyYXBwZXIuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXJlYWRvbmx5LWxhYmVsXCIsIHRleHQ6IGxhYmVsIH0pO1xuICAgIHdyYXBwZXIuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXJlYWRvbmx5LXZhbHVlXCIsIHRleHQ6IHZhbHVlIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRJbnB1dChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGxhYmVsOiBzdHJpbmcsXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmcsXG4gICAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gICk6IEhUTUxJbnB1dEVsZW1lbnQge1xuICAgIGNvbnN0IHdyYXBwZXIgPSBjb250YWluZXIuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsIH0pO1xuICAgIGNvbnN0IGlucHV0ID0gd3JhcHBlci5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSk7XG4gICAgaW5wdXQudmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IG9uQ2hhbmdlKGlucHV0LnZhbHVlLnRyaW0oKSkpO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5vdGljZSwgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgR2FtZURhc2hib2FyZFBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBHYW1lU2VhcmNoQ2FuZGlkYXRlIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuaW50ZXJmYWNlIElnZGJUb2tlbkNhY2hlIHtcbiAgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgZXhwaXJlc0F0OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBJZ2RiR2FtZVJlY29yZCB7XG4gIGlkPzogbnVtYmVyO1xuICBuYW1lPzogc3RyaW5nO1xuICBzdW1tYXJ5Pzogc3RyaW5nO1xuICBzdG9yeWxpbmU/OiBzdHJpbmc7XG4gIGZpcnN0X3JlbGVhc2VfZGF0ZT86IG51bWJlcjtcbiAgcmF0aW5nPzogbnVtYmVyO1xuICBhZ2dyZWdhdGVkX3JhdGluZz86IG51bWJlcjtcbiAgc2x1Zz86IHN0cmluZztcbiAgY292ZXI/OiB7XG4gICAgaW1hZ2VfaWQ/OiBzdHJpbmc7XG4gICAgdXJsPzogc3RyaW5nO1xuICB9O1xuICBhcnR3b3Jrcz86IEFycmF5PHtcbiAgICBpbWFnZV9pZD86IHN0cmluZztcbiAgICB1cmw/OiBzdHJpbmc7XG4gIH0+O1xuICB3ZWJzaXRlcz86IEFycmF5PHtcbiAgICB1cmw/OiBzdHJpbmc7XG4gIH0+O1xuICBpbnZvbHZlZF9jb21wYW5pZXM/OiBBcnJheTx7XG4gICAgZGV2ZWxvcGVyPzogYm9vbGVhbjtcbiAgICBwdWJsaXNoZXI/OiBib29sZWFuO1xuICAgIGNvbXBhbnk/OiB7XG4gICAgICBuYW1lPzogc3RyaW5nO1xuICAgIH07XG4gIH0+O1xuICBnZW5yZXM/OiBBcnJheTx7IG5hbWU/OiBzdHJpbmcgfT47XG4gIHRoZW1lcz86IEFycmF5PHsgbmFtZT86IHN0cmluZyB9PjtcbiAgZ2FtZV9tb2Rlcz86IEFycmF5PHsgbmFtZT86IHN0cmluZyB9PjtcbiAgcGxhdGZvcm1zPzogQXJyYXk8eyBuYW1lPzogc3RyaW5nIH0+O1xuICBzY3JlZW5zaG90cz86IEFycmF5PHsgdXJsPzogc3RyaW5nIH0+O1xufVxuXG5mdW5jdGlvbiBpZ2RiSW1hZ2VVcmwoaW1hZ2VJZDogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaXplID0gXCJjb3Zlcl9iaWdfMnhcIik6IHN0cmluZyB7XG4gIGlmICghaW1hZ2VJZCkgcmV0dXJuIFwiXCI7XG4gIHJldHVybiBgaHR0cHM6Ly9pbWFnZXMuaWdkYi5jb20vaWdkYi9pbWFnZS91cGxvYWQvdF8ke3NpemV9LyR7aW1hZ2VJZH0uanBnYDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplSW1hZ2VVcmwodXJsOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAoIXVybCkgcmV0dXJuIFwiXCI7XG4gIGlmICh1cmwuc3RhcnRzV2l0aChcIi8vXCIpKSByZXR1cm4gYGh0dHBzOiR7dXJsfWA7XG4gIGlmICh1cmwuc3RhcnRzV2l0aChcImh0dHA6Ly9cIikgfHwgdXJsLnN0YXJ0c1dpdGgoXCJodHRwczovL1wiKSkgcmV0dXJuIHVybDtcbiAgcmV0dXJuIGBodHRwczovLyR7dXJsLnJlcGxhY2UoL15cXC8rLywgXCJcIil9YDtcbn1cblxuZnVuY3Rpb24gdW5pcXVlVmFsdWVzKHZhbHVlczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIHJldHVybiBbLi4ubmV3IFNldCh2YWx1ZXMuZmlsdGVyKEJvb2xlYW4pKV07XG59XG5cbmZ1bmN0aW9uIGRhdGVQYXJ0c0Zyb21Vbml4KHRpbWVzdGFtcD86IG51bWJlcik6IHsgeWVhcjogc3RyaW5nOyByZWxlYXNlRGF0ZTogc3RyaW5nIH0ge1xuICBpZiAoIXRpbWVzdGFtcCkgcmV0dXJuIHsgeWVhcjogXCJcIiwgcmVsZWFzZURhdGU6IFwiXCIgfTtcbiAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCAqIDEwMDApO1xuICBpZiAoTnVtYmVyLmlzTmFOKGRhdGUuZ2V0VGltZSgpKSkgcmV0dXJuIHsgeWVhcjogXCJcIiwgcmVsZWFzZURhdGU6IFwiXCIgfTtcbiAgcmV0dXJuIHtcbiAgICB5ZWFyOiBTdHJpbmcoZGF0ZS5nZXRGdWxsWWVhcigpKSxcbiAgICByZWxlYXNlRGF0ZTogZGF0ZS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKVxuICB9O1xufVxuXG5mdW5jdGlvbiB3ZWJzaXRlVXJsKHJlY29yZDogSWdkYkdhbWVSZWNvcmQsIG1hdGNoZXI6ICh1cmw6IHN0cmluZykgPT4gYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHVybHMgPSAocmVjb3JkLndlYnNpdGVzID8/IFtdKVxuICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0udXJsID8/IFwiXCIpXG4gICAgLm1hcCgodXJsKSA9PiAodXJsLnN0YXJ0c1dpdGgoXCIvL1wiKSA/IGBodHRwczoke3VybH1gIDogdXJsKSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gdXJscy5maW5kKG1hdGNoZXIpID8/IFwiXCI7XG59XG5cbmZ1bmN0aW9uIGZpcnN0RXh0ZXJuYWxVcmwocmVjb3JkOiBJZ2RiR2FtZVJlY29yZCk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgKHJlY29yZC53ZWJzaXRlcyA/PyBbXSlcbiAgICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0udXJsID8/IFwiXCIpXG4gICAgICAubWFwKCh1cmwpID0+ICh1cmwuc3RhcnRzV2l0aChcIi8vXCIpID8gYGh0dHBzOiR7dXJsfWAgOiB1cmwpKVxuICAgICAgLmZpbmQoQm9vbGVhbikgPz8gXCJcIlxuICApO1xufVxuXG5mdW5jdGlvbiBjb21wYW5pZXMocmVjb3JkOiBJZ2RiR2FtZVJlY29yZCwga2luZDogXCJkZXZlbG9wZXJcIiB8IFwicHVibGlzaGVyXCIpOiBzdHJpbmcge1xuICBjb25zdCBuYW1lcyA9IChyZWNvcmQuaW52b2x2ZWRfY29tcGFuaWVzID8/IFtdKVxuICAgIC5maWx0ZXIoKGNvbXBhbnkpID0+IEJvb2xlYW4oY29tcGFueVtraW5kXSkpXG4gICAgLm1hcCgoY29tcGFueSkgPT4gY29tcGFueS5jb21wYW55Py5uYW1lID8/IFwiXCIpXG4gICAgLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIHVuaXF1ZVZhbHVlcyhuYW1lcykuam9pbihcIiwgXCIpO1xufVxuXG5mdW5jdGlvbiBuYW1lcyh2YWx1ZXM/OiBBcnJheTx7IG5hbWU/OiBzdHJpbmcgfT4pOiBzdHJpbmdbXSB7XG4gIHJldHVybiB1bmlxdWVWYWx1ZXMoKHZhbHVlcyA/PyBbXSkubWFwKChpdGVtKSA9PiBpdGVtLm5hbWUgPz8gXCJcIikpO1xufVxuXG5mdW5jdGlvbiBjb3ZlckZpbGVOYW1lKHRpdGxlOiBzdHJpbmcsIHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZXh0ZW5zaW9uTWF0Y2ggPSB1cmwubWF0Y2goL1xcLihbYS16QS1aMC05XSspKD86XFw/fCQpLyk7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGV4dGVuc2lvbk1hdGNoPy5bMV0/LnRvTG93ZXJDYXNlKCkgPz8gXCJqcGdcIjtcbiAgY29uc3Qgc2FmZVRpdGxlID0gdGl0bGUucmVwbGFjZSgvW1xcXFwvOio/XCI8PnxdL2csIFwiXCIpLnRyaW0oKSB8fCBcImNvdmVyXCI7XG4gIHJldHVybiBgJHtzYWZlVGl0bGV9LiR7ZXh0ZW5zaW9ufWA7XG59XG5cbmV4cG9ydCBjbGFzcyBJZ2RiQ2xpZW50IHtcbiAgcGx1Z2luOiBHYW1lRGFzaGJvYXJkUGx1Z2luO1xuICB0b2tlbkNhY2hlOiBJZ2RiVG9rZW5DYWNoZSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHBsdWdpbjogR2FtZURhc2hib2FyZFBsdWdpbikge1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgYXN5bmMgc2VhcmNoR2FtZXMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8R2FtZVNlYXJjaENhbmRpZGF0ZVtdPiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IHF1ZXJ5LnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHJldHVybiBbXTtcblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgdGhpcy5nZXRBY2Nlc3NUb2tlbigpO1xuICAgIGNvbnN0IGJvZHkgPSBbXG4gICAgICAnZmllbGRzIGlkLG5hbWUsc3VtbWFyeSxzdG9yeWxpbmUsZmlyc3RfcmVsZWFzZV9kYXRlLHJhdGluZyxhZ2dyZWdhdGVkX3JhdGluZyxzbHVnLCcsXG4gICAgICAnY292ZXIuaW1hZ2VfaWQsY292ZXIudXJsLGFydHdvcmtzLmltYWdlX2lkLGFydHdvcmtzLnVybCx3ZWJzaXRlcy51cmwsJyxcbiAgICAgICdpbnZvbHZlZF9jb21wYW5pZXMuZGV2ZWxvcGVyLGludm9sdmVkX2NvbXBhbmllcy5wdWJsaXNoZXIsaW52b2x2ZWRfY29tcGFuaWVzLmNvbXBhbnkubmFtZSwnLFxuICAgICAgJ2dlbnJlcy5uYW1lLHRoZW1lcy5uYW1lLGdhbWVfbW9kZXMubmFtZSxwbGF0Zm9ybXMubmFtZSxzY3JlZW5zaG90cy5pbWFnZV9pZCxzY3JlZW5zaG90cy51cmw7JyxcbiAgICAgIGBzZWFyY2ggXCIke3RyaW1tZWQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVwiO2AsXG4gICAgICBcIndoZXJlIHZlcnNpb25fcGFyZW50ID0gbnVsbDtcIixcbiAgICAgIFwibGltaXQgODtcIlxuICAgIF0uam9pbihcIlwiKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IFwiaHR0cHM6Ly9hcGkuaWdkYi5jb20vdjQvZ2FtZXNcIixcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiQ2xpZW50LUlEXCI6IHRoaXMucGx1Z2luLnNldHRpbmdzLmlnZGJDbGllbnRJZCxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH0sXG4gICAgICBib2R5XG4gICAgfSk7XG5cbiAgICBjb25zdCByZWNvcmRzID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5qc29uKSA/IChyZXNwb25zZS5qc29uIGFzIElnZGJHYW1lUmVjb3JkW10pIDogW107XG4gICAgcmV0dXJuIHJlY29yZHMubWFwKChyZWNvcmQpID0+IHRoaXMudG9DYW5kaWRhdGUocmVjb3JkKSk7XG4gIH1cblxuICBhc3luYyBkb3dubG9hZEltYWdlKGZvbGRlclBhdGg6IHN0cmluZywgdGl0bGU6IHN0cmluZywgaW1hZ2VVcmw6IHN0cmluZywgcHVycG9zZTogXCJwb3N0ZXJcIiB8IFwiYmFubmVyXCIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghaW1hZ2VVcmwpIHJldHVybiBcIlwiO1xuXG4gICAgY29uc3Qgbm9ybWFsaXplZFVybCA9IG5vcm1hbGl6ZUltYWdlVXJsKGltYWdlVXJsKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWRVcmwpIHJldHVybiBcIlwiO1xuXG4gICAgY29uc3QgZmlsZU5hbWUgPSBgJHtwdXJwb3NlfS0ke2NvdmVyRmlsZU5hbWUodGl0bGUsIG5vcm1hbGl6ZWRVcmwpfWA7XG4gICAgY29uc3QgZmlsZVBhdGggPSBgJHtmb2xkZXJQYXRofS8ke2ZpbGVOYW1lfWA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcbiAgICBpZiAoZXhpc3RpbmcpIHJldHVybiBmaWxlTmFtZTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7XG4gICAgICB1cmw6IG5vcm1hbGl6ZWRVcmwsXG4gICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICB9KTtcblxuICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5jcmVhdGVCaW5hcnkoZmlsZVBhdGgsIHJlc3BvbnNlLmFycmF5QnVmZmVyKTtcbiAgICByZXR1cm4gZmlsZU5hbWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEFjY2Vzc1Rva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5pZ2RiQ2xpZW50SWQgfHwgIXRoaXMucGx1Z2luLnNldHRpbmdzLmlnZGJDbGllbnRTZWNyZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIklHREIgQ2xpZW50IElEIC8gQ2xpZW50IFNlY3JldCBcdTY3MkFcdTkxNERcdTdGNkVcdTMwMDJcIik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudG9rZW5DYWNoZSAmJiB0aGlzLnRva2VuQ2FjaGUuZXhwaXJlc0F0ID4gRGF0ZS5ub3coKSArIDYwXzAwMCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9rZW5DYWNoZS5hY2Nlc3NUb2tlbjtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBgaHR0cHM6Ly9pZC50d2l0Y2gudHYvb2F1dGgyL3Rva2VuP2NsaWVudF9pZD0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pZ2RiQ2xpZW50SWQpfSZjbGllbnRfc2VjcmV0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucGx1Z2luLnNldHRpbmdzLmlnZGJDbGllbnRTZWNyZXQpfSZncmFudF90eXBlPWNsaWVudF9jcmVkZW50aWFsc2AsXG4gICAgICBtZXRob2Q6IFwiUE9TVFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gcmVzcG9uc2UuanNvbiBhcyB7IGFjY2Vzc190b2tlbj86IHN0cmluZzsgZXhwaXJlc19pbj86IG51bWJlciB9O1xuICAgIGlmICghanNvbj8uYWNjZXNzX3Rva2VuKSB7XG4gICAgICBuZXcgTm90aWNlKFwiSUdEQiB0b2tlbiByZXF1ZXN0IGZhaWxlZC5cIik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gZmV0Y2ggSUdEQiBhY2Nlc3MgdG9rZW4uXCIpO1xuICAgIH1cblxuICAgIHRoaXMudG9rZW5DYWNoZSA9IHtcbiAgICAgIGFjY2Vzc1Rva2VuOiBqc29uLmFjY2Vzc190b2tlbixcbiAgICAgIGV4cGlyZXNBdDogRGF0ZS5ub3coKSArIChqc29uLmV4cGlyZXNfaW4gPz8gMCkgKiAxMDAwXG4gICAgfTtcbiAgICByZXR1cm4ganNvbi5hY2Nlc3NfdG9rZW47XG4gIH1cblxuICBwcml2YXRlIHRvQ2FuZGlkYXRlKHJlY29yZDogSWdkYkdhbWVSZWNvcmQpOiBHYW1lU2VhcmNoQ2FuZGlkYXRlIHtcbiAgICBjb25zdCBzdGVhbVVybCA9IHdlYnNpdGVVcmwocmVjb3JkLCAodXJsKSA9PiAvc3RvcmVcXC5zdGVhbXBvd2VyZWRcXC5jb21cXC9hcHBcXC8vaS50ZXN0KHVybCkpO1xuICAgIGNvbnN0IGV4dGVybmFsVXJsID0gZmlyc3RFeHRlcm5hbFVybChyZWNvcmQpO1xuICAgIGNvbnN0IHBvc3RlclVybCA9IGlnZGJJbWFnZVVybChyZWNvcmQuY292ZXI/LmltYWdlX2lkLCBcImNvdmVyX2JpZ18yeFwiKSB8fCBub3JtYWxpemVJbWFnZVVybChyZWNvcmQuY292ZXI/LnVybCk7XG4gICAgY29uc3QgYmFubmVyVXJsID1cbiAgICAgIGlnZGJJbWFnZVVybChyZWNvcmQuYXJ0d29ya3M/LlswXT8uaW1hZ2VfaWQsIFwic2NyZWVuc2hvdF9odWdlXCIpIHx8XG4gICAgICBub3JtYWxpemVJbWFnZVVybChyZWNvcmQuYXJ0d29ya3M/LlswXT8udXJsKSB8fFxuICAgICAgcG9zdGVyVXJsO1xuICAgIGNvbnN0IHsgeWVhciwgcmVsZWFzZURhdGUgfSA9IGRhdGVQYXJ0c0Zyb21Vbml4KHJlY29yZC5maXJzdF9yZWxlYXNlX2RhdGUpO1xuICAgIGNvbnN0IHJhdGluZyA9IHJlY29yZC5hZ2dyZWdhdGVkX3JhdGluZyA/PyByZWNvcmQucmF0aW5nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiByZWNvcmQuaWQgPz8gTWF0aC50cnVuYyhNYXRoLnJhbmRvbSgpICogMV8wMDBfMDAwXzAwMCksXG4gICAgICBzb3VyY2U6IFwiaWdkYlwiLFxuICAgICAgdGl0bGU6IHJlY29yZC5uYW1lID8/IFwiVW50aXRsZWQgR2FtZVwiLFxuICAgICAgc3VtbWFyeTogcmVjb3JkLnN1bW1hcnkgPz8gXCJcIixcbiAgICAgIGRldmVsb3BlcjogY29tcGFuaWVzKHJlY29yZCwgXCJkZXZlbG9wZXJcIiksXG4gICAgICBwdWJsaXNoZXI6IGNvbXBhbmllcyhyZWNvcmQsIFwicHVibGlzaGVyXCIpLFxuICAgICAgcGxhdGZvcm06IG5hbWVzKHJlY29yZC5wbGF0Zm9ybXMpLmpvaW4oXCIsIFwiKSxcbiAgICAgIHllYXIsXG4gICAgICByZWxlYXNlRGF0ZSxcbiAgICAgIHJhdGluZzogcmF0aW5nID8gcmF0aW5nLnRvRml4ZWQoMSkgOiBcIlwiLFxuICAgICAgb2ZmaWNpYWxVcmw6IHN0ZWFtVXJsIHx8IGV4dGVybmFsVXJsLFxuICAgICAgZGV0YWlsVXJsOiBzdGVhbVVybCB8fCAocmVjb3JkLnNsdWcgPyBgaHR0cHM6Ly93d3cuaWdkYi5jb20vZ2FtZXMvJHtyZWNvcmQuc2x1Z31gIDogZXh0ZXJuYWxVcmwpLFxuICAgICAgc3RlYW1VcmwsXG4gICAgICBpZ2RiVXJsOiByZWNvcmQuc2x1ZyA/IGBodHRwczovL3d3dy5pZ2RiLmNvbS9nYW1lcy8ke3JlY29yZC5zbHVnfWAgOiBcIlwiLFxuICAgICAgcG9zdGVyVXJsLFxuICAgICAgYmFubmVyVXJsLFxuICAgICAgc3RvcnlsaW5lOiByZWNvcmQuc3RvcnlsaW5lID8/IFwiXCIsXG4gICAgICBnZW5yZXM6IG5hbWVzKHJlY29yZC5nZW5yZXMpLFxuICAgICAgdGhlbWVzOiBuYW1lcyhyZWNvcmQudGhlbWVzKSxcbiAgICAgIG1vZGVzOiBuYW1lcyhyZWNvcmQuZ2FtZV9tb2RlcyksXG4gICAgICBzY3JlZW5zaG90czogdW5pcXVlVmFsdWVzKFxuICAgICAgICAocmVjb3JkLnNjcmVlbnNob3RzID8/IFtdKS5tYXAoKGl0ZW0pID0+IGlnZGJJbWFnZVVybChpdGVtLmltYWdlX2lkLCBcInNjcmVlbnNob3RfaHVnZVwiKSB8fCBub3JtYWxpemVJbWFnZVVybChpdGVtLnVybCkpXG4gICAgICApXG4gICAgfTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgQ2FjaGVkTWV0YWRhdGEsIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBHYW1lRGFzaGJvYXJkU2V0dGluZ3MsIEdhbWVFbnRyeSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IElNQUdFX0VYVEVOU0lPTlMgPSBuZXcgU2V0KFtcInBuZ1wiLCBcImpwZ1wiLCBcImpwZWdcIiwgXCJ3ZWJwXCIsIFwiZ2lmXCIsIFwiYXZpZlwiXSk7XG5cbmZ1bmN0aW9uIGFzRm9sZGVyKGZpbGU6IFRBYnN0cmFjdEZpbGUgfCBudWxsKTogVEZvbGRlciB8IG51bGwge1xuICByZXR1cm4gZmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIgPyBmaWxlIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdERpcmVjdE1hcmtkb3duRmlsZXMoZm9sZGVyOiBURm9sZGVyKTogVEZpbGVbXSB7XG4gIHJldHVybiBmb2xkZXIuY2hpbGRyZW4uZmlsdGVyKFxuICAgIChjaGlsZCk6IGNoaWxkIGlzIFRGaWxlID0+IGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCJcbiAgKTtcbn1cblxuZnVuY3Rpb24gY29sbGVjdEltYWdlRmlsZXMoZm9sZGVyOiBURm9sZGVyKTogVEZpbGVbXSB7XG4gIGNvbnN0IGZpbGVzOiBURmlsZVtdID0gW107XG4gIGNvbnN0IHN0YWNrOiBURm9sZGVyW10gPSBbZm9sZGVyXTtcblxuICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzdGFjay5wb3AoKSE7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBjdXJyZW50LmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICAgIHN0YWNrLnB1c2goY2hpbGQpO1xuICAgICAgfSBlbHNlIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIElNQUdFX0VYVEVOU0lPTlMuaGFzKGNoaWxkLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICBmaWxlcy5wdXNoKGNoaWxkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmlsZXM7XG59XG5cbmZ1bmN0aW9uIG1ldGFkYXRhVmFsdWUoY2FjaGU6IENhY2hlZE1ldGFkYXRhIHwgbnVsbCB8IHVuZGVmaW5lZCwga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB2YWx1ZSA9IGNhY2hlPy5mcm9udG1hdHRlcj8uW2tleV07XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiID8gU3RyaW5nKHZhbHVlKSA6IFwiXCI7XG59XG5cbmZ1bmN0aW9uIGZpbGVNdGltZShmaWxlOiBURmlsZSB8IG51bGwgfCB1bmRlZmluZWQpOiBudW1iZXIge1xuICByZXR1cm4gZmlsZT8uc3RhdD8ubXRpbWUgPz8gMDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUltYWdlRmlsZShhcHA6IEFwcCwgZm9sZGVyOiBURm9sZGVyLCBtYWluRmlsZTogVEZpbGUgfCBudWxsLCBmaWVsZDogc3RyaW5nKTogVEZpbGUgfCBudWxsIHtcbiAgY29uc3QgY2FjaGUgPSBtYWluRmlsZSA/IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShtYWluRmlsZSkgOiBudWxsO1xuICBjb25zdCBpbWFnZVZhbHVlID0gY2FjaGU/LmZyb250bWF0dGVyPy5bZmllbGRdO1xuXG4gIGlmICh0eXBlb2YgaW1hZ2VWYWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiBpbWFnZVZhbHVlLnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY2xlYW5lZCA9IGltYWdlVmFsdWUucmVwbGFjZSgvXlxcW1xcWy8sIFwiXCIpLnJlcGxhY2UoL1xcXVxcXSQvLCBcIlwiKTtcbiAgICBjb25zdCByZXNvbHZlZCA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KGNsZWFuZWQsIG1haW5GaWxlPy5wYXRoID8/IGZvbGRlci5wYXRoKTtcbiAgICBpZiAocmVzb2x2ZWQpIHJldHVybiByZXNvbHZlZDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUG9zdGVyRmlsZShhcHA6IEFwcCwgZm9sZGVyOiBURm9sZGVyLCBtYWluRmlsZTogVEZpbGUgfCBudWxsKTogVEZpbGUgfCBudWxsIHtcbiAgY29uc3QgZXhwbGljaXRQb3N0ZXIgPVxuICAgIHJlc29sdmVJbWFnZUZpbGUoYXBwLCBmb2xkZXIsIG1haW5GaWxlLCBcInBvc3RlclwiKSA/P1xuICAgIHJlc29sdmVJbWFnZUZpbGUoYXBwLCBmb2xkZXIsIG1haW5GaWxlLCBcImNvdmVyXCIpO1xuICBpZiAoZXhwbGljaXRQb3N0ZXIpIHJldHVybiBleHBsaWNpdFBvc3RlcjtcbiAgY29uc3QgW2ZpcnN0SW1hZ2VdID0gY29sbGVjdEltYWdlRmlsZXMoZm9sZGVyKTtcbiAgcmV0dXJuIGZpcnN0SW1hZ2UgPz8gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJhbm5lckZpbGUoYXBwOiBBcHAsIGZvbGRlcjogVEZvbGRlciwgbWFpbkZpbGU6IFRGaWxlIHwgbnVsbCwgcG9zdGVyRmlsZTogVEZpbGUgfCBudWxsKTogVEZpbGUgfCBudWxsIHtcbiAgY29uc3QgZXhwbGljaXRCYW5uZXIgPSByZXNvbHZlSW1hZ2VGaWxlKGFwcCwgZm9sZGVyLCBtYWluRmlsZSwgXCJiYW5uZXJcIik7XG4gIGlmIChleHBsaWNpdEJhbm5lcikgcmV0dXJuIGV4cGxpY2l0QmFubmVyO1xuICBjb25zdCBpbWFnZXMgPSBjb2xsZWN0SW1hZ2VGaWxlcyhmb2xkZXIpO1xuICByZXR1cm4gaW1hZ2VzLmZpbmQoKGZpbGUpID0+ICFwb3N0ZXJGaWxlIHx8IGZpbGUucGF0aCAhPT0gcG9zdGVyRmlsZS5wYXRoKSA/PyBwb3N0ZXJGaWxlID8/IG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbmRleEdhbWVzKGFwcDogQXBwLCBzZXR0aW5nczogR2FtZURhc2hib2FyZFNldHRpbmdzKTogUHJvbWlzZTxHYW1lRW50cnlbXT4ge1xuICBjb25zdCByb290Rm9sZGVyID0gYXNGb2xkZXIoYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChzZXR0aW5ncy5nYW1lc1Jvb3QpKTtcbiAgaWYgKCFyb290Rm9sZGVyKSByZXR1cm4gW107XG5cbiAgY29uc3QgZ2FtZUZvbGRlcnMgPSByb290Rm9sZGVyLmNoaWxkcmVuLmZpbHRlcigoY2hpbGQpOiBjaGlsZCBpcyBURm9sZGVyID0+IGNoaWxkIGluc3RhbmNlb2YgVEZvbGRlcik7XG5cbiAgY29uc3QgZW50cmllcyA9IGdhbWVGb2xkZXJzLm1hcCgoZm9sZGVyKSA9PiB7XG4gICAgY29uc3QgbWFya2Rvd25GaWxlcyA9IGNvbGxlY3REaXJlY3RNYXJrZG93bkZpbGVzKGZvbGRlcik7XG4gICAgY29uc3QgbWFpbkZpbGUgPSBtYXJrZG93bkZpbGVzLmZpbmQoKGZpbGUpID0+IGZpbGUubmFtZSA9PT0gc2V0dGluZ3MubWFpbk5vdGVOYW1lKSA/PyBtYXJrZG93bkZpbGVzWzBdID8/IG51bGw7XG4gICAgY29uc3Qgbm90ZXMgPSBtYXJrZG93bkZpbGVzLmZpbHRlcigoZmlsZSkgPT4gbWFpbkZpbGUgPT0gbnVsbCB8fCBmaWxlLnBhdGggIT09IG1haW5GaWxlLnBhdGgpO1xuICAgIGNvbnN0IGNhY2hlID0gbWFpbkZpbGUgPyBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUobWFpbkZpbGUpIDogbnVsbDtcbiAgICBjb25zdCByZWxhdGl2ZVBhdGggPSBmb2xkZXIucGF0aC5zdGFydHNXaXRoKHJvb3RGb2xkZXIucGF0aClcbiAgICAgID8gZm9sZGVyLnBhdGguc2xpY2Uocm9vdEZvbGRlci5wYXRoLmxlbmd0aCArIDEpXG4gICAgICA6IGZvbGRlci5wYXRoO1xuICAgIGNvbnN0IHVwZGF0ZWRBdCA9IE1hdGgubWF4KDAsIC4uLm1hcmtkb3duRmlsZXMubWFwKChmaWxlKSA9PiBmaWxlTXRpbWUoZmlsZSkpKTtcblxuICAgIGNvbnN0IHBvc3RlckZpbGUgPSByZXNvbHZlUG9zdGVyRmlsZShhcHAsIGZvbGRlciwgbWFpbkZpbGUpO1xuICAgIGNvbnN0IGJhbm5lckZpbGUgPSByZXNvbHZlQmFubmVyRmlsZShhcHAsIGZvbGRlciwgbWFpbkZpbGUsIHBvc3RlckZpbGUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZvbGRlcixcbiAgICAgIG1haW5GaWxlLFxuICAgICAgbm90ZXMsXG4gICAgICBwb3N0ZXJGaWxlLFxuICAgICAgYmFubmVyRmlsZSxcbiAgICAgIHJlbGF0aXZlUGF0aCxcbiAgICAgIHRpdGxlOiBtZXRhZGF0YVZhbHVlKGNhY2hlLCBcIm1lZGlhX3RpdGxlXCIpIHx8IG1ldGFkYXRhVmFsdWUoY2FjaGUsIFwidGl0bGVcIikgfHwgbWFpbkZpbGU/LmJhc2VuYW1lIHx8IGZvbGRlci5uYW1lLFxuICAgICAgc3RhdHVzOiBtZXRhZGF0YVZhbHVlKGNhY2hlLCBcInN0YXR1c1wiKSB8fCBcInVuc29ydGVkXCIsXG4gICAgICBkZXZlbG9wZXI6IG1ldGFkYXRhVmFsdWUoY2FjaGUsIFwiZGV2ZWxvcGVyXCIpIHx8IFwiXCIsXG4gICAgICBwbGF0Zm9ybTogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJwbGF0Zm9ybVwiKSB8fCBcIlwiLFxuICAgICAgeWVhcjogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJ5ZWFyXCIpIHx8IFwiXCIsXG4gICAgICBwcm9ncmVzczogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJwcm9ncmVzc1wiKSB8fCBcIlwiLFxuICAgICAgcmF0aW5nOiBtZXRhZGF0YVZhbHVlKGNhY2hlLCBcInJhdGluZ1wiKSB8fCBcIlwiLFxuICAgICAgc3VtbWFyeTogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJzdW1tYXJ5XCIpIHx8IFwiXCIsXG4gICAgICBvZmZpY2lhbFVybDogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJvZmZpY2lhbF91cmxcIikgfHwgXCJcIixcbiAgICAgIGRldGFpbFVybDogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJkZXRhaWxfdXJsXCIpIHx8IFwiXCIsXG4gICAgICBzdGVhbVVybDogbWV0YWRhdGFWYWx1ZShjYWNoZSwgXCJzdGVhbV91cmxcIikgfHwgXCJcIixcbiAgICAgIGlnZGJVcmw6IG1ldGFkYXRhVmFsdWUoY2FjaGUsIFwiaWdkYl91cmxcIikgfHwgXCJcIixcbiAgICAgIHVwZGF0ZWRBdCxcbiAgICAgIG5vdGVDb3VudDogbm90ZXMubGVuZ3RoXG4gICAgfSBzYXRpc2ZpZXMgR2FtZUVudHJ5O1xuICB9KTtcblxuICByZXR1cm4gZW50cmllcy5zb3J0KChsZWZ0LCByaWdodCkgPT4ge1xuICAgIGlmIChsZWZ0LnVwZGF0ZWRBdCAhPT0gcmlnaHQudXBkYXRlZEF0KSByZXR1cm4gcmlnaHQudXBkYXRlZEF0IC0gbGVmdC51cGRhdGVkQXQ7XG4gICAgcmV0dXJuIGxlZnQudGl0bGUubG9jYWxlQ29tcGFyZShyaWdodC50aXRsZSwgXCJ6aC1IYW5zLUNOXCIpO1xuICB9KTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIEdhbWVEYXNoYm9hcmRQbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgR2FtZURhc2hib2FyZFNldHRpbmdzIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEdhbWVEYXNoYm9hcmRTZXR0aW5ncyA9IHtcbiAgZ2FtZXNSb290OiBcIjItS25vd2xlZGdlL01lZGlhIExpYnJhcnkvR2FtZXNcIixcbiAgbWFpbk5vdGVOYW1lOiBcIkdhbWUubWRcIixcbiAgb3Blbk5vdGVBZnRlckNyZWF0ZTogdHJ1ZSxcbiAgaWdkYkNsaWVudElkOiBcIlwiLFxuICBpZ2RiQ2xpZW50U2VjcmV0OiBcIlwiXG59O1xuXG5leHBvcnQgY2xhc3MgR2FtZURhc2hib2FyZFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBHYW1lRGFzaGJvYXJkUGx1Z2luO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEdhbWVEYXNoYm9hcmRQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkdhbWUgRGFzaGJvYXJkXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiR2FtZXMgcm9vdCBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRWFjaCBkaXJlY3Qgc3ViZm9sZGVyIHVuZGVyIHRoaXMgcGF0aCBpcyB0cmVhdGVkIGFzIG9uZSBnYW1lIGVudHJ5LiBFYWNoIGdhbWUgZm9sZGVyIHNob3VsZCBjb250YWluIEdhbWUubWQgYW5kIGFuIG9wdGlvbmFsIEdhbWVBc3NldHMgZm9sZGVyLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCIyLUtub3dsZWRnZS9NZWRpYSBMaWJyYXJ5L0dhbWVzXCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmdhbWVzUm9vdClcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5nYW1lc1Jvb3QgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnJlZnJlc2hBbGxWaWV3cygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk1haW4gbm90ZSBuYW1lXCIpXG4gICAgICAuc2V0RGVzYyhcIlRoZSBtYWluIGRldGFpbHMgbm90ZSBjcmVhdGVkIGluc2lkZSBlYWNoIGdhbWUgZm9sZGVyLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJHYW1lLm1kXCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm1haW5Ob3RlTmFtZSlcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXh0VmFsdWUgPSB2YWx1ZS50cmltKCkgfHwgREVGQVVMVF9TRVRUSU5HUy5tYWluTm90ZU5hbWU7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5tYWluTm90ZU5hbWUgPSBuZXh0VmFsdWUuZW5kc1dpdGgoXCIubWRcIikgPyBuZXh0VmFsdWUgOiBgJHtuZXh0VmFsdWV9Lm1kYDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ucmVmcmVzaEFsbFZpZXdzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiT3BlbiBub3RlIGFmdGVyIGNyZWF0ZVwiKVxuICAgICAgLnNldERlc2MoXCJPcGVuIHRoZSBuZXdseSBjcmVhdGVkIG1haW4gbm90ZSBhZnRlciB0aGUgY3JlYXRpb24gbW9kYWwgY29tcGxldGVzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PlxuICAgICAgICB0b2dnbGUuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Mub3Blbk5vdGVBZnRlckNyZWF0ZSkub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3Blbk5vdGVBZnRlckNyZWF0ZSA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIklHREIgSW1wb3J0XCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSUdEQiBDbGllbnQgSURcIilcbiAgICAgIC5zZXREZXNjKFwiVHdpdGNoIGFwcGxpY2F0aW9uIENsaWVudCBJRCB1c2VkIGZvciBJR0RCIHNlYXJjaCBhbmQgaW1wb3J0LlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJZb3VyIFR3aXRjaCBDbGllbnQgSURcIilcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaWdkYkNsaWVudElkKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmlnZGJDbGllbnRJZCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIklHREIgQ2xpZW50IFNlY3JldFwiKVxuICAgICAgLnNldERlc2MoXCJUd2l0Y2ggYXBwbGljYXRpb24gQ2xpZW50IFNlY3JldCB1c2VkIHRvIHJlcXVlc3QgSUdEQiBhY2Nlc3MgdG9rZW5zLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJZb3VyIFR3aXRjaCBDbGllbnQgU2VjcmV0XCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmlnZGJDbGllbnRTZWNyZXQpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaWdkYkNsaWVudFNlY3JldCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIk9wZW4gZGFzaGJvYXJkXCIpXG4gICAgICAuc2V0RGVzYyhcIk9wZW4gb3IgcmV2ZWFsIHRoZSBHYW1lIERhc2hib2FyZCB2aWV3LlwiKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIk9wZW5cIikub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYWN0aXZhdGVWaWV3KCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgR2FtZVNlYXJjaENhbmRpZGF0ZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmludGVyZmFjZSBTdGVhbVNlYXJjaEl0ZW0ge1xuICBpZDogbnVtYmVyO1xuICBuYW1lPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgU3RlYW1TZWFyY2hSZXNwb25zZSB7XG4gIGl0ZW1zPzogU3RlYW1TZWFyY2hJdGVtW107XG59XG5cbmludGVyZmFjZSBTdGVhbUFwcERhdGEge1xuICBuYW1lPzogc3RyaW5nO1xuICBzaG9ydF9kZXNjcmlwdGlvbj86IHN0cmluZztcbiAgZGV0YWlsZWRfZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGhlYWRlcl9pbWFnZT86IHN0cmluZztcbiAgY2Fwc3VsZV9pbWFnZT86IHN0cmluZztcbiAgY2Fwc3VsZV9pbWFnZXY1Pzogc3RyaW5nO1xuICBkZXZlbG9wZXJzPzogc3RyaW5nW107XG4gIHB1Ymxpc2hlcnM/OiBzdHJpbmdbXTtcbiAgZ2VucmVzPzogQXJyYXk8eyBkZXNjcmlwdGlvbj86IHN0cmluZyB9PjtcbiAgY2F0ZWdvcmllcz86IEFycmF5PHsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfT47XG4gIHJlbGVhc2VfZGF0ZT86IHtcbiAgICBkYXRlPzogc3RyaW5nO1xuICB9O1xuICBwbGF0Zm9ybXM/OiB7XG4gICAgd2luZG93cz86IGJvb2xlYW47XG4gICAgbWFjPzogYm9vbGVhbjtcbiAgICBsaW51eD86IGJvb2xlYW47XG4gIH07XG4gIHdlYnNpdGU/OiBzdHJpbmc7XG4gIHR5cGU/OiBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3RlYW1ZZWFyKGRhdGVUZXh0OiBzdHJpbmcgfCB1bmRlZmluZWQpOiB7IHllYXI6IHN0cmluZzsgcmVsZWFzZURhdGU6IHN0cmluZyB9IHtcbiAgaWYgKCFkYXRlVGV4dCkgcmV0dXJuIHsgeWVhcjogXCJcIiwgcmVsZWFzZURhdGU6IFwiXCIgfTtcbiAgY29uc3QgcGFyc2VkID0gRGF0ZS5wYXJzZShkYXRlVGV4dCk7XG4gIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgIGNvbnN0IHllYXJNYXRjaCA9IGRhdGVUZXh0Lm1hdGNoKC9cXGIoMTl8MjApXFxkezJ9XFxiLyk7XG4gICAgcmV0dXJuIHsgeWVhcjogeWVhck1hdGNoPy5bMF0gPz8gXCJcIiwgcmVsZWFzZURhdGU6IGRhdGVUZXh0IH07XG4gIH1cbiAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKHBhcnNlZCk7XG4gIHJldHVybiB7XG4gICAgeWVhcjogU3RyaW5nKGRhdGUuZ2V0RnVsbFllYXIoKSksXG4gICAgcmVsZWFzZURhdGU6IGRhdGUudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMClcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGxhdGZvcm1UZXh0KHBsYXRmb3JtczogU3RlYW1BcHBEYXRhW1wicGxhdGZvcm1zXCJdKTogc3RyaW5nIHtcbiAgaWYgKCFwbGF0Zm9ybXMpIHJldHVybiBcIlwiO1xuICBjb25zdCB2YWx1ZXMgPSBbXG4gICAgcGxhdGZvcm1zLndpbmRvd3MgPyBcIldpbmRvd3NcIiA6IFwiXCIsXG4gICAgcGxhdGZvcm1zLm1hYyA/IFwibWFjT1NcIiA6IFwiXCIsXG4gICAgcGxhdGZvcm1zLmxpbnV4ID8gXCJMaW51eFwiIDogXCJcIlxuICBdLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIHZhbHVlcy5qb2luKFwiLCBcIik7XG59XG5cbmZ1bmN0aW9uIHN0cmlwSHRtbChpbnB1dDogc3RyaW5nIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgcmV0dXJuIChpbnB1dCA/PyBcIlwiKS5yZXBsYWNlKC88W14+XSs+L2csIFwiIFwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBjbGFzcyBTdGVhbUNsaWVudCB7XG4gIGFzeW5jIHNlYXJjaEdhbWVzKHF1ZXJ5OiBzdHJpbmcpOiBQcm9taXNlPEdhbWVTZWFyY2hDYW5kaWRhdGVbXT4ge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBxdWVyeS50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBzZWFyY2ggPSBhd2FpdCByZXF1ZXN0VXJsKHtcbiAgICAgIHVybDogYGh0dHBzOi8vc3RvcmUuc3RlYW1wb3dlcmVkLmNvbS9hcGkvc3RvcmVzZWFyY2gvP3Rlcm09JHtlbmNvZGVVUklDb21wb25lbnQodHJpbW1lZCl9Jmw9ZW5nbGlzaCZjYz11c2AsXG4gICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHNlYXJjaEpzb24gPSBzZWFyY2guanNvbiBhcyBTdGVhbVNlYXJjaFJlc3BvbnNlO1xuICAgIGNvbnN0IGl0ZW1zID0gKHNlYXJjaEpzb24uaXRlbXMgPz8gW10pLnNsaWNlKDAsIDgpO1xuICAgIGNvbnN0IGRldGFpbHMgPSBhd2FpdCBQcm9taXNlLmFsbChpdGVtcy5tYXAoYXN5bmMgKGl0ZW0pID0+IGF3YWl0IHRoaXMuZ2V0QXBwQ2FuZGlkYXRlKGl0ZW0uaWQpKSk7XG4gICAgcmV0dXJuIGRldGFpbHMuZmlsdGVyKChpdGVtKTogaXRlbSBpcyBHYW1lU2VhcmNoQ2FuZGlkYXRlID0+IGl0ZW0gIT09IG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRBcHBDYW5kaWRhdGUoYXBwSWQ6IG51bWJlcik6IFByb21pc2U8R2FtZVNlYXJjaENhbmRpZGF0ZSB8IG51bGw+IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoe1xuICAgICAgdXJsOiBgaHR0cHM6Ly9zdG9yZS5zdGVhbXBvd2VyZWQuY29tL2FwaS9hcHBkZXRhaWxzP2FwcGlkcz0ke2FwcElkfSZsPWVuZ2xpc2gmY2M9dXNgLFxuICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXlsb2FkID0gcmVzcG9uc2UuanNvbj8uW1N0cmluZyhhcHBJZCldO1xuICAgIGlmICghcGF5bG9hZD8uc3VjY2VzcyB8fCAhcGF5bG9hZD8uZGF0YSkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBkYXRhID0gcGF5bG9hZC5kYXRhIGFzIFN0ZWFtQXBwRGF0YTtcbiAgICBpZiAoZGF0YS50eXBlICYmIGRhdGEudHlwZSAhPT0gXCJnYW1lXCIpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgeyB5ZWFyLCByZWxlYXNlRGF0ZSB9ID0gcGFyc2VTdGVhbVllYXIoZGF0YS5yZWxlYXNlX2RhdGU/LmRhdGUpO1xuICAgIGNvbnN0IHN1bW1hcnkgPSBzdHJpcEh0bWwoZGF0YS5zaG9ydF9kZXNjcmlwdGlvbik7XG4gICAgY29uc3Qgc3RvcnlsaW5lID0gc3RyaXBIdG1sKGRhdGEuZGV0YWlsZWRfZGVzY3JpcHRpb24pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBhcHBJZCxcbiAgICAgIHNvdXJjZTogXCJzdGVhbVwiLFxuICAgICAgdGl0bGU6IGRhdGEubmFtZSA/PyBgU3RlYW0gQXBwICR7YXBwSWR9YCxcbiAgICAgIHN1bW1hcnksXG4gICAgICBkZXZlbG9wZXI6IChkYXRhLmRldmVsb3BlcnMgPz8gW10pLmpvaW4oXCIsIFwiKSxcbiAgICAgIHB1Ymxpc2hlcjogKGRhdGEucHVibGlzaGVycyA/PyBbXSkuam9pbihcIiwgXCIpLFxuICAgICAgcGxhdGZvcm06IHBsYXRmb3JtVGV4dChkYXRhLnBsYXRmb3JtcyksXG4gICAgICB5ZWFyLFxuICAgICAgcmVsZWFzZURhdGUsXG4gICAgICByYXRpbmc6IFwiXCIsXG4gICAgICBvZmZpY2lhbFVybDogZGF0YS53ZWJzaXRlID8/IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vYXBwLyR7YXBwSWR9YCxcbiAgICAgIGRldGFpbFVybDogYGh0dHBzOi8vc3RvcmUuc3RlYW1wb3dlcmVkLmNvbS9hcHAvJHthcHBJZH1gLFxuICAgICAgc3RlYW1Vcmw6IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vYXBwLyR7YXBwSWR9YCxcbiAgICAgIGlnZGJVcmw6IFwiXCIsXG4gICAgICBwb3N0ZXJVcmw6IGRhdGEuY2Fwc3VsZV9pbWFnZXY1ID8/IGRhdGEuY2Fwc3VsZV9pbWFnZSA/PyBkYXRhLmhlYWRlcl9pbWFnZSA/PyBcIlwiLFxuICAgICAgYmFubmVyVXJsOiBkYXRhLmhlYWRlcl9pbWFnZSA/PyBkYXRhLmNhcHN1bGVfaW1hZ2V2NSA/PyBkYXRhLmNhcHN1bGVfaW1hZ2UgPz8gXCJcIixcbiAgICAgIHN0b3J5bGluZSxcbiAgICAgIGdlbnJlczogKGRhdGEuZ2VucmVzID8/IFtdKS5tYXAoKGdlbnJlKSA9PiBnZW5yZS5kZXNjcmlwdGlvbiA/PyBcIlwiKS5maWx0ZXIoQm9vbGVhbiksXG4gICAgICB0aGVtZXM6IFtdLFxuICAgICAgbW9kZXM6IChkYXRhLmNhdGVnb3JpZXMgPz8gW10pLm1hcCgoY2F0ZWdvcnkpID0+IGNhdGVnb3J5LmRlc2NyaXB0aW9uID8/IFwiXCIpLmZpbHRlcihCb29sZWFuKSxcbiAgICAgIHNjcmVlbnNob3RzOiBbXVxuICAgIH07XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIEl0ZW1WaWV3LCBNb2RhbCwgU2V0dGluZywgVEZpbGUsIFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIEdhbWVEYXNoYm9hcmRQbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgR2FtZUVudHJ5IH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGNvbnN0IEdBTUVfREFTSEJPQVJEX1ZJRVdfVFlQRSA9IFwiZ2FtZS1kYXNoYm9hcmQtdmlld1wiO1xuXG50eXBlIFNvcnRNb2RlID0gXCJ1cGRhdGVkXCIgfCBcIm5hbWVcIjtcbnR5cGUgU3RhdHVzRmlsdGVyID0gXCJhbGxcIiB8IFwiYWN0aXZlXCIgfCBcImJhY2tsb2dcIiB8IFwicGF1c2VkXCIgfCBcImNvbXBsZXRlZFwiIHwgXCJhcmNoaXZlZFwiIHwgXCJ1bnNvcnRlZFwiO1xuXG5jb25zdCBTVEFUVVNfTEFCRUxTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBhY3RpdmU6IFwiXHU4RkRCXHU4ODRDXHU0RTJEXCIsXG4gIGJhY2tsb2c6IFwiXHU1Rjg1XHU1RjAwXHU1OUNCXCIsXG4gIHBhdXNlZDogXCJcdTY2ODJcdTUwNUNcIixcbiAgY29tcGxldGVkOiBcIlx1NURGMlx1NUI4Q1x1NjIxMFwiLFxuICBhcmNoaXZlZDogXCJcdTVERjJcdTVGNTJcdTY4NjNcIixcbiAgdW5zb3J0ZWQ6IFwiXHU2NzJBXHU2NTc0XHU3NDA2XCJcbn07XG5cbmNvbnN0IFNFQ1RJT05TID0gW1xuICB7XG4gICAga2V5OiBcInBsYXlpbmdcIixcbiAgICB0aXRsZTogXCJcdTZCNjNcdTU3MjhcdTZFMzhcdTczQTlcIixcbiAgICBzdWJ0aXRsZTogXCJcdThGREJcdTg4NENcdTRFMkQgLyBcdTY2ODJcdTUwNUNcdTRFMkRcdTc2ODRcdTZFMzhcdTYyMEZcIixcbiAgICBjb2xsYXBzZWRCeURlZmF1bHQ6IGZhbHNlLFxuICAgIG1hdGNoOiAoZW50cnk6IEdhbWVFbnRyeSkgPT4gZW50cnkuc3RhdHVzID09PSBcImFjdGl2ZVwiIHx8IGVudHJ5LnN0YXR1cyA9PT0gXCJwYXVzZWRcIlxuICB9LFxuICB7XG4gICAga2V5OiBcImFsbFwiLFxuICAgIHRpdGxlOiBcIlx1NjI0MFx1NjcwOVx1NkUzOFx1NjIwRlwiLFxuICAgIHN1YnRpdGxlOiBcIlx1NUI4Q1x1NjU3NFx1NkUzOFx1NjIwRlx1NUU5M1wiLFxuICAgIGNvbGxhcHNlZEJ5RGVmYXVsdDogZmFsc2UsXG4gICAgbWF0Y2g6IChfZW50cnk6IEdhbWVFbnRyeSkgPT4gdHJ1ZVxuICB9XG5dIGFzIGNvbnN0O1xuXG5mdW5jdGlvbiBjcmVhdGVOb2RlPEsgZXh0ZW5kcyBrZXlvZiBIVE1MRWxlbWVudFRhZ05hbWVNYXA+KFxuICB0YWc6IEssXG4gIG9wdGlvbnM6IHsgY2xzPzogc3RyaW5nOyB0ZXh0Pzogc3RyaW5nIH0gPSB7fVxuKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gIGlmIChvcHRpb25zLmNscykgZWwuY2xhc3NOYW1lID0gb3B0aW9ucy5jbHM7XG4gIGlmIChvcHRpb25zLnRleHQgIT0gbnVsbCkgZWwudGV4dENvbnRlbnQgPSBvcHRpb25zLnRleHQ7XG4gIHJldHVybiBlbDtcbn1cblxuY2xhc3MgRGVsZXRlR2FtZUNvbmZpcm1Nb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBlbnRyeTogR2FtZUVudHJ5O1xuICBwcml2YXRlIHJlYWRvbmx5IG9uQ29uZmlybTogKCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgZW50cnk6IEdhbWVFbnRyeSwgb25Db25maXJtOiAoKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmVudHJ5ID0gZW50cnk7XG4gICAgdGhpcy5vbkNvbmZpcm0gPSBvbkNvbmZpcm07XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgcGx1Z2luID0gKHRoaXMuYXBwIGFzIEFwcCAmIHsgcGx1Z2lucz86IHsgcGx1Z2lucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0gfSkucGx1Z2lucz8ucGx1Z2lucz8uW1wiZ2FtZS1kYXNoYm9hcmRcIl07XG4gICAgaWYgKHBsdWdpbiAmJiB0eXBlb2YgKHBsdWdpbiBhcyBHYW1lRGFzaGJvYXJkUGx1Z2luKS5iZWdpbk1vZGFsU2Vzc2lvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAocGx1Z2luIGFzIEdhbWVEYXNoYm9hcmRQbHVnaW4pLmJlZ2luTW9kYWxTZXNzaW9uKCk7XG4gICAgfVxuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJcdTUyMjBcdTk2NjRcdTZFMzhcdTYyMEZcIiB9KTtcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IGBcdTVDMDZcdTUyMjBcdTk2NjRcdTIwMUMke3RoaXMuZW50cnkudGl0bGV9XHUyMDFEXHU1QkY5XHU1RTk0XHU3Njg0XHU2NTc0XHU0RTJBXHU2RTM4XHU2MjBGXHU2NTg3XHU0RUY2XHU1OTM5XHUzMDAyXHU4RkQ5XHU0RTJBXHU2NENEXHU0RjVDXHU0RjFBXHU1MjIwXHU5NjY0IEdhbWUubWRcdTMwMDFcdTUxNzNcdTgwNTRcdTdCMTRcdThCQjBcdTU0OEMgR2FtZUFzc2V0c1x1MzAwMmBcbiAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ1dHRvbikgPT5cbiAgICAgICAgYnV0dG9uLnNldEJ1dHRvblRleHQoXCJcdTUzRDZcdTZEODhcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYnV0dG9uKSA9PlxuICAgICAgICBidXR0b25cbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlx1NTIyMFx1OTY2NFwiKVxuICAgICAgICAgIC5zZXRXYXJuaW5nKClcbiAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHZvaWQgdGhpcy5vbkNvbmZpcm0oKTtcbiAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gd2luZG93LmZvY3VzKCksIDApO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCk6IHZvaWQge1xuICAgIGNvbnN0IHBsdWdpbiA9ICh0aGlzLmFwcCBhcyBBcHAgJiB7IHBsdWdpbnM/OiB7IHBsdWdpbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB9IH0pLnBsdWdpbnM/LnBsdWdpbnM/LltcImdhbWUtZGFzaGJvYXJkXCJdO1xuICAgIGlmIChwbHVnaW4gJiYgdHlwZW9mIChwbHVnaW4gYXMgR2FtZURhc2hib2FyZFBsdWdpbikuZW5kTW9kYWxTZXNzaW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIChwbHVnaW4gYXMgR2FtZURhc2hib2FyZFBsdWdpbikuZW5kTW9kYWxTZXNzaW9uKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHYW1lRGFzaGJvYXJkVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcGx1Z2luOiBHYW1lRGFzaGJvYXJkUGx1Z2luO1xuICBlbnRyaWVzOiBHYW1lRW50cnlbXSA9IFtdO1xuICBxdWVyeSA9IFwiXCI7XG4gIHNvcnRNb2RlOiBTb3J0TW9kZSA9IFwidXBkYXRlZFwiO1xuICBzdGF0dXNGaWx0ZXI6IFN0YXR1c0ZpbHRlciA9IFwiYWxsXCI7XG4gIHNlbGVjdGVkUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGNvbGxhcHNlZFNlY3Rpb25zOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICBTRUNUSU9OUy5tYXAoKHNlY3Rpb24pID0+IFtzZWN0aW9uLmtleSwgc2VjdGlvbi5jb2xsYXBzZWRCeURlZmF1bHRdKVxuICApO1xuXG4gIHByaXZhdGUgZmxvYXRpbmdUb29sdGlwRWw6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2hlbGxFbDogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkZXRhaWxIb3N0RWw6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2VjdGlvbnNIb3N0RWw6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZW5kY2FwSG9zdEVsOiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGZpbHRlckJhckVsOiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogR2FtZURhc2hib2FyZFBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gR0FNRV9EQVNIQk9BUkRfVklFV19UWVBFO1xuICB9XG5cbiAgZ2V0RGlzcGxheVRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gXCJHYW1lIERhc2hib2FyZFwiO1xuICB9XG5cbiAgZ2V0SWNvbigpOiBzdHJpbmcge1xuICAgIHJldHVybiBcImdhbWVwYWQtMlwiO1xuICB9XG5cbiAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY29udGVudEVsLmFkZENsYXNzKFwiZ2FtZS1kYXNoYm9hcmQtdmlld1wiKTtcbiAgICB0aGlzLmVuc3VyZUZsb2F0aW5nVG9vbHRpcCgpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgYXN5bmMgb25DbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmZsb2F0aW5nVG9vbHRpcEVsPy5yZW1vdmUoKTtcbiAgICB0aGlzLmZsb2F0aW5nVG9vbHRpcEVsID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuZW50cmllcyA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEdhbWVzKCk7XG4gICAgICB0aGlzLnJlbmRlcih0aGlzLmVudHJpZXMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiR2FtZSBEYXNoYm9hcmQgcmVuZGVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuICAgICAgdGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoXCJnYW1lLWRhc2hib2FyZC12aWV3XCIpO1xuICAgICAgY29uc3Qgc2hlbGwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtc2hlbGxcIiB9KTtcbiAgICAgIGNvbnN0IHBhbmVsID0gc2hlbGwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1jYXJkXCIgfSk7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1jb250ZW50XCIgfSk7XG4gICAgICBjb250ZW50LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJnYW1lLWRhc2hib2FyZC1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBgUmVuZGVyIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBlbnN1cmVGbG9hdGluZ1Rvb2x0aXAoKTogdm9pZCB7XG4gICAgdGhpcy5mbG9hdGluZ1Rvb2x0aXBFbD8ucmVtb3ZlKCk7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGVsLmNsYXNzTmFtZSA9IFwiZ2FtZS1kYXNoYm9hcmQtZmxvYXRpbmctdG9vbHRpcFwiO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHRoaXMuZmxvYXRpbmdUb29sdGlwRWwgPSBlbDtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKGVudHJpZXM6IEdhbWVFbnRyeVtdKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMuY29udGVudEVsO1xuICAgIHJvb3QuZW1wdHkoKTtcblxuICAgIGNvbnN0IGZpbHRlcmVkRW50cmllcyA9IHRoaXMuZmlsdGVyRW50cmllcyhlbnRyaWVzKTtcbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRQYXRoICYmIGZpbHRlcmVkRW50cmllcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkUGF0aCA9IGZpbHRlcmVkRW50cmllc1swXS5mb2xkZXIucGF0aDtcbiAgICB9XG4gICAgaWYgKGZpbHRlcmVkRW50cmllcy5sZW5ndGggPiAwICYmICFmaWx0ZXJlZEVudHJpZXMuc29tZSgoZW50cnkpID0+IGVudHJ5LmZvbGRlci5wYXRoID09PSB0aGlzLnNlbGVjdGVkUGF0aCkpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRQYXRoID0gZmlsdGVyZWRFbnRyaWVzWzBdLmZvbGRlci5wYXRoO1xuICAgIH1cblxuICAgIGNvbnN0IHNoZWxsID0gcm9vdC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtc2hlbGxcIiB9KTtcbiAgICB0aGlzLnNoZWxsRWwgPSBzaGVsbDtcbiAgICB0aGlzLnJlbmRlckhlcm8oc2hlbGwsIGVudHJpZXMpO1xuICAgIHRoaXMucmVuZGVyVG9vbGJhcihzaGVsbCk7XG4gICAgdGhpcy5maWx0ZXJCYXJFbCA9IHNoZWxsLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1maWx0ZXJiYXJcIiB9KTtcbiAgICB0aGlzLnJlbmRlckZpbHRlckJhcihlbnRyaWVzKTtcbiAgICB0aGlzLmRldGFpbEhvc3RFbCA9IHNoZWxsLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtaG9zdFwiIH0pO1xuICAgIHRoaXMuc2VjdGlvbnNIb3N0RWwgPSBzaGVsbC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtc2VjdGlvbnMtaG9zdFwiIH0pO1xuICAgIHRoaXMuZW5kY2FwSG9zdEVsID0gc2hlbGwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWVuZGNhcC1ob3N0XCIgfSk7XG4gICAgdGhpcy5yZW5kZXJDb250ZW50KCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNvbnRlbnQoKTogdm9pZCB7XG4gICAgY29uc3QgZmlsdGVyZWRFbnRyaWVzID0gdGhpcy5maWx0ZXJFbnRyaWVzKHRoaXMuZW50cmllcyk7XG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkUGF0aCAmJiBmaWx0ZXJlZEVudHJpZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5zZWxlY3RlZFBhdGggPSBmaWx0ZXJlZEVudHJpZXNbMF0uZm9sZGVyLnBhdGg7XG4gICAgfVxuICAgIGlmIChmaWx0ZXJlZEVudHJpZXMubGVuZ3RoID4gMCAmJiAhZmlsdGVyZWRFbnRyaWVzLnNvbWUoKGVudHJ5KSA9PiBlbnRyeS5mb2xkZXIucGF0aCA9PT0gdGhpcy5zZWxlY3RlZFBhdGgpKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkUGF0aCA9IGZpbHRlcmVkRW50cmllc1swXS5mb2xkZXIucGF0aDtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3RlZCA9IGZpbHRlcmVkRW50cmllcy5maW5kKChlbnRyeSkgPT4gZW50cnkuZm9sZGVyLnBhdGggPT09IHRoaXMuc2VsZWN0ZWRQYXRoKSA/PyBudWxsO1xuXG4gICAgdGhpcy5kZXRhaWxIb3N0RWw/LmVtcHR5KCk7XG4gICAgdGhpcy5zZWN0aW9uc0hvc3RFbD8uZW1wdHkoKTtcbiAgICB0aGlzLmVuZGNhcEhvc3RFbD8uZW1wdHkoKTtcblxuICAgIGlmICh0aGlzLmRldGFpbEhvc3RFbCkgdGhpcy5yZW5kZXJEZXRhaWwodGhpcy5kZXRhaWxIb3N0RWwsIHNlbGVjdGVkKTtcbiAgICBpZiAodGhpcy5zZWN0aW9uc0hvc3RFbCkgdGhpcy5yZW5kZXJTZWN0aW9ucyh0aGlzLnNlY3Rpb25zSG9zdEVsLCBmaWx0ZXJlZEVudHJpZXMpO1xuICAgIGlmICh0aGlzLmVuZGNhcEhvc3RFbCkgdGhpcy5yZW5kZXJFbmRjYXAodGhpcy5lbmRjYXBIb3N0RWwsIGZpbHRlcmVkRW50cmllcy5sZW5ndGgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTY3JvbGxDb250YWluZXIoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiAodGhpcy5jb250ZW50RWwuY2xvc2VzdChcIi52aWV3LWNvbnRlbnRcIikgYXMgSFRNTEVsZW1lbnQgfCBudWxsKSA/PyB0aGlzLmNvbnRlbnRFbDtcbiAgfVxuXG4gIHByaXZhdGUgcHJlc2VydmVTY3JvbGwoY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmdldFNjcm9sbENvbnRhaW5lcigpO1xuICAgIGNvbnN0IHRvcCA9IGNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgY2FsbGJhY2soKTtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AgPSB0b3A7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckhlcm8oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZW50cmllczogR2FtZUVudHJ5W10pOiB2b2lkIHtcbiAgICBjb25zdCBoZXJvID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1oZXJvXCIgfSk7XG4gICAgY29uc3QgaGVhZGluZyA9IGhlcm8uY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWhlcm8tY29weVwiIH0pO1xuICAgIGhlYWRpbmcuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWtpY2tlclwiLCB0ZXh0OiBcIkdhbWUgTGlicmFyeVwiIH0pO1xuICAgIGhlYWRpbmcuY3JlYXRlRWwoXCJoMlwiLCB7IGNsczogXCJnYW1lLWRhc2hib2FyZC1oZXJvLXRpdGxlXCIsIHRleHQ6IFwiU3RlYW0gXHU5OENFXHU2ODNDXHU2RDRGXHU4OUM4XHU0RjYwXHU3Njg0XHU2RTM4XHU2MjBGXHU1RTkzXCIgfSk7XG4gICAgaGVhZGluZy5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWhlcm8tdGV4dFwiLFxuICAgICAgdGV4dDogXCJcdTcwQjlcdTUxRkJcdTVDMDFcdTk3NjJcdTUyMDdcdTYzNjJcdThCRTZcdTYwQzVcdUZGMENcdTUzQ0NcdTUxRkJcdTVDMDFcdTk3NjJcdTYyNTNcdTVGMDBcdTRFM0JcdTdCMTRcdThCQjBcdTMwMDJcdTZCQ0ZcdTRFMkFcdTZFMzhcdTYyMEZcdTY1ODdcdTRFRjZcdTU5MzlcdTUzMDVcdTU0MkJcdTRFMDBcdTRFMkFcdTRFM0JcdTY1ODdcdTY4NjNcdTU0OENcdTgyRTVcdTVFNzJcdTUxNzNcdTgwNTRcdTdCMTRcdThCQjBcdTMwMDJcIlxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdHMgPSBoZXJvLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zdGF0c1wiIH0pO1xuICAgIGNvbnN0IHBsYXlpbmdDb3VudCA9IGVudHJpZXMuZmlsdGVyKChlbnRyeSkgPT4gZW50cnkuc3RhdHVzID09PSBcImFjdGl2ZVwiIHx8IGVudHJ5LnN0YXR1cyA9PT0gXCJwYXVzZWRcIikubGVuZ3RoO1xuICAgIGNvbnN0IGNvbXBsZXRlZENvdW50ID0gZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiBlbnRyeS5zdGF0dXMgPT09IFwiY29tcGxldGVkXCIpLmxlbmd0aDtcblxuICAgIFtcbiAgICAgIFtcIlx1RDgzQ1x1REZBRSBcdTYyNDBcdTY3MDlcdTZFMzhcdTYyMEZcIiwgU3RyaW5nKGVudHJpZXMubGVuZ3RoKV0sXG4gICAgICBbXCJcdUQ4M0RcdURENzkgXHU2QjYzXHU1NzI4XHU2RTM4XHU3M0E5XCIsIFN0cmluZyhwbGF5aW5nQ291bnQpXSxcbiAgICAgIFtcIlx1RDgzQ1x1REZDMSBcdTVERjJcdTVCOENcdTYyMTBcIiwgU3RyaW5nKGNvbXBsZXRlZENvdW50KV1cbiAgICBdLmZvckVhY2goKFtsYWJlbCwgdmFsdWVdKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ID0gc3RhdHMuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXN0YXRcIiB9KTtcbiAgICAgIHN0YXQuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXN0YXQtbGFiZWxcIiwgdGV4dDogbGFiZWwgfSk7XG4gICAgICBzdGF0LmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zdGF0LXZhbHVlXCIsIHRleHQ6IHZhbHVlIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXRVcGRhdGVkQXQodGltZXN0YW1wOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGlmICghdGltZXN0YW1wKSByZXR1cm4gXCJVbmtub3duXCI7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgRGF0ZSh0aW1lc3RhbXApO1xuICAgIHJldHVybiBOdW1iZXIuaXNOYU4odmFsdWUuZ2V0VGltZSgpKSA/IFwiVW5rbm93blwiIDogdmFsdWUudG9Mb2NhbGVTdHJpbmcoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVG9vbGJhcihjb250YWluZXI6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgdG9vbGJhciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtdG9vbGJhclwiIH0pO1xuICAgIGNvbnN0IGxlZnQgPSB0b29sYmFyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC10b29sYmFyLWdyb3VwXCIgfSk7XG5cbiAgICBjb25zdCBzZWFyY2ggPSBsZWZ0LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWlucHV0XCIsXG4gICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIlx1NjQxQ1x1N0QyMlx1NkUzOFx1NjIwRlx1MzAwMVx1NUU3M1x1NTNGMFx1MzAwMVx1NUYwMFx1NTNEMVx1NTU0NlwiXG4gICAgfSk7XG4gICAgc2VhcmNoLnZhbHVlID0gdGhpcy5xdWVyeTtcbiAgICBzZWFyY2guYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcbiAgICAgIHRoaXMucXVlcnkgPSBzZWFyY2gudmFsdWUudHJpbSgpO1xuICAgICAgdGhpcy5yZW5kZXJDb250ZW50KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzb3J0ID0gbGVmdC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zZWxlY3RcIiB9KTtcbiAgICBbXG4gICAgICBbXCJ1cGRhdGVkXCIsIFwiXHU2NzAwXHU4RkQxXHU2NkY0XHU2NUIwXCJdLFxuICAgICAgW1wibmFtZVwiLCBcIlx1NjMwOVx1NjgwN1x1OTg5OFwiXVxuICAgIF0uZm9yRWFjaCgoW3ZhbHVlLCBsYWJlbF0pID0+IHNvcnQuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB2YWx1ZSwgdGV4dDogbGFiZWwgfSkpO1xuICAgIHNvcnQudmFsdWUgPSB0aGlzLnNvcnRNb2RlO1xuICAgIHNvcnQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLnNvcnRNb2RlID0gc29ydC52YWx1ZSBhcyBTb3J0TW9kZTtcbiAgICAgIHRoaXMucmVuZGVyQ29udGVudCgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcmlnaHQgPSB0b29sYmFyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC10b29sYmFyLWdyb3VwXCIgfSk7XG4gICAgY29uc3QgcmVmcmVzaEJ1dHRvbiA9IHJpZ2h0LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWJ1dHRvbiBzdWJ0bGVcIiwgdGV4dDogXCJSZWZyZXNoXCIgfSk7XG4gICAgcmVmcmVzaEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoKCk7XG4gICAgfSk7XG4gICAgY29uc3QgY3JlYXRlQnV0dG9uID0gcmlnaHQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtYnV0dG9uXCIsIHRleHQ6IFwiKyBOZXcgR2FtZVwiIH0pO1xuICAgIGNyZWF0ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gdGhpcy5wbHVnaW4ub3BlbkNyZWF0ZUdhbWVNb2RhbCgpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyRmlsdGVyQmFyKGVudHJpZXM6IEdhbWVFbnRyeVtdKTogdm9pZCB7XG4gICAgY29uc3QgYmFyID0gdGhpcy5maWx0ZXJCYXJFbDtcbiAgICBpZiAoIWJhcikgcmV0dXJuO1xuICAgIGJhci5lbXB0eSgpO1xuICAgIGNvbnN0IGNvdW50cyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gICAgY291bnRzLnNldChcImFsbFwiLCBlbnRyaWVzLmxlbmd0aCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICBjb3VudHMuc2V0KGVudHJ5LnN0YXR1cywgKGNvdW50cy5nZXQoZW50cnkuc3RhdHVzKSA/PyAwKSArIDEpO1xuICAgIH1cblxuICAgIChcbiAgICAgIFtcbiAgICAgICAgW1wiYWxsXCIsIFwiXHU1MTY4XHU5MEU4XCJdLFxuICAgICAgICBbXCJhY3RpdmVcIiwgXCJcdThGREJcdTg4NENcdTRFMkRcIl0sXG4gICAgICAgIFtcImJhY2tsb2dcIiwgXCJcdTVGODVcdTVGMDBcdTU5Q0JcIl0sXG4gICAgICAgIFtcInBhdXNlZFwiLCBcIlx1NjY4Mlx1NTA1Q1wiXSxcbiAgICAgICAgW1wiY29tcGxldGVkXCIsIFwiXHU1REYyXHU1QjhDXHU2MjEwXCJdLFxuICAgICAgICBbXCJhcmNoaXZlZFwiLCBcIlx1NURGMlx1NUY1Mlx1Njg2M1wiXSxcbiAgICAgICAgW1widW5zb3J0ZWRcIiwgXCJcdTY3MkFcdTY1NzRcdTc0MDZcIl1cbiAgICAgIF0gc2F0aXNmaWVzIEFycmF5PFtTdGF0dXNGaWx0ZXIsIHN0cmluZ10+XG4gICAgKS5mb3JFYWNoKChbdmFsdWUsIGxhYmVsXSkgPT4ge1xuICAgICAgY29uc3QgYnV0dG9uID0gYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBgZ2FtZS1kYXNoYm9hcmQtZmlsdGVyLWNoaXAgJHt0aGlzLnN0YXR1c0ZpbHRlciA9PT0gdmFsdWUgPyBcImlzLWFjdGl2ZVwiIDogXCJcIn1gLFxuICAgICAgICB0ZXh0OiBgJHtsYWJlbH0gJHtjb3VudHMuZ2V0KHZhbHVlKSA/PyAwfWBcbiAgICAgIH0pO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc3RhdHVzRmlsdGVyID0gdmFsdWU7XG4gICAgICAgIHRoaXMucmVuZGVyRmlsdGVyQmFyKHRoaXMuZW50cmllcyk7XG4gICAgICAgIHRoaXMucHJlc2VydmVTY3JvbGwoKCkgPT4gdGhpcy5yZW5kZXJDb250ZW50KCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckRldGFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBlbnRyeTogR2FtZUVudHJ5IHwgbnVsbCk6IHZvaWQge1xuICAgIGNvbnN0IHBhbmVsID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtcGFuZWxcIiB9KTtcblxuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHBhbmVsLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1lbXB0eSBnYW1lLWRhc2hib2FyZC1kZXRhaWwtZW1wdHlcIiwgdGV4dDogXCJcdTVGNTNcdTUyNERcdTZDQTFcdTY3MDlcdTUzRUZcdTVDNTVcdTc5M0FcdTc2ODRcdTZFMzhcdTYyMEZcdTY3NjFcdTc2RUVcdTMwMDJcIiB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjYXJkID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1jYXJkXCIgfSk7XG4gICAgY29uc3QgcHJldmlldyA9IGNhcmQuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1wcmV2aWV3XCIgfSk7XG5cbiAgICBpZiAoZW50cnkucG9zdGVyRmlsZSkge1xuICAgICAgcHJldmlldy5jcmVhdGVFbChcImltZ1wiLCB7XG4gICAgICAgIGF0dHI6IHtcbiAgICAgICAgICBzcmM6IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChlbnRyeS5wb3N0ZXJGaWxlKSxcbiAgICAgICAgICBhbHQ6IGAke2VudHJ5LnRpdGxlfSBwb3N0ZXJgXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2aWV3LmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtZmFsbGJhY2tcIiwgdGV4dDogXCJcdUQ4M0NcdURGQUVcIiB9KTtcbiAgICB9XG5cbiAgICBwcmV2aWV3LmFwcGVuZENoaWxkKHRoaXMucmVuZGVyUG9zdGVyT3ZlcmxheShlbnRyeSwgZmFsc2UpKTtcblxuICAgIGNvbnN0IGNvbnRlbnQgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtY29udGVudFwiIH0pO1xuICAgIGNvbnN0IGJvZHkgPSBjb250ZW50LmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtbWFpblwiIH0pO1xuXG4gICAgY29uc3Qga2lja2VyID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtZGV0YWlsLWtpY2tlclwiIH0pO1xuICAgIGtpY2tlci5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBlbnRyeS5yZWxhdGl2ZVBhdGggfSk7XG4gICAga2lja2VyLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGBVcGRhdGVkICR7dGhpcy5mb3JtYXRVcGRhdGVkQXQoZW50cnkudXBkYXRlZEF0KX1gIH0pO1xuXG4gICAgY29uc3QgdGl0bGVSb3cgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtdGl0bGUtcm93XCIgfSk7XG4gICAgY29uc3QgdGl0bGUgPSB0aXRsZVJvdy5jcmVhdGVFbChcImgzXCIsIHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC10aXRsZVwiIH0pO1xuICAgIHRpdGxlLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlRmlsZUxpbmsoZW50cnkudGl0bGUsIGVudHJ5Lm1haW5GaWxlKSk7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVTdGF0dXNQaWxsKGVudHJ5LnN0YXR1cykpO1xuXG4gICAgY29uc3QgbWV0YSA9IFtcbiAgICAgIGVudHJ5LmRldmVsb3BlcixcbiAgICAgIGVudHJ5LnBsYXRmb3JtLFxuICAgICAgZW50cnkueWVhcixcbiAgICAgIGVudHJ5LnByb2dyZXNzLFxuICAgICAgZW50cnkucmF0aW5nICYmIGBcdThCQzRcdTUyMDYgJHtlbnRyeS5yYXRpbmd9YFxuICAgIF1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKFwiIFx1MDBCNyBcIik7XG4gICAgaWYgKG1ldGEpIGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1tZXRhXCIsIHRleHQ6IG1ldGEgfSk7XG5cbiAgICBjb25zdCBmYWN0cyA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWRldGFpbC1mYWN0c1wiIH0pO1xuICAgIFtcbiAgICAgIGVudHJ5LnBsYXRmb3JtID8gYFBsYXRmb3JtIFx1MDBCNyAke2VudHJ5LnBsYXRmb3JtfWAgOiBcIlwiLFxuICAgICAgZW50cnkucHJvZ3Jlc3MgPyBgUHJvZ3Jlc3MgXHUwMEI3ICR7ZW50cnkucHJvZ3Jlc3N9YCA6IFwiXCIsXG4gICAgICBlbnRyeS5yYXRpbmcgPyBgUmF0aW5nIFx1MDBCNyAke2VudHJ5LnJhdGluZ31gIDogXCJcIlxuICAgIF1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5mb3JFYWNoKCh0ZXh0KSA9PiB7XG4gICAgICAgIGZhY3RzLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1kZXRhaWwtZmFjdFwiLCB0ZXh0IH0pO1xuICAgICAgfSk7XG4gICAgaWYgKGZhY3RzLmNoaWxkRWxlbWVudENvdW50ID09PSAwKSBmYWN0cy5yZW1vdmUoKTtcblxuICAgIGNvbnN0IHN1bW1hcnkgPSBib2R5LmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtZGV0YWlsLXN1bW1hcnlcIixcbiAgICAgIHRleHQ6IGVudHJ5LnN1bW1hcnkgfHwgXCJcdTY2ODJcdTY1RTBcdTY0NThcdTg5ODFcdTMwMDJcdTU0MEVcdTdFRURcdTUzRUZcdTRFRTVcdTkwMUFcdThGQzdcdTRFM0JcdTY1ODdcdTY4NjMgZnJvbnRtYXR0ZXIgXHU2MjE2XHU2QjYzXHU2NTg3XHU1NDBDXHU2QjY1XHU4ODY1XHU1MTY4XHUzMDAyXCJcbiAgICB9KTtcbiAgICBzdW1tYXJ5LnNldEF0dHJpYnV0ZShcImRpclwiLCBcImF1dG9cIik7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtYWN0aW9uLXJvd1wiIH0pO1xuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVGaWxlTGluayhcIlx1NjI1M1x1NUYwMFx1NEUzQlx1N0IxNFx1OEJCMFwiLCBlbnRyeS5tYWluRmlsZSwgXCJnYW1lLWRhc2hib2FyZC1idXR0b24gcHJpbWFyeVwiKSk7XG4gICAgaWYgKGVudHJ5Lm9mZmljaWFsVXJsKSBhY3Rpb25zLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlRXh0ZXJuYWxMaW5rKFwiXHU1Qjk4XHU2NUI5XHU5NEZFXHU2M0E1XCIsIGVudHJ5Lm9mZmljaWFsVXJsLCBcImdhbWUtZGFzaGJvYXJkLWJ1dHRvblwiKSk7XG4gICAgaWYgKGVudHJ5LmRldGFpbFVybCkgYWN0aW9ucy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUV4dGVybmFsTGluayhcIlx1OEJFNlx1NjBDNVx1OTg3NVwiLCBlbnRyeS5kZXRhaWxVcmwsIFwiZ2FtZS1kYXNoYm9hcmQtYnV0dG9uXCIpKTtcbiAgICBjb25zdCBkZWxldGVCdXR0b24gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWJ1dHRvbiBkYW5nZXJcIiwgdGV4dDogXCJcdTUyMjBcdTk2NjRcdTZFMzhcdTYyMEZcIiB9KTtcbiAgICBkZWxldGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgICAgIG5ldyBEZWxldGVHYW1lQ29uZmlybU1vZGFsKHRoaXMuYXBwLCBlbnRyeSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICB0aGlzLmhpZGVUb29sdGlwKCk7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkUGF0aCA9PT0gZW50cnkuZm9sZGVyLnBhdGgpIHRoaXMuc2VsZWN0ZWRQYXRoID0gbnVsbDtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZGVsZXRlR2FtZShlbnRyeSk7XG4gICAgICB9KS5vcGVuKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzaWRlID0gY29udGVudC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtZGV0YWlsLXNpZGVcIiB9KTtcbiAgICBjb25zdCByZWxhdGVkID0gc2lkZS5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtcmVsYXRlZFwiIH0pO1xuICAgIHJlbGF0ZWQuY3JlYXRlRWwoXCJoNFwiLCB7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zaWRlLXRpdGxlXCIsIHRleHQ6IFwiXHU1MTczXHU4MDU0XHU3QjE0XHU4QkIwXCIgfSk7XG4gICAgY29uc3Qgbm90ZXMgPSByZWxhdGVkLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1ub3RlLWxpc3RcIiB9KTtcbiAgICBpZiAoZW50cnkubm90ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBub3Rlcy5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtZW1wdHktaW5saW5lXCIsIHRleHQ6IFwiXHU4RkQ4XHU2Q0ExXHU2NzA5XHU1MTczXHU4MDU0XHU3QjE0XHU4QkIwXHUzMDAyXCIgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVudHJ5Lm5vdGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgICAgbm90ZXMuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVGaWxlTGluayhmaWxlLmJhc2VuYW1lLCBmaWxlLCBcImdhbWUtZGFzaGJvYXJkLW5vdGUtY2hpcFwiKSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclNlY3Rpb25zKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGVudHJpZXM6IEdhbWVFbnRyeVtdKTogdm9pZCB7XG4gICAgY29uc3QgaG9zdCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtc2VjdGlvbnNcIiB9KTtcbiAgICBmb3IgKGNvbnN0IHNlY3Rpb24gb2YgU0VDVElPTlMpIHtcbiAgICAgIGNvbnN0IGl0ZW1zID0gZW50cmllcy5maWx0ZXIoc2VjdGlvbi5tYXRjaCk7XG4gICAgICBjb25zdCBjb2xsYXBzZWQgPSB0aGlzLmNvbGxhcHNlZFNlY3Rpb25zW3NlY3Rpb24ua2V5XTtcblxuICAgICAgY29uc3Qgd3JhcHBlciA9IGhvc3QuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBgZ2FtZS1kYXNoYm9hcmQtc2VjdGlvbiAke2NvbGxhcHNlZCA/IFwiaXMtY29sbGFwc2VkXCIgOiBcImlzLWV4cGFuZGVkXCJ9YFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGhlYWRlciA9IHdyYXBwZXIuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXNlY3Rpb24taGVhZGVyXCIgfSk7XG4gICAgICBjb25zdCBoZWFkaW5nID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zZWN0aW9uLWhlYWRpbmdcIiB9KTtcbiAgICAgIGhlYWRpbmcuY3JlYXRlRWwoXCJoM1wiLCB7IGNsczogXCJnYW1lLWRhc2hib2FyZC1zZWN0aW9uLXRpdGxlXCIsIHRleHQ6IHNlY3Rpb24udGl0bGUgfSk7XG4gICAgICBoZWFkaW5nLmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJnYW1lLWRhc2hib2FyZC1zZWN0aW9uLXN1YnRpdGxlXCIsXG4gICAgICAgIHRleHQ6IGAke2l0ZW1zLmxlbmd0aH0gaXRlbXMgXHUwMEI3ICR7c2VjdGlvbi5zdWJ0aXRsZX1gXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgdG9nZ2xlID0gaGVhZGVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXRvZ2dsZVwiLFxuICAgICAgICB0ZXh0OiBjb2xsYXBzZWQgPyBcIlx1NUM1NVx1NUYwMFwiIDogXCJcdTY1MzZcdThENzdcIlxuICAgICAgfSk7XG4gICAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5jb2xsYXBzZWRTZWN0aW9uc1tzZWN0aW9uLmtleV0gPSAhdGhpcy5jb2xsYXBzZWRTZWN0aW9uc1tzZWN0aW9uLmtleV07XG4gICAgICAgIHdyYXBwZXIudG9nZ2xlQ2xhc3MoXCJpcy1jb2xsYXBzZWRcIiwgdGhpcy5jb2xsYXBzZWRTZWN0aW9uc1tzZWN0aW9uLmtleV0pO1xuICAgICAgICB3cmFwcGVyLnRvZ2dsZUNsYXNzKFwiaXMtZXhwYW5kZWRcIiwgIXRoaXMuY29sbGFwc2VkU2VjdGlvbnNbc2VjdGlvbi5rZXldKTtcbiAgICAgICAgdG9nZ2xlLnNldFRleHQodGhpcy5jb2xsYXBzZWRTZWN0aW9uc1tzZWN0aW9uLmtleV0gPyBcIlx1NUM1NVx1NUYwMFwiIDogXCJcdTY1MzZcdThENzdcIik7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYm9keSA9IHdyYXBwZXIuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXNlY3Rpb24tYm9keVwiIH0pO1xuICAgICAgY29uc3QgZ3JpZCA9IGJvZHkuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWdyaWRcIiB9KTtcblxuICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBncmlkLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1lbXB0eVwiLCB0ZXh0OiBcIlx1NUY1M1x1NTI0RFx1NTIwNlx1N0VDNFx1NkNBMVx1NjcwOVx1NTMzOVx1OTE0RFx1Njc2MVx1NzZFRVx1MzAwMlwiIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbXMuZm9yRWFjaCgoZW50cnkpID0+IGdyaWQuYXBwZW5kQ2hpbGQodGhpcy5idWlsZENhcmQoZW50cnkpKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJFbmRjYXAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgY291bnQ6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGVuZGNhcCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtZW5kY2FwXCIgfSk7XG4gICAgZW5kY2FwLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1lbmRjYXAtbGluZVwiIH0pO1xuICAgIGVuZGNhcC5jcmVhdGVEaXYoe1xuICAgICAgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWVuZGNhcC10ZXh0XCIsXG4gICAgICB0ZXh0OiBjb3VudCA+IDAgPyBgRW5kIG9mIExpYnJhcnkgXHUwMEI3ICR7Y291bnR9IHZpc2libGVgIDogXCJFbmQgb2YgTGlicmFyeVwiXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGJ1aWxkQ2FyZChlbnRyeTogR2FtZUVudHJ5KTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGNhcmQgPSBjcmVhdGVOb2RlKFwiYnV0dG9uXCIsIHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLWNhcmRcIiB9KTtcbiAgICBpZiAoZW50cnkuZm9sZGVyLnBhdGggPT09IHRoaXMuc2VsZWN0ZWRQYXRoKSBjYXJkLmFkZENsYXNzKFwiaXMtc2VsZWN0ZWRcIik7XG5cbiAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLnNlbGVjdGVkUGF0aCA9IGVudHJ5LmZvbGRlci5wYXRoO1xuICAgICAgdGhpcy5oaWRlVG9vbHRpcCgpO1xuICAgICAgdGhpcy5wcmVzZXJ2ZVNjcm9sbCgoKSA9PiB0aGlzLnJlbmRlckNvbnRlbnQoKSk7XG4gICAgfSk7XG5cbiAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmhpZGVUb29sdGlwKCk7XG4gICAgICBpZiAoZW50cnkubWFpbkZpbGUpIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpLm9wZW5GaWxlKGVudHJ5Lm1haW5GaWxlKTtcbiAgICB9KTtcblxuICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKCkgPT4gdGhpcy5zaG93VG9vbHRpcChjYXJkLCBlbnRyeSkpO1xuICAgIGNhcmQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgKCkgPT4gdGhpcy5oaWRlVG9vbHRpcCgpKTtcbiAgICBjYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCAoKSA9PiB0aGlzLnNob3dUb29sdGlwKGNhcmQsIGVudHJ5KSk7XG4gICAgY2FyZC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB0aGlzLmhpZGVUb29sdGlwKCkpO1xuXG4gICAgY29uc3QgY292ZXIgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1jYXJkLWNvdmVyXCIgfSk7XG4gICAgaWYgKGVudHJ5LnBvc3RlckZpbGUpIHtcbiAgICAgIGNvdmVyLmNyZWF0ZUVsKFwiaW1nXCIsIHtcbiAgICAgICAgYXR0cjoge1xuICAgICAgICAgIHNyYzogdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGVudHJ5LnBvc3RlckZpbGUpLFxuICAgICAgICAgIGFsdDogYCR7ZW50cnkudGl0bGV9IHBvc3RlcmBcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvdmVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1jYXJkLWZhbGxiYWNrXCIsIHRleHQ6IFwiXHVEODNDXHVERkFFXCIgfSk7XG4gICAgfVxuICAgIGNvdmVyLmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1jYXJkLWdsb3NzXCIgfSk7XG5cbiAgICByZXR1cm4gY2FyZDtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUG9zdGVyT3ZlcmxheShlbnRyeTogR2FtZUVudHJ5LCBjb21wYWN0OiBib29sZWFuKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IG92ZXJsYXkgPSBjcmVhdGVOb2RlKFwiZGl2XCIsIHtcbiAgICAgIGNsczogY29tcGFjdCA/IFwiZ2FtZS1kYXNoYm9hcmQtcG9zdGVyLW92ZXJsYXkgY29tcGFjdFwiIDogXCJnYW1lLWRhc2hib2FyZC1wb3N0ZXItb3ZlcmxheVwiXG4gICAgfSk7XG4gICAgY29uc3QgbWV0YSA9IG92ZXJsYXkuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXBvc3Rlci1tZXRhXCIgfSk7XG4gICAgbWV0YS5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtcG9zdGVyLWtpbmRcIiwgdGV4dDogXCJcdTZFMzhcdTYyMEZcIiB9KTtcbiAgICBtZXRhLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlU3RhdHVzUGlsbChlbnRyeS5zdGF0dXMpKTtcbiAgICBvdmVybGF5LmNyZWF0ZURpdih7IGNsczogXCJnYW1lLWRhc2hib2FyZC1wb3N0ZXItdGl0bGVcIiwgdGV4dDogZW50cnkudGl0bGUgfSk7XG5cbiAgICBjb25zdCBzdWIgPSBbZW50cnkuZGV2ZWxvcGVyLCBlbnRyeS5wbGF0Zm9ybSwgZW50cnkucHJvZ3Jlc3NdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiIFx1MDBCNyBcIik7XG4gICAgaWYgKHN1Yikgb3ZlcmxheS5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtcG9zdGVyLXN1YlwiLCB0ZXh0OiBzdWIgfSk7XG5cbiAgICByZXR1cm4gb3ZlcmxheTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU3RhdHVzUGlsbChzdGF0dXM6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gY3JlYXRlTm9kZShcInNwYW5cIiwge1xuICAgICAgY2xzOiBgZ2FtZS1kYXNoYm9hcmQtcGlsbCBnYW1lLWRhc2hib2FyZC1waWxsLSR7c3RhdHVzIHx8IFwidW5zb3J0ZWRcIn1gLFxuICAgICAgdGV4dDogU1RBVFVTX0xBQkVMU1tzdGF0dXNdID8/IFNUQVRVU19MQUJFTFMudW5zb3J0ZWRcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRmlsZUxpbmsobGFiZWw6IHN0cmluZywgZmlsZTogVEZpbGUgfCBudWxsLCBjbGFzc05hbWUgPSBcIlwiKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGxpbmsgPSBjcmVhdGVOb2RlKGZpbGUgPyBcImFcIiA6IFwic3BhblwiLCB7IHRleHQ6IGxhYmVsLCBjbHM6IGNsYXNzTmFtZSB9KTtcbiAgICBpZiAoIWZpbGUpIHJldHVybiBsaW5rO1xuICAgIGxpbmsuaHJlZiA9IGZpbGUucGF0aDtcbiAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKS5vcGVuRmlsZShmaWxlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbGluaztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlRXh0ZXJuYWxMaW5rKGxhYmVsOiBzdHJpbmcsIHVybDogc3RyaW5nLCBjbGFzc05hbWUgPSBcIlwiKTogSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0IGxpbmsgPSBjcmVhdGVOb2RlKFwiYVwiLCB7IHRleHQ6IGxhYmVsLCBjbHM6IGNsYXNzTmFtZSB9KTtcbiAgICBsaW5rLmhyZWYgPSB1cmw7XG4gICAgbGluay50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgIGxpbmsucmVsID0gXCJub29wZW5lciBub3JlZmVycmVyXCI7XG4gICAgcmV0dXJuIGxpbms7XG4gIH1cblxuICBwcml2YXRlIHNob3dUb29sdGlwKGFuY2hvcjogSFRNTEVsZW1lbnQsIGVudHJ5OiBHYW1lRW50cnkpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZmxvYXRpbmdUb29sdGlwRWwpIHJldHVybjtcbiAgICB0aGlzLmZsb2F0aW5nVG9vbHRpcEVsLmVtcHR5KCk7XG4gICAgY29uc3QgY2FyZCA9IHRoaXMuZmxvYXRpbmdUb29sdGlwRWwuY3JlYXRlRGl2KHsgY2xzOiBcImdhbWUtZGFzaGJvYXJkLXRvb2x0aXAtY2FyZFwiIH0pO1xuICAgIGNvbnN0IHRpdGxlID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtdG9vbHRpcC10aXRsZVwiLCB0ZXh0OiBlbnRyeS50aXRsZSB9KTtcbiAgICBjb25zdCBwcmV2aWV3ID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtdG9vbHRpcC1wcmV2aWV3XCIgfSk7XG4gICAgaWYgKGVudHJ5LnBvc3RlckZpbGUpIHtcbiAgICAgIHByZXZpZXcuY3JlYXRlRWwoXCJpbWdcIiwge1xuICAgICAgICBhdHRyOiB7XG4gICAgICAgICAgc3JjOiB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZW50cnkucG9zdGVyRmlsZSksXG4gICAgICAgICAgYWx0OiBgJHtlbnRyeS50aXRsZX0gcG9zdGVyYFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlldy5jcmVhdGVEaXYoeyBjbHM6IFwiZ2FtZS1kYXNoYm9hcmQtY2FyZC1mYWxsYmFja1wiLCB0ZXh0OiBcIlx1RDgzQ1x1REZBRVwiIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHRvb2x0aXBXaWR0aCA9IDI4MDtcbiAgICBjb25zdCB0b29sdGlwSGVpZ2h0ID0gMzIwO1xuICAgIGNvbnN0IGdhcCA9IDE2O1xuICAgIGNvbnN0IHJlY3QgPSBhbmNob3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgcGxhY2VSaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gcmVjdC5yaWdodCA+PSB0b29sdGlwV2lkdGggKyBnYXAgfHwgcmVjdC5sZWZ0IDwgdG9vbHRpcFdpZHRoO1xuICAgIGNvbnN0IGxlZnQgPSBwbGFjZVJpZ2h0XG4gICAgICA/IE1hdGgubWluKHJlY3QucmlnaHQgKyBnYXAsIHdpbmRvdy5pbm5lcldpZHRoIC0gdG9vbHRpcFdpZHRoIC0gMTIpXG4gICAgICA6IE1hdGgubWF4KDEyLCByZWN0LmxlZnQgLSB0b29sdGlwV2lkdGggLSBnYXApO1xuICAgIGNvbnN0IHRvcCA9IE1hdGgubWF4KDEyLCBNYXRoLm1pbihyZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMiAtIHRvb2x0aXBIZWlnaHQgLyAyLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b29sdGlwSGVpZ2h0IC0gMTIpKTtcblxuICAgIHRoaXMuZmxvYXRpbmdUb29sdGlwRWwuc3R5bGUubGVmdCA9IGAke2xlZnR9cHhgO1xuICAgIHRoaXMuZmxvYXRpbmdUb29sdGlwRWwuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbiAgICB0aGlzLmZsb2F0aW5nVG9vbHRpcEVsLmNsYXNzTGlzdC5hZGQoXCJpcy12aXNpYmxlXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBoaWRlVG9vbHRpcCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZmxvYXRpbmdUb29sdGlwRWwpIHJldHVybjtcbiAgICB0aGlzLmZsb2F0aW5nVG9vbHRpcEVsLmNsYXNzTGlzdC5yZW1vdmUoXCJpcy12aXNpYmxlXCIpO1xuICAgIHRoaXMuZmxvYXRpbmdUb29sdGlwRWwuc3R5bGUubGVmdCA9IFwiLTk5OTlweFwiO1xuICAgIHRoaXMuZmxvYXRpbmdUb29sdGlwRWwuc3R5bGUudG9wID0gXCItOTk5OXB4XCI7XG4gIH1cblxuICBwcml2YXRlIGZpbHRlckVudHJpZXMoZW50cmllczogR2FtZUVudHJ5W10pOiBHYW1lRW50cnlbXSB7XG4gICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+IHtcbiAgICAgIGlmICh0aGlzLnN0YXR1c0ZpbHRlciAhPT0gXCJhbGxcIiAmJiBlbnRyeS5zdGF0dXMgIT09IHRoaXMuc3RhdHVzRmlsdGVyKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIXF1ZXJ5KSByZXR1cm4gdHJ1ZTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIGVudHJ5LnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpIHx8XG4gICAgICAgIGVudHJ5LmRldmVsb3Blci50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuICAgICAgICBlbnRyeS5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuICAgICAgICBlbnRyeS5yZWxhdGl2ZVBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5zb3J0TW9kZSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJlZC5zb3J0KChsZWZ0LCByaWdodCkgPT4gbGVmdC50aXRsZS5sb2NhbGVDb21wYXJlKHJpZ2h0LnRpdGxlLCBcInpoLUhhbnMtQ05cIikpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWx0ZXJlZC5zb3J0KChsZWZ0LCByaWdodCkgPT4gcmlnaHQudXBkYXRlZEF0IC0gbGVmdC51cGRhdGVkQXQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUE4RDs7O0FDQTlELHNCQUE0QztBQUk1QyxJQUFNLFdBQVc7QUFBQSxFQUNmLEVBQUUsT0FBTyxVQUFVLE9BQU8scUJBQU07QUFBQSxFQUNoQyxFQUFFLE9BQU8sV0FBVyxPQUFPLHFCQUFNO0FBQUEsRUFDakMsRUFBRSxPQUFPLFVBQVUsT0FBTyxlQUFLO0FBQUEsRUFDL0IsRUFBRSxPQUFPLGFBQWEsT0FBTyxxQkFBTTtBQUFBLEVBQ25DLEVBQUUsT0FBTyxZQUFZLE9BQU8scUJBQU07QUFDcEM7QUFFQSxTQUFTLGFBQThCO0FBQ3JDLFNBQU87QUFBQSxJQUNMLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxJQUNYLFVBQVU7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxJQUNULFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxJQUNYLFVBQVU7QUFBQSxJQUNWLFNBQVM7QUFBQSxJQUNULFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxJQUNYLFFBQVEsQ0FBQztBQUFBLElBQ1QsUUFBUSxDQUFDO0FBQUEsSUFDVCxPQUFPLENBQUM7QUFBQSxJQUNSLGFBQWEsQ0FBQztBQUFBLEVBQ2hCO0FBQ0Y7QUFFTyxJQUFN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UyxDQUFDO0FBQUEsWUFDNUIsV0FBVyxNQUFNLFFBQVEsQ0FBQztBQUFBLFFBQzlCLFdBQVcsTUFBTSxJQUFJLENBQUM7QUFBQSxnQkFDZCxXQUFXLE1BQU0sV0FBVyxDQUFDO0FBQUEsWUFDakMsV0FBVyxNQUFNLFFBQVEsQ0FBQztBQUFBLFVBQzVCLFdBQVcsTUFBTSxNQUFNLENBQUM7QUFBQSxXQUN2QixXQUFXLE1BQU0sT0FBTyxDQUFDO0FBQUEsZ0JBQ3BCLFdBQVcsTUFBTSxXQUFXLENBQUM7QUFBQSxjQUMvQixXQUFXLE1BQU0sU0FBUyxDQUFDO0FBQUEsYUFDNUIsV0FBVyxNQUFNLFFBQVEsQ0FBQztBQUFBLFlBQzNCLFdBQVcsTUFBTSxPQUFPLENBQUM7QUFBQSxTQUM1QixXQUFXLGlCQUFpQixjQUFjLGNBQWMsS0FBSyxFQUFFLENBQUM7QUFBQSxVQUMvRCxXQUFXLGlCQUFpQixjQUFjLGNBQWMsS0FBSyxFQUFFLENBQUM7QUFBQSxVQUNoRSxXQUFXLGlCQUFpQixjQUFjLGNBQWMsS0FBSyxFQUFFLENBQUM7QUFBQSxVQUNoRSxTQUFTLE1BQU0sTUFBTSxDQUFDO0FBQUEsVUFDdEIsU0FBUyxNQUFNLE1BQU0sQ0FBQztBQUFBLFNBQ3ZCLFNBQVMsTUFBTSxLQUFLLENBQUM7QUFBQSxlQUNmLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUl0QyxNQUFNLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUliLE1BQU0sV0FBVyxFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJbkIsTUFBTSxhQUFhLEVBQUU7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlyQixpQkFBaUIsR0FBRztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSXBCLGNBQWMsR0FBRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1qQjtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgIm5hbWVzIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIl9hIiwgImltcG9ydF9vYnNpZGlhbiIsICJfYSJdCn0K
