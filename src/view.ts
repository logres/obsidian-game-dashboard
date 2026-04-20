import { App, ItemView, Modal, Setting, TFile, WorkspaceLeaf } from "obsidian";
import type GameDashboardPlugin from "./main";
import { GameEntry } from "./types";

export const GAME_DASHBOARD_VIEW_TYPE = "game-dashboard-view";

type SortMode = "updated" | "name";
type StatusFilter = "all" | "active" | "backlog" | "paused" | "completed" | "archived" | "unsorted";

const STATUS_LABELS: Record<string, string> = {
  active: "进行中",
  backlog: "待开始",
  paused: "暂停",
  completed: "已完成",
  archived: "已归档",
  unsorted: "未整理"
};

const SECTIONS = [
  {
    key: "playing",
    title: "正在游玩",
    subtitle: "进行中 / 暂停中的游戏",
    collapsedByDefault: false,
    match: (entry: GameEntry) => entry.status === "active" || entry.status === "paused"
  },
  {
    key: "all",
    title: "所有游戏",
    subtitle: "完整游戏库",
    collapsedByDefault: false,
    match: (_entry: GameEntry) => true
  }
] as const;

function createNode<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { cls?: string; text?: string } = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.cls) el.className = options.cls;
  if (options.text != null) el.textContent = options.text;
  return el;
}

class DeleteGameConfirmModal extends Modal {
  private readonly entry: GameEntry;
  private readonly onConfirm: () => Promise<void>;

  constructor(app: App, entry: GameEntry, onConfirm: () => Promise<void>) {
    super(app);
    this.entry = entry;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const plugin = (this.app as App & { plugins?: { plugins?: Record<string, unknown> } }).plugins?.plugins?.["game-dashboard"];
    if (plugin && typeof (plugin as GameDashboardPlugin).beginModalSession === "function") {
      (plugin as GameDashboardPlugin).beginModalSession();
    }
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "删除游戏" });
    contentEl.createEl("p", {
      text: `将删除“${this.entry.title}”对应的整个游戏文件夹。这个操作会删除 Game.md、关联笔记和 GameAssets。`
    });

    new Setting(contentEl)
      .addButton((button) =>
        button.setButtonText("取消").onClick(() => {
          this.close();
        })
      )
      .addButton((button) =>
        button
          .setButtonText("删除")
          .setWarning()
          .onClick(async () => {
            this.close();
            window.setTimeout(() => {
              void this.onConfirm();
              window.setTimeout(() => window.focus(), 0);
            }, 0);
          })
      );
  }

  onClose(): void {
    const plugin = (this.app as App & { plugins?: { plugins?: Record<string, unknown> } }).plugins?.plugins?.["game-dashboard"];
    if (plugin && typeof (plugin as GameDashboardPlugin).endModalSession === "function") {
      (plugin as GameDashboardPlugin).endModalSession();
    }
  }
}

export class GameDashboardView extends ItemView {
  plugin: GameDashboardPlugin;
  entries: GameEntry[] = [];
  query = "";
  sortMode: SortMode = "updated";
  statusFilter: StatusFilter = "all";
  selectedPath: string | null = null;
  collapsedSections: Record<string, boolean> = Object.fromEntries(
    SECTIONS.map((section) => [section.key, section.collapsedByDefault])
  );

