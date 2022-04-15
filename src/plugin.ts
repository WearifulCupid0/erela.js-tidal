import { Result, TIDALOptions, TIDALTrack, TIDALTrackList, TIDALTrackListInfo, SearchResult } from '../typings';
import { LoadType, Manager, Plugin, SearchQuery, TrackUtils, UnresolvedQuery, UnresolvedTrack } from 'erela.js';
import axios from 'axios';

const USER_AGENT: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36 OPR/85.0.4341.68';
const MAIN_URL: string = 'https://listen.tidal.com';
const API_URL: string = 'https://api.tidal.com/v1';

const URL_REGEX: RegExp = /^http(?:s|):\/\/(?:listen\.|www\.|)tidal\.com\/(?:browse\/|)(track|album|playlist)\/([a-zA-Z0-9-_]+)/;

const SCRIPT_REGEX: RegExp = /src="\/app\.([a-zA-Z0-9-_]+)\.js"/;
const TOKEN_REGEX: RegExp = /(?:[a-zA-Z0-9-_]{2})\(\)\?"(?:[a-zA-Z0-9-_]+)"\:"([a-zA-Z0-9-_]+)"/;

function check(options?: TIDALOptions): void {
    if (
        typeof options !== 'undefined' &&
        typeof options !== 'object'
    ) throw new TypeError('TIDALPlugin#options options must be an object.');
    if (typeof options !== 'undefined') {
        if (
            typeof options.convertUnresolved !== 'undefined' &&
            typeof options.convertUnresolved !== 'boolean'
        ) throw new TypeError('TIDALPlugin#options convertUnresolved must be a boolean.');
        if (
            typeof options.countryCode !== 'undefined' &&
            typeof options.countryCode !== 'string'
        ) throw new TypeError('TIDALPlugin#options countryCode must be a string.');
    }
}

function convertToQuery(track: TIDALTrack): UnresolvedQuery {
    return {
        title: track.title,
        author: track.artist.name,
        duration: track.duration * 1000
    }
}

function buildSearch(loadType: LoadType, tracks: UnresolvedTrack[], error: string, name: string): SearchResult {
    return {
        loadType: loadType,
        tracks: tracks ?? [],
        playlist: name ? {
        name,
        duration: tracks
            .reduce(
                (acc: number, cur: UnresolvedTrack) => acc + (cur.duration || 0),
                0,
            ),
        } : null,
        exception: error ? {
            message: error,
            severity: 'COMMON',
        } : null,
    }
}

export class TIDALPlugin extends Plugin {
    private readonly options: TIDALOptions;
    private readonly functions: Record<string, Function>;

    private _search: (query: string | SearchQuery, requester?: unknown) => Promise<SearchResult>;
    private manager: Manager;
    private token: string;

    constructor (options?: TIDALOptions) {
        super();
        check(options);
        this.options = { ...options };

        this.functions = {
            track: this.getTrack.bind(this),
            album: this.getAlbum.bind(this),
            playlist: this.getPlaylist.bind(this)
        }
    }

    public async load(manager: Manager): Promise<void> {
        this.manager = manager;
        this._search = this.manager.search.bind(manager);
        this.manager.search = this.search.bind(this);
        await this.fetchToken();
    }

    private async search(query: string | SearchQuery, requester?: unknown): Promise<SearchResult> {
        const finalQuery = (query as SearchQuery).query || query as string;
        const [, type, id] = URL_REGEX.exec(finalQuery) ?? [];

        if (this.functions[type]) {
            try {
                const func = this.functions[type];
                if (func) {
                    const data: Result = await func(id);
                    const loadType = type === 'track' ? 'TRACK_LOADED' : 'PLAYLIST_LOADED';
                    const name = ['playlist', 'album'].includes(type) ? data.name : null;

                    const tracks = data.tracks.map((query: UnresolvedQuery): UnresolvedTrack => TrackUtils.buildUnresolved(query, requester));
                    if (this.options.convertUnresolved) await Promise.all(tracks.map((track) => track.resolve()));
                    
                    return buildSearch(loadType, tracks, null, name);
                }

                return buildSearch('LOAD_FAILED', null, 'Invalid TIDAL url.', null);
            } catch (e) {
                return buildSearch(e.loadType ?? 'LOAD_FAILED', null, e.message ?? null, null);
            }
        }

        return this._search(query, requester);
    }

    private async fetchToken(): Promise<boolean> {
        return axios.get(MAIN_URL, {
            responseType: 'text',
            headers: { 'User-Agent': USER_AGENT }
        }).then((mainPage) => {
            if (mainPage.status !== 200)
                throw RangeError('TIDALPlugin#fetchToken failed to fetch token. Main TIDAL page didn\'t return a 200 (OK) status code.');
            const scriptResult: RegExpExecArray|null = SCRIPT_REGEX.exec(mainPage.data as string);
            if (!scriptResult || !scriptResult[1])
                throw RangeError('TIDALPlugin#fetchToken failed to fetch token. Script id not found on main TIDAL page.');
            return axios.get(MAIN_URL + `/app.${scriptResult[1]}.js`, {
                responseType: 'text',
                headers: { 'User-Agent': USER_AGENT }
            }).then((scriptPage) => {
                if (scriptPage.status !== 200)
                    throw RangeError('TIDALPlugin#fetchToken failed to fetch token. Script page didn\'t return a 200 (OK) status code.');
                const tokenResult: RegExpExecArray|null = TOKEN_REGEX.exec(scriptPage.data);
                if (!tokenResult || !tokenResult[1])
                    throw RangeError('TIDALPlugin#fetchToken failed to fetch token. Token not found on script page.');
                this.token = tokenResult[1];
                return true;
            })
        })
    }

    private async getAlbum(id: string): Promise<Result> {
        const album: TIDALTrackListInfo = await this.makeRequest<TIDALTrackListInfo>(`/albums/${id}`);
        const tracks: TIDALTrackList = await this.makeRequest<TIDALTrackList>(`/albums/${id}/tracks`);

        return { tracks: tracks.items.map((item: TIDALTrack) => convertToQuery(item)), name: album.title };
    }

    private async getPlaylist(id: string): Promise<Result> {
        const album: TIDALTrackListInfo = await this.makeRequest<TIDALTrackListInfo>(`/playlists/${id}`);
        const tracks: TIDALTrackList = await this.makeRequest<TIDALTrackList>(`/playlists/${id}/tracks`);

        return { tracks: tracks.items.map((item: TIDALTrack) => convertToQuery(item)), name: album.title };
    }

    private async getTrack(id: string): Promise<Result> {
        const raw: TIDALTrack = await this.makeRequest<TIDALTrack>(`/tracks/${id}`);
        const track: UnresolvedQuery = convertToQuery(raw);
        return { tracks: [ track ] }
    }

    private async makeRequest<T>(path: string): Promise<T> {
        if (!this.token) await this.fetchToken();
        return axios.get(API_URL + path, {
            headers: {
                'x-tidal-token': this.token,
                'User-Agent': USER_AGENT,
                Accept: 'application/json'
            },
            params: {
                countryCode: this.options.countryCode || 'US'
            },
            responseType: 'json'
        }).then(async(apiResponse) => {
            if (apiResponse.status === 401) {
                await this.fetchToken();
                return this.makeRequest(path);
            }
            if (apiResponse.status !== 200)
                throw new RangeError('TIDALPlugin#makeRequest TIDAL api didn\'t return 200 (OK) as status code.');
            
            return apiResponse.data;
        })
    }
}