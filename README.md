# Obsidian Game Dashboard

Folder-based game dashboard plugin for Obsidian.

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Watch mode:

```bash
npm run watch
```

## Local Install

Copy these files into `.obsidian/plugins/game-dashboard/`:

- `manifest.json`
- `main.js`
- `styles.css`
- `versions.json`

Optional:

- `data.json` to preserve local plugin settings

## Local Dev Sync

For active plugin development, create a local config file from the example:

```bash
copy dev.config.example.json dev.config.local.json
```

Then update paths in `dev.config.local.json`.

Start watch + sync + reload:

```bash
npm run dev
```

Do a one-shot build + sync:

```bash
npm run install:local
```
