import { UnresolvedQuery } from "erela.js"

export interface TIDALOptions {
    convertUnresolved?: boolean,
    countryCode?: string
}

export interface Result {
    tracks: UnresolvedQuery[],
    name?: string
}

export interface TIDALTrack {
    title: string,
    artist: {
        name?: string
    },
    duration: number
}

export interface TIDALTrackListInfo {
    title: string
}

export interface TIDALTrackList {
    items: TIDALTrack[]
}

export interface SearchResult {
    exception?: {
        severity: string;
        message: string
    };
    loadType: string;
    playlist?: {
        duration: number;
        name: string
    };
    tracks: UnresolvedTrack[]
}