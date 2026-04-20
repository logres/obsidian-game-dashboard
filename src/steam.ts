import { requestUrl } from "obsidian";
import { GameSearchCandidate } from "./types";

interface SteamSearchItem {
  id: number;
  name?: string;
}

interface SteamSearchResponse {
  items?: SteamSearchItem[];
}

interface SteamAppData {
  name?: string;
  short_description?: string;
  detailed_description?: string;
  header_image?: string;
  capsule_image?: string;
  capsule_imagev5?: string;
  developers?: string[];
  publishers?: string[];
  genres?: Array<{ description?: string }>;
  categories?: Array<{ description?: string }>;
  release_date?: {
    date?: string;
  };
  platforms?: {
    windows?: boolean;
    mac?: boolean;
    linux?: boolean;
  };
  website?: string;
  type?: string;
}

function parseSteamYear(dateText: string | undefined): { year: string; releaseDate: string } {
  if (!dateText) return { year: "", releaseDate: "" };
  const parsed = Date.parse(dateText);
  if (Number.isNaN(parsed)) {
    const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
    return { year: yearMatch?.[0] ?? "", releaseDate: dateText };
  }
  const date = new Date(parsed);
  return {
    year: String(date.getFullYear()),
    releaseDate: date.toISOString().slice(0, 10)
  };
}

function platformText(platforms: SteamAppData["platforms"]): string {
  if (!platforms) return "";
  const values = [
    platforms.windows ? "Windows" : "",
    platforms.mac ? "macOS" : "",
    platforms.linux ? "Linux" : ""
  ].filter(Boolean);
  return values.join(", ");
}

function stripHtml(input: string | undefined): string {
  return (input ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export class SteamClient {
  async searchGames(query: string): Promise<GameSearchCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const search = await requestUrl({
      url: `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(trimmed)}&l=english&cc=us`,
      method: "GET"
    });

    const searchJson = search.json as SteamSearchResponse;
    const items = (searchJson.items ?? []).slice(0, 8);
    const details = await Promise.all(items.map(async (item) => await this.getAppCandidate(item.id)));
    return details.filter((item): item is GameSearchCandidate => item !== null);
  }

  private async getAppCandidate(appId: number): Promise<GameSearchCandidate | null> {
    const response = await requestUrl({
      url: `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`,
      method: "GET"
    });

    const payload = response.json?.[String(appId)];
    if (!payload?.success || !payload?.data) return null;

    const data = payload.data as SteamAppData;
    if (data.type && data.type !== "game") return null;

    const { year, releaseDate } = parseSteamYear(data.release_date?.date);
    const summary = stripHtml(data.short_description);
    const storyline = stripHtml(data.detailed_description);

    return {
      id: appId,
      source: "steam",
      title: data.name ?? `Steam App ${appId}`,
      summary,
      developer: (data.developers ?? []).join(", "),
      publisher: (data.publishers ?? []).join(", "),
      platform: platformText(data.platforms),
      year,
      releaseDate,
      rating: "",
      officialUrl: data.website ?? `https://store.steampowered.com/app/${appId}`,
      detailUrl: `https://store.steampowered.com/app/${appId}`,
      steamUrl: `https://store.steampowered.com/app/${appId}`,
      igdbUrl: "",
      posterUrl: data.capsule_imagev5 ?? data.capsule_image ?? data.header_image ?? "",
      bannerUrl: data.header_image ?? data.capsule_imagev5 ?? data.capsule_image ?? "",
      storyline,
      genres: (data.genres ?? []).map((genre) => genre.description ?? "").filter(Boolean),
      themes: [],
      modes: (data.categories ?? []).map((category) => category.description ?? "").filter(Boolean),
      screenshots: []
    };
  }
}
