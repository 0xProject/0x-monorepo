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
        keyword: 'relayer',
    },
    {
        label: 'Collectibles',
        name: 'collectibles',
        filterType: ExploreFilterType.Keyword,
        keyword: 'ERC-721',
    },
];

export const ORDERINGS: ExploreTilesOrderingMetadata[] = [
    { label: 'None', ordering: ExploreTilesOrdering.None, type: ExploreTilesOrderingType.HardCodedByName },
    { label: 'Latest', ordering: ExploreTilesOrdering.Latest, type: ExploreTilesOrderingType.HardCodedByName },
    { label: 'Popular', ordering: ExploreTilesOrdering.Popular, type: ExploreTilesOrderingType.HardCodedByName },
];

export const BY_NAME_ORDERINGS: { [s: string]: string[] } = {
    [ExploreTilesOrdering.Popular]: ['boxswap', 'veil', 'paradex', 'emoon', 'radar_relay', 'openrelay'],
    [ExploreTilesOrdering.Latest]: ['veil', 'boxswap', 'emoon', 'paradex', 'radar_relay', 'openrelay'],
};
