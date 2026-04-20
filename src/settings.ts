import { App, PluginSettingTab, SecretComponent, Setting } from "obsidian";
import type GameDashboardPlugin from "./main";
import { GameDashboardSettings } from "./types";

export const DEFAULT_SETTINGS: GameDashboardSettings = {
  gamesRoot: "2-Knowledge/Media Library/Games",
  mainNoteName: "Game.md",
  openNoteAfterCreate: true,
  igdbClientId: ""
};

export class GameDashboardSettingTab extends PluginSettingTab {
  plugin: GameDashboardPlugin;

  constructor(app: App, plugin: GameDashboardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Game Dashboard" });

    new Setting(containerEl)
      .setName("Games root folder")
      .setDesc("Each direct subfolder under this path is treated as one game entry. Each game folder should contain Game.md and an optional GameAssets folder.")
      .addText((text) =>
        text
          .setPlaceholder("2-Knowledge/Media Library/Games")
          .setValue(this.plugin.settings.gamesRoot)
          .onChange(async (value) => {
            this.plugin.settings.gamesRoot = value.trim();
            await this.plugin.saveSettings();
            await this.plugin.refreshAllViews();
          })
      );

    new Setting(containerEl)
      .setName("Main note name")
      .setDesc("The main details note created inside each game folder.")
      .addText((text) =>
        text
          .setPlaceholder("Game.md")
          .setValue(this.plugin.settings.mainNoteName)
          .onChange(async (value) => {
            const nextValue = value.trim() || DEFAULT_SETTINGS.mainNoteName;
            this.plugin.settings.mainNoteName = nextValue.endsWith(".md") ? nextValue : `${nextValue}.md`;
            await this.plugin.saveSettings();
            await this.plugin.refreshAllViews();
          })
      );

    new Setting(containerEl)
      .setName("Open note after create")
      .setDesc("Open the newly created main note after the creation modal completes.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openNoteAfterCreate).onChange(async (value) => {
          this.plugin.settings.openNoteAfterCreate = value;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "IGDB Import" });

    new Setting(containerEl)
      .setName("IGDB Client ID")
      .setDesc("Twitch application Client ID used for IGDB search and import.")
      .addText((text) =>
        text
          .setPlaceholder("Your Twitch Client ID")
          .setValue(this.plugin.settings.igdbClientId)
          .onChange(async (value) => {
            this.plugin.settings.igdbClientId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    const secretSetting = new Setting(containerEl)
      .setName("IGDB Client Secret")
      .setDesc("Stored with Obsidian SecretStorage and used only to request IGDB access tokens.");

    secretSetting.controlEl.empty();
    new SecretComponent(this.app, secretSetting.controlEl)
      .setValue(this.plugin.getIgdbClientSecret())
      .onChange(async (value) => {
        await this.plugin.setIgdbClientSecret(value.trim());
      });

    new Setting(containerEl)
      .setName("Open dashboard")
      .setDesc("Open or reveal the Game Dashboard view.")
      .addButton((button) =>
        button.setButtonText("Open").onClick(async () => {
          await this.plugin.activateView();
        })
      );
  }
}
