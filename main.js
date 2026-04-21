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
  { value: "active", label: "Active" },
  { value: "backlog", label: "Backlog" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" }
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
    contentEl.createEl("h2", { text: "Create game entry" });
    const searchSection = contentEl.createDiv({ cls: "game-dashboard-import-search" });
    const searchHeader = searchSection.createDiv({ cls: "game-dashboard-import-search-row" });
    this.searchInputEl = searchHeader.createEl("input", {
      type: "text",
      placeholder: "Search metadata, e.g. Disco Elysium"
    });
    this.focusPrimaryInput();
    this.searchInputEl.addEventListener("input", () => {
      if (!this.searchInputEl) return;
      this.searchQuery = this.searchInputEl.value.trim();
    });
    const searchButton = searchHeader.createEl("button", { text: "Search metadata" });
    searchButton.addEventListener("click", () => {
      void this.runSearch();
    });
    this.searchInputEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void this.runSearch();
    });
    searchSection.createDiv({
      cls: "setting-item-description",
      text: "Configure an IGDB client ID and client secret to search and import detailed metadata."
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
        new import_obsidian.Notice("No results found.");
      }
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "Metadata search failed.");
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
      this.resultsEl.createDiv({ cls: "game-dashboard-import-empty", text: "No result yet. Search metadata above." });
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
      action.addEventListener("click", () => {
        void this.applySearchResult(candidate);
      });
    });
  }
  async applySearchResult(candidate) {
    if (this.isApplying) return;
    this.isApplying = true;
    this.selectedCandidateId = candidate.id;
    this.renderResults();
    try {
      const enriched = await this.plugin.enrichImportedCandidate(candidate);
      this.applyCandidate(enriched);
    } finally {
      this.isApplying = false;
      this.renderResults();
    }
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
      (button) => button.setButtonText("Create").setCta().onClick(() => {
        void this.submit();
      })
    );
  }
  async submit() {
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
    this.addReadOnly(this.readOnlyGridEl, "Release date", this.values.releaseDate || "Auto");
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
      text: "Imported metadata"
    });
    if (this.selectedCandidateId !== null) {
      this.importedEl.createDiv({
        cls: "game-dashboard-imported-meta-source",
        text: `Primary source: ${((_a = this.searchResults.find((item) => item.id === this.selectedCandidateId)) == null ? void 0 : _a.source) === "steam" ? "Steam" : "IGDB"}`
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
    const clientSecret = this.plugin.getIgdbClientSecret();
    if (!this.plugin.settings.igdbClientId || !clientSecret) {
      throw new Error("IGDB client ID / client secret is not configured.");
    }
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 6e4) {
      return this.tokenCache.accessToken;
    }
    const response = await (0, import_obsidian2.requestUrl)({
      url: `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(this.plugin.settings.igdbClientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
      method: "POST"
    });
    const json = response.json;
    if (!(json == null ? void 0 : json.access_token)) {
      new import_obsidian2.Notice("Metadata token request failed.");
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
function indexGames(app, settings) {
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
  igdbClientId: ""
};
var GameDashboardSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian4.Setting(containerEl).setName("Games root").setDesc("Each direct subfolder under this path is treated as one game entry. Each game folder should contain Game.md and an optional GameAssets folder.").addText(
      (text) => text.setPlaceholder("2-Knowledge/Media Library/Games").setValue(this.plugin.settings.gamesRoot).onChange((value) => {
        void this.updateGamesRoot(value);
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Main note name").setDesc("The main details note created inside each game folder.").addText(
      (text) => text.setPlaceholder("Game.md").setValue(this.plugin.settings.mainNoteName).onChange((value) => {
        void this.updateMainNoteName(value);
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Open note after create").setDesc("Open the newly created main note after the creation modal completes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openNoteAfterCreate).onChange((value) => {
        this.plugin.settings.openNoteAfterCreate = value;
        void this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Metadata import").setHeading();
    new import_obsidian4.Setting(containerEl).setName("Client id").setDesc("Twitch application client ID used for metadata search and import.").addText(
      (text) => text.setPlaceholder("Your Twitch client id").setValue(this.plugin.settings.igdbClientId).onChange((value) => {
        this.plugin.settings.igdbClientId = value.trim();
        void this.plugin.saveSettings();
      })
    );
    const secretSetting = new import_obsidian4.Setting(containerEl).setName("Client secret").setDesc("Stored with Obsidian SecretStorage and used only to request metadata access tokens.");
    secretSetting.controlEl.empty();
    new import_obsidian4.SecretComponent(this.app, secretSetting.controlEl).setValue(this.plugin.getIgdbClientSecret()).onChange((value) => {
      this.plugin.setIgdbClientSecret(value.trim());
    });
    new import_obsidian4.Setting(containerEl).setName("Open dashboard").setDesc("Open or reveal the game dashboard view.").addButton(
      (button) => button.setButtonText("Open").onClick(() => {
        void this.plugin.activateView();
      })
    );
  }
  async updateGamesRoot(value) {
    this.plugin.settings.gamesRoot = value.trim();
    await this.plugin.saveSettings();
    await this.plugin.refreshAllViews();
  }
  async updateMainNoteName(value) {
    const nextValue = value.trim() || DEFAULT_SETTINGS.mainNoteName;
    this.plugin.settings.mainNoteName = nextValue.endsWith(".md") ? nextValue : `${nextValue}.md`;
    await this.plugin.saveSettings();
    await this.plugin.refreshAllViews();
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
  active: "Active",
  backlog: "Backlog",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
  unsorted: "Unsorted"
};
var SECTIONS = [
  {
    key: "playing",
    title: "Playing",
    subtitle: "Active or paused games",
    collapsedByDefault: false,
    match: (entry) => entry.status === "active" || entry.status === "paused"
  },
  {
    key: "all",
    title: "All games",
    subtitle: "Full game library",
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
    contentEl.createEl("h3", { text: "Delete game" });
    contentEl.createEl("p", {
      text: `This will delete the entire game folder for "${this.entry.title}", including Game.md, related notes, and GameAssets.`
    });
    new import_obsidian6.Setting(contentEl).addButton(
      (button) => button.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    ).addButton(
      (button) => button.setButtonText("Delete").setWarning().onClick(() => {
        this.close();
        window.setTimeout(() => {
          this.onConfirm();
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
    return "Game dashboard";
  }
  getIcon() {
    return "gamepad-2";
  }
  async onOpen() {
    this.contentEl.addClass("game-dashboard-view");
    this.ensureFloatingTooltip();
    await this.refresh();
  }
  onClose() {
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
    heading.createDiv({ cls: "game-dashboard-kicker", text: "Game library" });
    heading.createEl("h2", { cls: "game-dashboard-hero-title", text: "Browse your game library" });
    heading.createDiv({
      cls: "game-dashboard-hero-text",
      text: "Select a cover to view details. Double-click a cover to open the main note. Each game folder contains one main note and related notes."
    });
    const stats = hero.createDiv({ cls: "game-dashboard-stats" });
    const playingCount = entries.filter((entry) => entry.status === "active" || entry.status === "paused").length;
    const completedCount = entries.filter((entry) => entry.status === "completed").length;
    [
      ["\u{1F3AE} All games", String(entries.length)],
      ["\u{1F579} Playing", String(playingCount)],
      ["\u{1F3C1} Completed", String(completedCount)]
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
      placeholder: "Search games, platforms, or developers"
    });
    search.value = this.query;
    search.addEventListener("input", () => {
      this.query = search.value.trim();
      this.renderContent();
    });
    const sort = left.createEl("select", { cls: "game-dashboard-select" });
    [
      ["updated", "Recently updated"],
      ["name", "Title"]
    ].forEach(([value, label]) => sort.createEl("option", { value, text: label }));
    sort.value = this.sortMode;
    sort.addEventListener("change", () => {
      this.sortMode = sort.value;
      this.renderContent();
    });
    const right = toolbar.createDiv({ cls: "game-dashboard-toolbar-group" });
    const refreshButton = right.createEl("button", { cls: "game-dashboard-button subtle", text: "Reload" });
    refreshButton.addEventListener("click", () => {
      void this.refresh();
    });
    const createButton = right.createEl("button", { cls: "game-dashboard-button", text: "+ New game" });
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
      ["all", "All"],
      ["active", "Active"],
      ["backlog", "Backlog"],
      ["paused", "Paused"],
      ["completed", "Completed"],
      ["archived", "Archived"],
      ["unsorted", "Unsorted"]
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
      panel.createDiv({ cls: "game-dashboard-empty game-dashboard-detail-empty", text: "No game entries to show." });
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
      entry.rating && `Rating ${entry.rating}`
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
      text: entry.summary || "No summary yet. Add one in the main note frontmatter or body."
    });
    summary.setAttribute("dir", "auto");
    const actions = body.createDiv({ cls: "game-dashboard-action-row" });
    actions.appendChild(this.createFileLink("Open main note", entry.mainFile, "game-dashboard-button primary"));
    if (entry.officialUrl) actions.appendChild(this.createExternalLink("Official link", entry.officialUrl, "game-dashboard-button"));
    if (entry.detailUrl) actions.appendChild(this.createExternalLink("Details page", entry.detailUrl, "game-dashboard-button"));
    const deleteButton = actions.createEl("button", { cls: "game-dashboard-button danger", text: "Delete game" });
    deleteButton.addEventListener("click", () => {
      new DeleteGameConfirmModal(this.app, entry, () => {
        this.hideTooltip();
        if (this.selectedPath === entry.folder.path) this.selectedPath = null;
        void this.plugin.deleteGame(entry);
      }).open();
    });
    const side = content.createDiv({ cls: "game-dashboard-detail-side" });
    const related = side.createDiv({ cls: "game-dashboard-related" });
    related.createEl("h4", { cls: "game-dashboard-side-title", text: "Related notes" });
    const notes = related.createDiv({ cls: "game-dashboard-note-list" });
    if (entry.notes.length === 0) {
      notes.createDiv({ cls: "game-dashboard-empty-inline", text: "No related notes yet." });
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
        text: collapsed ? "Expand" : "Collapse"
      });
      toggle.addEventListener("click", () => {
        this.collapsedSections[section.key] = !this.collapsedSections[section.key];
        wrapper.toggleClass("is-collapsed", this.collapsedSections[section.key]);
        wrapper.toggleClass("is-expanded", !this.collapsedSections[section.key]);
        toggle.setText(this.collapsedSections[section.key] ? "Expand" : "Collapse");
      });
      const body = wrapper.createDiv({ cls: "game-dashboard-section-body" });
      const grid = body.createDiv({ cls: "game-dashboard-grid" });
      if (items.length === 0) {
        grid.createDiv({ cls: "game-dashboard-empty", text: "No matching entries in this section." });
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
      text: count > 0 ? `End of library \xB7 ${count} visible` : "End of library"
    });
  }
  buildCard(entry) {
    const card = createNode("button", { cls: "game-dashboard-card" });
    if (entry.folder.path === this.selectedPath) card.addClass("is-selected");
    card.addEventListener("click", () => {
      this.selectedPath = entry.folder.path;
      this.hideTooltip();
      this.preserveScroll(() => this.renderContent());
    });
    card.addEventListener("dblclick", () => {
      this.hideTooltip();
      if (entry.mainFile) void this.app.workspace.getLeaf("tab").openFile(entry.mainFile);
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
    meta.createDiv({ cls: "game-dashboard-poster-kind", text: "Game" });
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
    link.addEventListener("click", (event) => {
      event.preventDefault();
      void this.app.workspace.getLeaf("tab").openFile(file);
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
    card.createDiv({ cls: "game-dashboard-tooltip-title", text: entry.title });
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
    this.floatingTooltipEl.setCssProps({
      "--game-dashboard-tooltip-left": `${left}px`,
      "--game-dashboard-tooltip-top": `${top}px`
    });
    this.floatingTooltipEl.classList.add("is-visible");
  }
  hideTooltip() {
    if (!this.floatingTooltipEl) return;
    this.floatingTooltipEl.classList.remove("is-visible");
    this.floatingTooltipEl.setCssProps({
      "--game-dashboard-tooltip-left": "-9999px",
      "--game-dashboard-tooltip-top": "-9999px"
    });
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
var _GameDashboardPlugin = class _GameDashboardPlugin extends import_obsidian7.Plugin {
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
  async loadSettings() {
    var _a;
    const loaded = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const legacySecret = (_a = loaded.igdbClientSecret) == null ? void 0 : _a.trim();
    if (legacySecret && !this.getIgdbClientSecret()) {
      this.app.secretStorage.setSecret(_GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY, legacySecret);
    }
    delete loaded.igdbClientSecret;
    this.settings = loaded;
    await this.saveData(this.settings);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  getIgdbClientSecret() {
    var _a;
    return (_a = this.app.secretStorage.getSecret(_GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY)) != null ? _a : "";
  }
  setIgdbClientSecret(value) {
    this.app.secretStorage.setSecret(_GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY, value);
  }
  beginModalSession() {
    this.refreshSuppressedCount += 1;
  }
  endModalSession() {
    this.refreshSuppressedCount = Math.max(0, this.refreshSuppressedCount - 1);
    if (this.refreshSuppressedCount === 0 && this.pendingRefreshWhileSuppressed) {
      this.pendingRefreshWhileSuppressed = false;
      this.requestRefreshAllViews();
    }
  }
  getGames() {
    return Promise.resolve(indexGames(this.app, this.settings));
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
  requestRefreshAllViews() {
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
    void workspace.revealLeaf(leaf);
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
    this.requestRefreshAllViews();
    new import_obsidian7.Notice(`Created ${title}`);
  }
  async deleteGame(entry) {
    await this.app.fileManager.trashFile(entry.folder);
    this.requestRefreshAllViews();
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
_GameDashboardPlugin.IGDB_CLIENT_SECRET_KEY = "igdb-client-secret";
var GameDashboardPlugin = _GameDashboardPlugin;
