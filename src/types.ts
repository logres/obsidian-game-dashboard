import { TFile, TFolder } from "obsidian";

export interface GameDashboardSettings {
  gamesRoot: string;
  mainNoteName: string;
  openNoteAfterCreate: boolean;
  igdbClientId: string;
}

export interface GameEntry {
  folder: TFolder;
  mainFile: TFile | null;
  notes: TFile[];
  posterFile: TFile | null;
  bannerFile: TFile | null;
  relativePath: string;
  title: string;
  status: string;
  developer: string;
  platform: string;
  year: string;
  progress: string;
  rating: string;
  summary: string;
  officialUrl: string;
  detailUrl: string;
  steamUrl: string;
  igdbUrl: string;
  updatedAt: number;
  noteCount: number;
}

export interface CreateGameInput {
  title: string;
  status: string;
  developer: string;
  publisher: string;
  platform: string;
  year: string;
  releaseDate: string;
  progress: string;
  rating: string;
  summary: string;
  storyline: string;
  officialUrl: string;
  detailUrl: string;
  steamUrl: string;
  igdbUrl: string;
  posterUrl: string;
  bannerUrl: string;
  genres: string[];
  themes: string[];
  modes: string[];
  screenshots: string[];
}

export interface GameSearchCandidate {
  id: number;
  source: "igdb" | "steam";
  title: string;
  summary: string;
  developer: string;
  publisher: string;
  platform: string;
  year: string;
  releaseDate: string;
  rating: string;
  officialUrl: string;
  detailUrl: string;
  steamUrl: string;
  igdbUrl: string;
  posterUrl: string;
  bannerUrl: string;
  storyline: string;
  genres: string[];
  themes: string[];
  modes: string[];
  screenshots: string[];
}
