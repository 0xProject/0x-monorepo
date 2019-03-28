import * as _ from 'lodash';
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
        description: 'Matching order book relayer acquired by Coinbase.',
        logo_url: '/images/explore/paradex.png',
        theme_color: '#151628',
        url: 'https://paradex.io/',
        keywords: ['tokens'],
    },
    veil: {
        name: 'veil',
        label: 'Veil',
        description: 'Platform for creating and trading in prediction markets on everything.',
        logo_url: '/images/explore/veil.png',
        theme_color: '#0204EB',
        url: 'https://veil.co/',
        keywords: ['prediction_markets'],
    },
    radar_relay: {
        name: 'radar_relay',
        label: 'Radar Relay',
        description: 'Open order book relayer for wallet-to-wallet ERC-20 token trading.',
        logo_url: '/images/explore/radar_relay.png',
        theme_color: '#262626',
        url: 'https://radarrelay.com/',
        keywords: ['tokens'],
        instant: {
            orderSource: 'https://api.radarrelay.com/0x/v2/',
            availableAssetDatas: [
                '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
                '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
                '0xf47261b00000000000000000000000000d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
                '0xf47261b000000000000000000000000005f4a42e251f2d52b8ed15e9fedaacfcef1fad27', // ZIL
                '0xf47261b00000000000000000000000000f5d2fb29fb7d3cfee444a200298f468908cc942', // MANA
                '0xf47261b00000000000000000000000000abdace70d3790235af448c88547603b945604ea', // DNT
                '0xf47261b000000000000000000000000041e5560054824ea6b0732e656e3ad64e20e94e45', // CVC
            ],
        },
    },
    emoon: {
        name: 'emoon',
        label: 'Emoon',
        description: 'A user-friendly marketplace to trade ERC-20 and ERC-721 crypto gaming assets.',
        logo_url: '/images/explore/emoon.png',
        theme_color: '#3F89E7',
        url: 'https://www.emoon.io/',
        keywords: ['collectibles'],
    },
    openrelay: {
        name: 'openrelay',
        label: 'OpenRelay',
        description: 'Highly scalable open source order book platform as a service for developers.',
        logo_url: '/images/explore/open_relay.png',
        theme_color: '#163AAB',
        url: 'https://openrelay.xyz/',
        keywords: ['infrastructure'],
    },
    boxswap: {
        name: 'boxswap',
        label: 'Boxswap',
        description: 'OTC relayer made for swapping ERC-20 and ERC-721 assets in a marketplace communities.',
        logo_url: '/images/explore/box_swap.png',
        theme_color: '#FF99DF',
        url: 'https://boxswap.io/',
        keywords: ['collectibles'],
    },
    bamboo_relay: {
        name: 'bamboo_relay',
        label: 'Bamboo Relay',
        description: 'Trade, lend and borrow tokens directly from your wallet.',
        logo_url: '/images/explore/bamboo_relay.png',
        theme_color: '#05183A',
        url: 'https://bamboorelay.com/',
        keywords: ['tokens'],
    },
    star_bit_ex: {
        name: 'star_bit_ex',
        label: 'Star Bit Ex',
        description: 'Taiwanese matching relayer focused on gamifying the buying of tokens.',
        logo_url: '/images/explore/star_bit_ex.png',
        theme_color: '#192C55',
        url: 'https://www.starbitex.com/',
        keywords: ['tokens'],
    },
    token_jar: {
        name: 'token_jar',
        label: 'TokenJar',
        description: 'Matching order book relayer with free listing of many ERC-20 tokens.',
        logo_url: '/images/explore/token_jar.png',
        theme_color: '#000000',
        url: 'https://tokenjar.io/',
        keywords: ['tokens'],
    },
    tokenmom: {
        name: 'tokenmom',
        label: 'Tokenmom',
        description: 'Matching order book relayer based in Korea.',
        logo_url: '/images/explore/tokenmom.png',
        theme_color: '#000000',
        url: 'https://www.tokenmom.com',
        keywords: ['tokens'],
    },
    lake_project: {
        name: 'lake_project',
        label: 'Lake Project',
        description: 'Open order book relayer with a focus on AI driven investing.',
        logo_url: '/images/explore/lake_project.png',
        theme_color: '#232428',
        url: 'https://trade.lakeproject.co/',
        keywords: ['tokens'],
    },
    ledgerdex: {
        name: 'ledgerdex',
        label: 'LedgerDex',
        description:
            'Open order book relayer that allows wallet-to-wallet trading and next generation token management.',
        logo_url: '/images/explore/ledgerdex.png',
        theme_color: '#51A362',
        url: 'https://app.ledgerdex.com/',
        keywords: ['tokens'],
        // TODO: check if they work per region and actually don't work on certain regions
        // instant: {
        //     orderSource: 'https://api-v2.ledgerdex.com/sra/v2/',
        //     availableAssetDatas: [
        //         '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        //     ],
        // },
    },
    fordex: {
        name: 'fordex',
        label: 'Fordex',
        description: 'Open order book relayer that enables stablecoin arbitrage.',
        logo_url: '/images/explore/fordex.png',
        theme_color: '#080424',
        url: 'https://alpha.fordex.co/',
        keywords: ['tokens'],
    },
    ethfinex: {
        name: 'ethfinex',
        label: 'Ethfinex',
        description: 'A hybrid relayer and exchange connected to Bitfinex.',
        logo_url: '/images/explore/ethfinex.png',
        theme_color: '#222431',
        url: 'https://trustless.ethfinex.com',
        keywords: ['tokens'],
    },
    the_ocean: {
        name: 'the_ocean',
        label: 'The Ocean',
        description: 'Security token and matching order book relayer.',
        logo_url: '/images/explore/the_ocean.png',
        theme_color: '#4375EA',
        url: 'https://app.theocean.trade/',
        keywords: ['tokens'],
    },
    fabrx: {
        name: 'fabrx',
        label: 'Fabrx',
        description: 'NFT and DeFi platform as a service.',
        logo_url: '/images/explore/fabrx.png',
        theme_color: '#2A536C',
        url: 'https://www.fabrx.io/',
        keywords: ['infrastructure'],
    },
    ambo: {
        name: 'ambo',
        label: 'Ambo',
        description: 'Mobile focused wallet and relayer acquired by MyCrypto.',
        logo_url: '/images/explore/ambo.png',
        theme_color: '#123A6F',
        url: 'https://ambo.io/downloads/',
        keywords: ['wallets'],
    },
    mobidex: {
        name: 'mobidex',
        label: 'Mobidex',
        description: 'Mobile first open order book relayer.',
        logo_url: '/images/explore/mobidex.png',
        theme_color: '#F4B44C',
        url: 'https://mobidex.io/',
        keywords: ['wallets'],
    },
    imtoken: {
        name: 'imtoken',
        label: 'ImToken',
        description: '100% mobile order book and one-click interface in the imToken app.',
        logo_url: '/images/explore/imtoken.png',
        theme_color: '#0791C0',
        url: 'https://token.im/',
        keywords: ['wallets'],
    },
    rex_relay: {
        name: 'rex_relay',
        label: 'Rex Relay',
        description: 'Relayer as a service: build a relayer with no coding required.',
        logo_url: '/images/explore/rex_relay.png',
        theme_color: '#1E1F20',
        url: 'https://www.rexrelay.com/',
        keywords: ['infrastructure'],
    },
    pixura: {
        name: 'pixura',
        label: 'Pixura',
        description: 'NFT marketplace as a service, powering art exchange SuperRare.',
        logo_url: '/images/explore/pixura.png',
        theme_color: '#1F5FF1',
        url: 'https://pixura.io/#about',
        keywords: ['infrastructure'],
    },
    zeroex_tracker: {
        name: 'zeroex_tracker',
        label: '0x Tracker',
        description: 'Data analytics for the 0x ecosystem.',
        logo_url: '/images/explore/zeroex_tracker.png',
        theme_color: '#0A0830',
        url: 'https://0xtracker.com/',
        keywords: ['infrastructure'],
    },
    gods_unchained: {
        name: 'gods_unchained',
        label: 'Gods Unchained',
        description: 'A next-generation trading card game pushing the boundaries of digital asset ownership.',
        logo_url: '/images/explore/gods_unchained.png',
        theme_color: '#000F0F',
        url: 'https://www.godsunchained.com',
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
        label: 'Tokens',
        name: 'tokens',
        filterType: ExploreFilterType.Keyword,
    },
    {
        label: 'Collectibles',
        name: 'collectibles',
        filterType: ExploreFilterType.Keyword,
    },
    {
        label: 'Infrastructure',
        name: 'infrastructure',
        filterType: ExploreFilterType.Keyword,
    },
    {
        label: 'Wallets',
        name: 'wallets',
        filterType: ExploreFilterType.Keyword,
    },
    {
        label: 'Prediction Markets',
        name: 'prediction_markets',
        filterType: ExploreFilterType.Keyword,
    },
];

