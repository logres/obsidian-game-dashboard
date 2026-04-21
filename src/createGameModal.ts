import { App, Modal, Notice, Setting } from "obsidian";
import type GameDashboardPlugin from "./main";
import { CreateGameInput, GameSearchCandidate } from "./types";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "backlog", label: "Backlog" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" }
];

function emptyInput(): CreateGameInput {
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

export class CreateGameModal extends Modal {
  plugin: GameDashboardPlugin;
  values: CreateGameInput = emptyInput();
  searchQuery = "";
  searchResults: GameSearchCandidate[] = [];
  selectedCandidateId: number | null = null;
  isApplying = false;
  isSearching = false;
  formEl: HTMLDivElement | null = null;
  resultsEl: HTMLDivElement | null = null;
  searchInputEl: HTMLInputElement | null = null;
  titleInputEl: HTMLInputElement | null = null;
  progressInputEl: HTMLInputElement | null = null;
  statusSelectEl: HTMLSelectElement | null = null;
  summaryInputEl: HTMLTextAreaElement | null = null;
  storylineInputEl: HTMLTextAreaElement | null = null;
  importedEl: HTMLDivElement | null = null;
  readOnlyGridEl: HTMLDivElement | null = null;

  constructor(app: App, plugin: GameDashboardPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
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

  onClose(): void {
    this.plugin.endModalSession();
  }

  private async runSearch(): Promise<void> {
    if (!this.searchQuery) {
      new Notice("Search query is required.");
      return;
    }

    this.isSearching = true;
    this.renderResults();

    try {
      this.searchResults = await this.plugin.searchExternalGames(this.searchQuery);
      if (this.searchResults.length === 0) {
        new Notice("No results found.");
      }
    } catch (error) {
      console.error(error);
      new Notice(error instanceof Error ? error.message : "Metadata search failed.");
      this.searchResults = [];
    } finally {
      this.isSearching = false;
      this.renderResults();
    }
  }

  private renderResults(): void {
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
      const item = this.resultsEl!.createDiv({
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
        cover.createDiv({ cls: "game-dashboard-card-fallback", text: "🎮" });
      }

      const content = item.createDiv({ cls: "game-dashboard-import-result-content" });
      content.createDiv({
        cls: "game-dashboard-import-result-source",
        text: candidate.source === "steam" ? "Steam" : "IGDB"
      });
      content.createDiv({ cls: "game-dashboard-import-result-title", text: candidate.title });
      content.createDiv({
        cls: "game-dashboard-import-result-meta",
        text: [candidate.developer, candidate.platform, candidate.year].filter(Boolean).join(" · ") || "No metadata"
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

  private async applySearchResult(candidate: GameSearchCandidate): Promise<void> {
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

  private renderForm(): void {
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
    new Setting(actions)
      .addButton((button) =>
        button.setButtonText("Cancel").onClick(() => {
          this.close();
        })
      )
      .addButton((button) =>
        button
          .setButtonText("Create")
          .setCta()
          .onClick(() => {
            void this.submit();
          })
      );
  }

  private async submit(): Promise<void> {
    if (!this.values.title) {
      new Notice("Game title is required.");
      return;
    }

    try {
      await this.plugin.createGame(this.values);
      this.close();
    } catch (error) {
      console.error(error);
      new Notice(error instanceof Error ? error.message : "Failed to create game entry.");
    }
  }

  private applyCandidate(candidate: GameSearchCandidate): void {
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

  private renderReadOnlyGrid(): void {
    if (!this.readOnlyGridEl) return;
    const progressValue = this.values.progress;
    const statusValue = this.values.status;
    this.readOnlyGridEl.empty();
    this.addReadOnly(this.readOnlyGridEl, "Developer", this.values.developer || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Publisher", this.values.publisher || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Platform", this.values.platform || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Release date", this.values.releaseDate || "Auto");
    this.addReadOnly(this.readOnlyGridEl, "Year", this.values.year || "Auto");
    this.progressInputEl = this.addInput(this.readOnlyGridEl, "Progress", progressValue, (value) => (this.values.progress = value));
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

  private renderImportedMetadata(): void {
    if (!this.importedEl) return;
    this.importedEl.empty();
    this.importedEl.createDiv({
      cls: "game-dashboard-imported-meta-title",
      text: "Imported metadata"
    });
    if (this.selectedCandidateId !== null) {
      this.importedEl.createDiv({
        cls: "game-dashboard-imported-meta-source",
        text: `Primary source: ${this.searchResults.find((item) => item.id === this.selectedCandidateId)?.source === "steam" ? "Steam" : "IGDB"}`
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
    ]
      .filter(([, value]) => Boolean(value))
      .forEach(([label, value]) => {
        const row = this.importedEl!.createDiv({ cls: "game-dashboard-imported-meta-row" });
        row.createDiv({ cls: "game-dashboard-imported-meta-label", text: `${label}` });
        row.createDiv({ cls: "game-dashboard-imported-meta-value", text: value });
      });
  }

  private syncFormValues(): void {
    if (this.titleInputEl) this.titleInputEl.value = this.values.title;
    if (this.progressInputEl) this.progressInputEl.value = this.values.progress;
    if (this.statusSelectEl) this.statusSelectEl.value = this.values.status;
    if (this.summaryInputEl) this.summaryInputEl.value = this.values.summary;
    if (this.storylineInputEl) this.storylineInputEl.value = this.values.storyline;
    this.renderReadOnlyGrid();
    this.renderImportedMetadata();
  }

  private focusPrimaryInput(): void {
    const applyFocus = () => {
      const target = this.searchInputEl ?? this.titleInputEl;
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

  private addReadOnly(container: HTMLElement, label: string, value: string): void {
    const wrapper = container.createDiv({ cls: "game-dashboard-readonly-field" });
    wrapper.createDiv({ cls: "game-dashboard-readonly-label", text: label });
    wrapper.createDiv({ cls: "game-dashboard-readonly-value", text: value });
  }

  private addInput(
    container: HTMLElement,
    label: string,
    initialValue: string,
    onChange: (value: string) => void
  ): HTMLInputElement {
    const wrapper = container.createEl("label", { text: label });
    const input = wrapper.createEl("input", { type: "text" });
    input.value = initialValue;
    input.addEventListener("input", () => onChange(input.value.trim()));
    return input;
  }
}
