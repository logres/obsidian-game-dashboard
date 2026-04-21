import { Notice, requestUrl } from "obsidian";
import type GameDashboardPlugin from "./main";
import { GameSearchCandidate } from "./types";

interface IgdbTokenCache {
  accessToken: string;
  expiresAt: number;
}

interface IgdbGameRecord {
  id?: number;
  name?: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  rating?: number;
  aggregated_rating?: number;
  slug?: string;
  cover?: {
    image_id?: string;
    url?: string;
  };
  artworks?: Array<{
    image_id?: string;
    url?: string;
  }>;
  websites?: Array<{
    url?: string;
  }>;
  involved_companies?: Array<{
    developer?: boolean;
    publisher?: boolean;
    company?: {
      name?: string;
    };
  }>;
  genres?: Array<{ name?: string }>;
  themes?: Array<{ name?: string }>;
  game_modes?: Array<{ name?: string }>;
  platforms?: Array<{ name?: string }>;
  screenshots?: Array<{ url?: string }>;
}

function igdbImageUrl(imageId: string | undefined, size = "cover_big_2x"): string {
  if (!imageId) return "";
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

function normalizeImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function datePartsFromUnix(timestamp?: number): { year: string; releaseDate: string } {
  if (!timestamp) return { year: "", releaseDate: "" };
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return { year: "", releaseDate: "" };
  return {
    year: String(date.getFullYear()),
    releaseDate: date.toISOString().slice(0, 10)
  };
}

function websiteUrl(record: IgdbGameRecord, matcher: (url: string) => boolean): string {
  const urls = (record.websites ?? [])
    .map((item) => item.url ?? "")
    .map((url) => (url.startsWith("//") ? `https:${url}` : url))
    .filter(Boolean);
  return urls.find(matcher) ?? "";
}

function firstExternalUrl(record: IgdbGameRecord): string {
  return (
    (record.websites ?? [])
      .map((item) => item.url ?? "")
      .map((url) => (url.startsWith("//") ? `https:${url}` : url))
      .find(Boolean) ?? ""
  );
}

function companies(record: IgdbGameRecord, kind: "developer" | "publisher"): string {
  const names = (record.involved_companies ?? [])
    .filter((company) => Boolean(company[kind]))
    .map((company) => company.company?.name ?? "")
    .filter(Boolean);
  return uniqueValues(names).join(", ");
}

function names(values?: Array<{ name?: string }>): string[] {
  return uniqueValues((values ?? []).map((item) => item.name ?? ""));
}

function coverFileName(title: string, url: string): string {
  const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? "jpg";
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").trim() || "cover";
  return `${safeTitle}.${extension}`;
}

export class IgdbClient {
  plugin: GameDashboardPlugin;
  tokenCache: IgdbTokenCache | null = null;

  constructor(plugin: GameDashboardPlugin) {
    this.plugin = plugin;
  }

  async searchGames(query: string): Promise<GameSearchCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const token = await this.getAccessToken();
    const body = [
      'fields id,name,summary,storyline,first_release_date,rating,aggregated_rating,slug,',
      'cover.image_id,cover.url,artworks.image_id,artworks.url,websites.url,',
      'involved_companies.developer,involved_companies.publisher,involved_companies.company.name,',
      'genres.name,themes.name,game_modes.name,platforms.name,screenshots.image_id,screenshots.url;',
      `search "${trimmed.replace(/"/g, '\\"')}";`,
      "where version_parent = null;",
      "limit 8;"
    ].join("");

    const response = await requestUrl({
      url: "https://api.igdb.com/v4/games",
      method: "POST",
      headers: {
        "Client-ID": this.plugin.settings.igdbClientId,
        Authorization: `Bearer ${token}`
      },
      body
    });

    const records = Array.isArray(response.json) ? (response.json as IgdbGameRecord[]) : [];
    return records.map((record) => this.toCandidate(record));
  }

  async downloadImage(folderPath: string, title: string, imageUrl: string, purpose: "poster" | "banner"): Promise<string> {
    if (!imageUrl) return "";

    const normalizedUrl = normalizeImageUrl(imageUrl);
    if (!normalizedUrl) return "";

    const fileName = `${purpose}-${coverFileName(title, normalizedUrl)}`;
    const filePath = `${folderPath}/${fileName}`;
    const existing = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (existing) return fileName;

    const response = await requestUrl({
      url: normalizedUrl,
      method: "GET"
    });

    await this.plugin.app.vault.createBinary(filePath, response.arrayBuffer);
    return fileName;
  }

  private async getAccessToken(): Promise<string> {
    const clientSecret = this.plugin.getIgdbClientSecret();
    if (!this.plugin.settings.igdbClientId || !clientSecret) {
      throw new Error("IGDB client ID / client secret is not configured.");
    }

    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache.accessToken;
    }

    const response = await requestUrl({
      url: `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(this.plugin.settings.igdbClientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
      method: "POST"
    });

    const json = response.json as { access_token?: string; expires_in?: number };
    if (!json?.access_token) {
      new Notice("Metadata token request failed.");
      throw new Error("Unable to fetch IGDB access token.");
    }

    this.tokenCache = {
      accessToken: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 0) * 1000
    };
    return json.access_token;
  }

  private toCandidate(record: IgdbGameRecord): GameSearchCandidate {
    const steamUrl = websiteUrl(record, (url) => /store\.steampowered\.com\/app\//i.test(url));
    const externalUrl = firstExternalUrl(record);
    const posterUrl = igdbImageUrl(record.cover?.image_id, "cover_big_2x") || normalizeImageUrl(record.cover?.url);
    const bannerUrl =
      igdbImageUrl(record.artworks?.[0]?.image_id, "screenshot_huge") ||
      normalizeImageUrl(record.artworks?.[0]?.url) ||
      posterUrl;
    const { year, releaseDate } = datePartsFromUnix(record.first_release_date);
    const rating = record.aggregated_rating ?? record.rating;

    return {
      id: record.id ?? Math.trunc(Math.random() * 1_000_000_000),
      source: "igdb",
      title: record.name ?? "Untitled Game",
      summary: record.summary ?? "",
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
      storyline: record.storyline ?? "",
      genres: names(record.genres),
      themes: names(record.themes),
      modes: names(record.game_modes),
      screenshots: uniqueValues(
        (record.screenshots ?? []).map((item) => igdbImageUrl(item.image_id, "screenshot_huge") || normalizeImageUrl(item.url))
      )
    };
  }
}
