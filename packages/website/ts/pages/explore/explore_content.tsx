import * as React from 'react';

import { ExploreGridFeaturedTile } from 'ts/pages/explore/explore_grid_featured_tile';
import {
    ExploreFilterMetadata,
    ExploreFilterType,
    ExploreProject,
    ExploreTile,
    ExploreTilesOrdering,
    ExploreTilesOrderingMetadata,
    ExploreTilesOrderingType,
    ExploreTileVisibility,
    ExploreTileWidth,
} from 'ts/types';

export const PROJECTS: { [s: string]: ExploreProject } = {
    paradex: {
        name: 'paradex',
        label: 'Paradex',
        description: 'Paradex is a matching relayer with a focus on stable coins that is now a part of Coinbase.',
        logo_url: '/images/explore/paradex.png',
        theme_color: '#151628',
        url: 'https://paradex.io/',
        keywords: ['relayer'],
    },
    veil: {
        name: 'veil',
        label: 'Veil',
        description:
            'Veil is a non-custodial trading platform for blockchain-based derivatives and prediction markets.',
        logo_url: '/images/explore/veil.png',
        theme_color: '#0204EB',
        url: 'https://veil.co/',
        keywords: ['relayer'],
    },
    radar_relay: {
        name: 'radar_relay',
        label: 'Radar Relay',
        description: 'Radar Relay is an open order book relayer made by an international team based in Colorado.',
        logo_url: '/images/explore/radar_relay.png',
        theme_color: '#262626',
        url: 'https://radarrelay.com/',
        keywords: ['relayer'],
        instant: {
            orderSource: 'https://api.radarrelay.com/0x/v2/',
        },
    },
    emoon: {
        name: 'emoon',
        label: 'Emoon',
        description: 'Emoon is a peer-to-peer marketplace for the exchange of ERC-20 and ERC-721 crypto assets.',
        logo_url: '/images/explore/emoon.png',
        theme_color: '#3F89E7',
        url: 'https://www.emoon.io/',
        keywords: ['relayer', 'collectibles'],
    },
    openrelay: {
        name: 'openrelay',
        label: 'OpenRelay',
        description:
            'Open Relay is an open order book relayer with a focus on scalable and open source backend infrastructure.',
        logo_url: '/images/explore/open_relay.png',
        theme_color: '#163AAB',
        url: 'https://openrelay.xyz/',
        keywords: ['relayer'],
    },
    boxswap: {
        name: 'boxswap',
        label: 'BoxSwap',
        description: 'OTC relayer made for swapping ERC-20 and ERC-721 assets in a marketplace communities.',
        logo_url: '/images/explore/box_swap.png',
        theme_color: '#FF99DF',
        url: 'https://boxswap.io/',
        keywords: ['collectibles'],
    },
};

export const EDITORIAL: ExploreTile[] = [
    {
        name: 'editorial_featured',
        component: (
            <ExploreGridFeaturedTile
                {...PROJECTS.paradex}
                headerImageUrl={'/images/explore/editorial/featured/paradex.png'}
            />
        ),
        visibility: ExploreTileVisibility.Visible,
        width: ExploreTileWidth.FullWidth,
    },
];

export const FILTERS: ExploreFilterMetadata[] = [
    {
        label: 'All',
        name: 'all',
        filterType: ExploreFilterType.All,
    },
    {
        label: 'Relayer',
        name: 'relayer',
        filterType: ExploreFilterType.Keyword,
    },
    {
        label: 'Collectibles',
        name: 'collectibles',
        filterType: ExploreFilterType.Keyword,
    },
];

export const ORDERINGS: ExploreTilesOrderingMetadata[] = [
    { label: 'Popular', ordering: ExploreTilesOrdering.Popular, type: ExploreTilesOrderingType.HardCodedByName },
    {
        label: 'Recently Added',
        ordering: ExploreTilesOrdering.RecentlyAdded,
        type: ExploreTilesOrderingType.HardCodedByName,
    },
    {
        label: 'Alphabetical',
        ordering: ExploreTilesOrdering.Alphabetical,
        type: ExploreTilesOrderingType.HardCodedByName,
    },
];

export const BY_NAME_ORDERINGS: { [s: string]: string[] } = {
    [ExploreTilesOrdering.Popular]: ['boxswap', 'veil', 'paradex', 'emoon', 'radar_relay', 'openrelay'],
    [ExploreTilesOrdering.RecentlyAdded]: ['veil', 'boxswap', 'emoon', 'paradex', 'radar_relay', 'openrelay'],
    [ExploreTilesOrdering.Alphabetical]: ['veil', 'boxswap', 'emoon', 'paradex', 'radar_relay', 'openrelay'],
};

export const AVAILABLE_ASSET_DATAS: string[] = [
    '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
    '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xf47261b00000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
    '0xf47261b000000000000000000000000005f4a42e251f2d52b8ed15e9fedaacfcef1fad27', // ZIL
    '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942', // MANA
    '0xf47261b00000000000000000000000000abdace70d3790235af448c88547603b945604ea', // DNT
    '0xf47261b000000000000000000000000041e5560054824ea6b0732e656e3ad64e20e94e45', // CVC
];
