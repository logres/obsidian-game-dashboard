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

    new Setting(containerEl).setName("Game dashboard").setHeading();

    new Setting(containerEl)
      .setName("Games root folder")
      .setDesc("Each direct subfolder under this path is treated as one game entry. Each game folder should contain Game.md and an optional GameAssets folder.")
      .addText((text) =>
        text
          .setPlaceholder("2-Knowledge/Media Library/Games")
          .setValue(this.plugin.settings.gamesRoot)
          .onChange((value) => {
            void this.updateGamesRoot(value);
          })
      );

    new Setting(containerEl)
      .setName("Main note name")
      .setDesc("The main details note created inside each game folder.")
      .addText((text) =>
        text
          .setPlaceholder("Game.md")
          .setValue(this.plugin.settings.mainNoteName)
          .onChange((value) => {
            void this.updateMainNoteName(value);
          })
      );

    new Setting(containerEl)
      .setName("Open note after create")
      .setDesc("Open the newly created main note after the creation modal completes.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openNoteAfterCreate).onChange((value) => {
          this.plugin.settings.openNoteAfterCreate = value;
          void this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("Metadata import").setHeading();

    new Setting(containerEl)
      .setName("Client ID")
      .setDesc("Twitch application client ID used for metadata search and import.")
      .addText((text) =>
        text
          .setPlaceholder("Your Twitch client ID")
          .setValue(this.plugin.settings.igdbClientId)
          .onChange((value) => {
            this.plugin.settings.igdbClientId = value.trim();
            void this.plugin.saveSettings();
          })
      );

    const secretSetting = new Setting(containerEl)
      .setName("Client secret")
      .setDesc("Stored with Obsidian SecretStorage and used only to request metadata access tokens.");

    secretSetting.controlEl.empty();
    new SecretComponent(this.app, secretSetting.controlEl)
      .setValue(this.plugin.getIgdbClientSecret())
      .onChange((value) => {
        this.plugin.setIgdbClientSecret(value.trim());
      });

    new Setting(containerEl)
      .setName("Open dashboard")
      .setDesc("Open or reveal the game dashboard view.")
      .addButton((button) =>
        button.setButtonText("Open").onClick(() => {
          void this.plugin.activateView();
        })
      );
  }

  private async updateGamesRoot(value: string): Promise<void> {
    this.plugin.settings.gamesRoot = value.trim();
    await this.plugin.saveSettings();
    await this.plugin.refreshAllViews();
  }

  private async updateMainNoteName(value: string): Promise<void> {
    const nextValue = value.trim() || DEFAULT_SETTINGS.mainNoteName;
    this.plugin.settings.mainNoteName = nextValue.endsWith(".md") ? nextValue : `${nextValue}.md`;
    await this.plugin.saveSettings();
    await this.plugin.refreshAllViews();
  }
}
