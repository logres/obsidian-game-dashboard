# Game Dashboard

Game Dashboard turns a folder of game notes into a browsable library view inside Obsidian.

## Features

- Scans a root folder and treats each direct subfolder as one game entry
- Opens a dedicated dashboard view with poster, banner, metadata, and quick actions
- Creates a complete game note structure with frontmatter and asset folders
- Imports metadata from Steam search
- Optionally enriches entries with IGDB metadata, artwork, and screenshots

## Installation

### Community plugins

When the plugin is available in the Obsidian community catalog, install `Game Dashboard` from `Settings -> Community plugins -> Browse`.

### Manual install

Download `manifest.json`, `main.js`, and `styles.css` from the latest GitHub release, then place them in:

```text
.obsidian/plugins/game-dashboard/
```

## Usage

1. Open the command palette and run `Open Game Dashboard`.
2. Set your game library root folder in the plugin settings.
3. Use `Create game entry` to add a new folder-based game note.
4. Optionally configure IGDB credentials to import richer metadata.

## IGDB setup

IGDB import uses Twitch application credentials.

- `IGDB Client ID` is stored in normal plugin settings.
- `IGDB Client Secret` is stored with Obsidian `SecretStorage` and is not written to `data.json`.

If no IGDB credentials are configured, the plugin still works with local notes and Steam import.

## Privacy

- The plugin reads files only inside your vault.
- Steam search requests go to `store.steampowered.com`.
- Optional IGDB import requests go to `api.igdb.com`, `id.twitch.tv`, and `images.igdb.com`.
- No third-party API requests are made unless you actively use import features.

## Development

Install dependencies:

```bash
npm install
```

Build once:

```bash
npm run build
```

Watch local source changes:

```bash
npm run watch
```

## Local dev sync

Create a local config file from the example:

```bash
copy dev.config.example.json dev.config.local.json
```

Then update the paths in `dev.config.local.json`.

Watch, sync, and reload the plugin in your local vault:

```bash
npm run dev
```

Do a one-shot build and local install:

```bash
npm run install:local
```