export const ORDERINGS: { [s: string]: ExploreTilesOrderingMetadata } = {
    [ExploreTilesOrdering.Popular]: {
        label: 'Popular',
        ordering: ExploreTilesOrdering.Popular,
        type: ExploreTilesOrderingType.HardCodedByName,
        hardCoded: [
            'radar_relay',
            'veil',
            'ethfinex',
            'gods_unchained',
            'zeroex_tracker',
            'emoon',
            'paradex',
            'boxswap',
            'imtoken',
            'pixura',
            'lake_project',
            'openrelay',
            'the_ocean',
            'fordex',
            'bamboo_relay',
            'star_bit_ex',
            'ledgerdex',
            'tokenmom',
            'token_jar',
            'mobidex',
            'fabrx',
            'ambo',
            'rex_relay',
        ],
    },
    [ExploreTilesOrdering.RecentlyAdded]: {
        label: 'Recently Added',
        ordering: ExploreTilesOrdering.RecentlyAdded,
        type: ExploreTilesOrderingType.HardCodedByName,
        hardCoded: [
            'fabrx',
            'ambo',
            'fordex',
            'pixura',
            'tokenmom',
            'lake_project',
            'veil',
            'gods_unchained',
            'boxswap',
            'rex_relay',
            'emoon',
            'zeroex_tracker',
            'imtoken',
            'openrelay',
            'the_ocean',
            'token_jar',
            'ledgerdex',
            'bamboo_relay',
            'mobidex',
            'star_bit_ex',
            'ethfinex',
            'radar_relay',
            'paradex',
        ],
    },
    [ExploreTilesOrdering.Alphabetical]: {
        label: 'Alphabetical',
        ordering: ExploreTilesOrdering.Alphabetical,
        type: ExploreTilesOrderingType.DynamicBySortFunction,
        sort: (tiles: ExploreTile[]) => _.sortBy(tiles, t => t.name),
    },
};
