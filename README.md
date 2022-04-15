<div align = "center">
<a href="https://www.npmjs.com/package/erela.js-tidal">
<img src="https://img.shields.io/npm/dw/erela.js-tidal?color=CC3534&logo=npm&style=for-the-badge" alt="Downloads">
</a>

<a href="https://www.npmjs.com/package/erela.js-tidal">
<img src="https://img.shields.io/npm/v/erela.js-tidal?color=red&label=Version&logo=npm&style=for-the-badge" alt="Npm version">
</a>
<br>

<a href="https://github.com/WearifulCupid0/erela.js-tidal">
<img src="https://img.shields.io/github/stars/wearifulcupid0/erela.js-tidal?color=333&logo=github&style=for-the-badge" alt="Github stars">
</a>

<a href="https://github.com/WearifulCupid0/erela.js-tidal/blob/master/LICENSE">
<img src="https://img.shields.io/github/license/wearifulcupid0/erela.js-tidal?color=6e5494&logo=github&style=for-the-badge" alt="License">
</a>
<hr>
</div>
This a plugin for Erela.JS to allow the use of TIDAL URL's, it uses direct URL's being tracks, albums, and playlists and gets the YouTube equivalent.

- https://listen.tidal.com/track/165813923
- https://listen.tidal.com/album/165813921
- https://listen.tidal.com/playlist/36ea71a8-445e-41a4-82ab-6628c581535d

## Documentation & Guides

It is recommended to read the documentation to start, and the guides to use the plugin.

- [Documentation](https://erelajs-docs.netlify.app/docs/gettingstarted.html 'Erela.js Documentation') 

- [Guides](https://erelajs-docs.netlify.app/guides/introduction.html 'Erela.js Guides')

## Installation

**NPM** :
```sh
npm install erela.js-tidal
```

**Yarn** :
```sh
yarn add erela.js-tidal
```

## Options
- ### convertUnresolved
> Converts all UnresolvedTracks into a Track. \
> **NOTE: THIS IS NOT RECOMMENDED AS IT WILL ATTEMPT TO CONVERT EVERY TRACK, INCLUDING ALBUMS AND PLAYLISTS TRACKS.** \
> **DEPENDING ON THE AMOUNT THIS WILL TAKE A WHILE AND MAY RATELIMIT YOUR LAVALINK NODE.**

- ### countryCode
> An ISO 3166-1 alpha-2 country code. \
> **Default: US**

## Example Usage

```javascript
const { Manager } = require("erela.js");
const TIDAL  = require("erela.js-tidal");

const manager = new Manager({
  plugins: [
    // Initiate the plugin
    new TIDAL()
  ]
});

manager.search("https://listen.tidal.com/track/165813923");
```