  private floatingTooltipEl: HTMLDivElement | null = null;
  private shellEl: HTMLDivElement | null = null;
  private detailHostEl: HTMLDivElement | null = null;
  private sectionsHostEl: HTMLDivElement | null = null;
  private endcapHostEl: HTMLDivElement | null = null;
  private filterBarEl: HTMLDivElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: GameDashboardPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return GAME_DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Game Dashboard";
  }

  getIcon(): string {
    return "gamepad-2";
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("game-dashboard-view");
    this.ensureFloatingTooltip();
    await this.refresh();
  }

  async onClose(): Promise<void> {
    this.floatingTooltipEl?.remove();
    this.floatingTooltipEl = null;
  }

  async refresh(): Promise<void> {
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

  private ensureFloatingTooltip(): void {
    this.floatingTooltipEl?.remove();
    const el = document.createElement("div");
    el.className = "game-dashboard-floating-tooltip";
    document.body.appendChild(el);
    this.floatingTooltipEl = el;
  }

  private render(entries: GameEntry[]): void {
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

  private renderContent(): void {
    const filteredEntries = this.filterEntries(this.entries);
    if (!this.selectedPath && filteredEntries.length > 0) {
      this.selectedPath = filteredEntries[0].folder.path;
    }
    if (filteredEntries.length > 0 && !filteredEntries.some((entry) => entry.folder.path === this.selectedPath)) {
      this.selectedPath = filteredEntries[0].folder.path;
    }

    const selected = filteredEntries.find((entry) => entry.folder.path === this.selectedPath) ?? null;

    this.detailHostEl?.empty();
    this.sectionsHostEl?.empty();
    this.endcapHostEl?.empty();

    if (this.detailHostEl) this.renderDetail(this.detailHostEl, selected);
    if (this.sectionsHostEl) this.renderSections(this.sectionsHostEl, filteredEntries);
    if (this.endcapHostEl) this.renderEndcap(this.endcapHostEl, filteredEntries.length);
  }

  private getScrollContainer(): HTMLElement {
    return (this.contentEl.closest(".view-content") as HTMLElement | null) ?? this.contentEl;
  }

  private preserveScroll(callback: () => void): void {
    const container = this.getScrollContainer();
    const top = container.scrollTop;
    callback();
    window.requestAnimationFrame(() => {
      container.scrollTop = top;
    });
  }

  private renderHero(container: HTMLElement, entries: GameEntry[]): void {
    const hero = container.createDiv({ cls: "game-dashboard-hero" });
    const heading = hero.createDiv({ cls: "game-dashboard-hero-copy" });
    heading.createDiv({ cls: "game-dashboard-kicker", text: "Game Library" });
    heading.createEl("h2", { cls: "game-dashboard-hero-title", text: "Steam 风格浏览你的游戏库" });
    heading.createDiv({
      cls: "game-dashboard-hero-text",
      text: "点击封面切换详情，双击封面打开主笔记。每个游戏文件夹包含一个主文档和若干关联笔记。"
    });

    const stats = hero.createDiv({ cls: "game-dashboard-stats" });
    const playingCount = entries.filter((entry) => entry.status === "active" || entry.status === "paused").length;
    const completedCount = entries.filter((entry) => entry.status === "completed").length;

    [
      ["🎮 所有游戏", String(entries.length)],
      ["🕹 正在游玩", String(playingCount)],
      ["🏁 已完成", String(completedCount)]
    ].forEach(([label, value]) => {
      const stat = stats.createDiv({ cls: "game-dashboard-stat" });
      stat.createDiv({ cls: "game-dashboard-stat-label", text: label });
      stat.createDiv({ cls: "game-dashboard-stat-value", text: value });
    });
  }

  private formatUpdatedAt(timestamp: number): string {
    if (!timestamp) return "Unknown";
    const value = new Date(timestamp);
    return Number.isNaN(value.getTime()) ? "Unknown" : value.toLocaleString();
  }

  private renderToolbar(container: HTMLElement): void {
    const toolbar = container.createDiv({ cls: "game-dashboard-toolbar" });
    const left = toolbar.createDiv({ cls: "game-dashboard-toolbar-group" });

    const search = left.createEl("input", {
      cls: "game-dashboard-input",
      type: "text",
      placeholder: "搜索游戏、平台、开发商"
    });
    search.value = this.query;
    search.addEventListener("input", () => {
      this.query = search.value.trim();
      this.renderContent();
    });

    const sort = left.createEl("select", { cls: "game-dashboard-select" });
    [
      ["updated", "最近更新"],
      ["name", "按标题"]
    ].forEach(([value, label]) => sort.createEl("option", { value, text: label }));
    sort.value = this.sortMode;
    sort.addEventListener("change", () => {
      this.sortMode = sort.value as SortMode;
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

  private renderFilterBar(entries: GameEntry[]): void {
    const bar = this.filterBarEl;
    if (!bar) return;
    bar.empty();
    const counts = new Map<string, number>();
    counts.set("all", entries.length);
    for (const entry of entries) {
      counts.set(entry.status, (counts.get(entry.status) ?? 0) + 1);
    }

    (
      [
        ["all", "全部"],
        ["active", "进行中"],
        ["backlog", "待开始"],
        ["paused", "暂停"],
        ["completed", "已完成"],
        ["archived", "已归档"],
        ["unsorted", "未整理"]
      ] satisfies Array<[StatusFilter, string]>
    ).forEach(([value, label]) => {
      const button = bar.createEl("button", {
        cls: `game-dashboard-filter-chip ${this.statusFilter === value ? "is-active" : ""}`,
        text: `${label} ${counts.get(value) ?? 0}`
      });
      button.addEventListener("click", () => {
        this.statusFilter = value;
        this.renderFilterBar(this.entries);
        this.preserveScroll(() => this.renderContent());
      });
    });
  }

  private renderDetail(container: HTMLElement, entry: GameEntry | null): void {
    const panel = container.createDiv({ cls: "game-dashboard-detail-panel" });

    if (!entry) {
      panel.createDiv({ cls: "game-dashboard-empty game-dashboard-detail-empty", text: "当前没有可展示的游戏条目。" });
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
      preview.createDiv({ cls: "game-dashboard-detail-fallback", text: "🎮" });
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
      entry.rating && `评分 ${entry.rating}`
    ]
      .filter(Boolean)
      .join(" · ");
    if (meta) body.createDiv({ cls: "game-dashboard-detail-meta", text: meta });

    const facts = body.createDiv({ cls: "game-dashboard-detail-facts" });
    [
      entry.platform ? `Platform · ${entry.platform}` : "",
      entry.progress ? `Progress · ${entry.progress}` : "",
      entry.rating ? `Rating · ${entry.rating}` : ""
    ]
      .filter(Boolean)
      .forEach((text) => {
        facts.createDiv({ cls: "game-dashboard-detail-fact", text });
      });
    if (facts.childElementCount === 0) facts.remove();

    const summary = body.createEl("p", {
      cls: "game-dashboard-detail-summary",
      text: entry.summary || "暂无摘要。后续可以通过主文档 frontmatter 或正文同步补全。"
    });
    summary.setAttribute("dir", "auto");

    const actions = body.createDiv({ cls: "game-dashboard-action-row" });
    actions.appendChild(this.createFileLink("打开主笔记", entry.mainFile, "game-dashboard-button primary"));
    if (entry.officialUrl) actions.appendChild(this.createExternalLink("官方链接", entry.officialUrl, "game-dashboard-button"));
    if (entry.detailUrl) actions.appendChild(this.createExternalLink("详情页", entry.detailUrl, "game-dashboard-button"));
    const deleteButton = actions.createEl("button", { cls: "game-dashboard-button danger", text: "删除游戏" });
    deleteButton.addEventListener("click", async () => {
      new DeleteGameConfirmModal(this.app, entry, async () => {
        this.hideTooltip();
        if (this.selectedPath === entry.folder.path) this.selectedPath = null;
        await this.plugin.deleteGame(entry);
      }).open();
    });

    const side = content.createDiv({ cls: "game-dashboard-detail-side" });
    const related = side.createDiv({ cls: "game-dashboard-related" });
    related.createEl("h4", { cls: "game-dashboard-side-title", text: "关联笔记" });
    const notes = related.createDiv({ cls: "game-dashboard-note-list" });
    if (entry.notes.length === 0) {
      notes.createDiv({ cls: "game-dashboard-empty-inline", text: "还没有关联笔记。" });
    } else {
      entry.notes.forEach((file) => {
        notes.appendChild(this.createFileLink(file.basename, file, "game-dashboard-note-chip"));
      });
    }
  }

  private renderSections(container: HTMLElement, entries: GameEntry[]): void {
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
        text: `${items.length} items · ${section.subtitle}`
      });

      const toggle = header.createEl("button", {
        cls: "game-dashboard-toggle",
        text: collapsed ? "展开" : "收起"
      });
      toggle.addEventListener("click", () => {
        this.collapsedSections[section.key] = !this.collapsedSections[section.key];
        wrapper.toggleClass("is-collapsed", this.collapsedSections[section.key]);
        wrapper.toggleClass("is-expanded", !this.collapsedSections[section.key]);
        toggle.setText(this.collapsedSections[section.key] ? "展开" : "收起");
      });

      const body = wrapper.createDiv({ cls: "game-dashboard-section-body" });
      const grid = body.createDiv({ cls: "game-dashboard-grid" });

      if (items.length === 0) {
        grid.createDiv({ cls: "game-dashboard-empty", text: "当前分组没有匹配条目。" });
      } else {
        items.forEach((entry) => grid.appendChild(this.buildCard(entry)));
      }
    }
  }

  private renderEndcap(container: HTMLElement, count: number): void {
    const endcap = container.createDiv({ cls: "game-dashboard-endcap" });
    endcap.createDiv({ cls: "game-dashboard-endcap-line" });
    endcap.createDiv({
      cls: "game-dashboard-endcap-text",
      text: count > 0 ? `End of Library · ${count} visible` : "End of Library"
    });
  }

  private buildCard(entry: GameEntry): HTMLElement {
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
      cover.createDiv({ cls: "game-dashboard-card-fallback", text: "🎮" });
    }
    cover.createDiv({ cls: "game-dashboard-card-gloss" });

    return card;
  }

  private renderPosterOverlay(entry: GameEntry, compact: boolean): HTMLElement {
    const overlay = createNode("div", {
      cls: compact ? "game-dashboard-poster-overlay compact" : "game-dashboard-poster-overlay"
    });
    const meta = overlay.createDiv({ cls: "game-dashboard-poster-meta" });
    meta.createDiv({ cls: "game-dashboard-poster-kind", text: "游戏" });
    meta.appendChild(this.createStatusPill(entry.status));
    overlay.createDiv({ cls: "game-dashboard-poster-title", text: entry.title });

    const sub = [entry.developer, entry.platform, entry.progress].filter(Boolean).join(" · ");
    if (sub) overlay.createDiv({ cls: "game-dashboard-poster-sub", text: sub });

    return overlay;
  }

  private createStatusPill(status: string): HTMLElement {
    return createNode("span", {
      cls: `game-dashboard-pill game-dashboard-pill-${status || "unsorted"}`,
      text: STATUS_LABELS[status] ?? STATUS_LABELS.unsorted
    });
  }

  private createFileLink(label: string, file: TFile | null, className = ""): HTMLElement {
    const link = createNode(file ? "a" : "span", { text: label, cls: className });
    if (!file) return link;
    link.href = file.path;
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.app.workspace.getLeaf("tab").openFile(file);
    });
    return link;
  }

  private createExternalLink(label: string, url: string, className = ""): HTMLElement {
    const link = createNode("a", { text: label, cls: className });
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  private showTooltip(anchor: HTMLElement, entry: GameEntry): void {
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
      preview.createDiv({ cls: "game-dashboard-card-fallback", text: "🎮" });
    }

    const tooltipWidth = 280;
    const tooltipHeight = 320;
    const gap = 16;
    const rect = anchor.getBoundingClientRect();
    const placeRight = window.innerWidth - rect.right >= tooltipWidth + gap || rect.left < tooltipWidth;
    const left = placeRight
      ? Math.min(rect.right + gap, window.innerWidth - tooltipWidth - 12)
      : Math.max(12, rect.left - tooltipWidth - gap);
    const top = Math.max(12, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 12));

    this.floatingTooltipEl.style.left = `${left}px`;
    this.floatingTooltipEl.style.top = `${top}px`;
    this.floatingTooltipEl.classList.add("is-visible");
  }

  private hideTooltip(): void {
    if (!this.floatingTooltipEl) return;
    this.floatingTooltipEl.classList.remove("is-visible");
    this.floatingTooltipEl.style.left = "-9999px";
    this.floatingTooltipEl.style.top = "-9999px";
  }

  private filterEntries(entries: GameEntry[]): GameEntry[] {
    const query = this.query.toLowerCase();
    const filtered = entries.filter((entry) => {
      if (this.statusFilter !== "all" && entry.status !== this.statusFilter) return false;
      if (!query) return true;
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.developer.toLowerCase().includes(query) ||
        entry.platform.toLowerCase().includes(query) ||
        entry.relativePath.toLowerCase().includes(query)
      );
    });

    if (this.sortMode === "name") {
      return filtered.sort((left, right) => left.title.localeCompare(right.title, "zh-Hans-CN"));
    }

    return filtered.sort((left, right) => right.updatedAt - left.updatedAt);
  }
}
