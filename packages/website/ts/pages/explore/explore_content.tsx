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
    dydx: {
        name: 'dydx',
        label: 'dYdX',
        description:
            "Trustless margin trading and lending platform that sources liquidity from 0x's open orderbook relayers.",
        logo_url: '/images/explore/dydx.svg',
        logo_max_width: '160px',
        theme_color: '#282C32',
        url: 'https://trade.dydx.exchange/',
        keywords: ['tokens'],
    },
    paradex: {
        name: 'paradex',
        label: 'Paradex',
        description: 'Matching order book relayer acquired by Coinbase, with a focus on stablecoins like DAI and USDC.',
        logo_url: '/images/explore/paradex.svg',
        theme_color: '#151628',
        url: 'https://paradex.io/',
        keywords: ['tokens'],
    },
    veil: {
        name: 'veil',
        label: 'Veil',
        description:
            'Platform for creating and trading in prediction markets on everything, built jointly on Augur and 0x.',
        logo_url: '/images/explore/veil.svg',
        theme_color: '#0204EB',
        url: 'https://veil.co/',
        keywords: ['prediction_markets'],
    },
    radar_relay: {
        name: 'radar_relay',
        label: 'Radar Relay',
        description:
            'Popular open order book relayer for trading ERC-20 tokens wallet to wallet, headquartered in Denver.',
        logo_url: '/images/explore/radar_relay.svg',
        theme_color: '#262626',
        url: 'https://app.radarrelay.com/',
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
        description: 'A marketplace for the buying and selling of ERC-20 game tokens and ERC-721 crypto collectibles.',
        logo_url: '/images/explore/emoon.svg',
        theme_color: '#3F89E7',
        url: 'https://www.emoon.io/',
        keywords: ['collectibles'],
    },
    openrelay: {
        name: 'openrelay',
        label: 'OpenRelay',
        description: 'Highly scalable, open source and customizable order book platform as a service for developers.',
        logo_url: '/images/explore/openrelay.svg',
        theme_color: '#163AAB',
        url: 'https://openrelay.xyz/',
        keywords: ['infrastructure'],
    },
    boxswap: {
        name: 'boxswap',
        label: 'BoxSwap',
        description: 'NFT relayer and wallet made for ERC-20 and ERC-721 assets in video game communities.',
        logo_url: '/images/explore/boxswap.svg',
        theme_color: '#FF99DF',
        url: 'https://boxswap.io/',
        keywords: ['collectibles'],
    },
    bamboo_relay: {
        name: 'bamboo_relay',
        label: 'Bamboo Relay',
        description:
            'Trade, lend and borrow tokens directly from your wallet; integrated with margin lending protocol bZx.',
        logo_url: '/images/explore/bamboo_relay.svg',
        theme_color: '#05183A',
        url: 'https://bamboorelay.com/',
        keywords: ['tokens'],
    },
    star_bit_ex: {
        name: 'star_bit_ex',
        label: 'Star Bit Ex',
        description: 'Taiwanese matching relayer focused on gamifying the buying of tokens, with a native token SBT.',
        logo_url: '/images/explore/star_bit_ex.svg',
        theme_color: '#192C55',
        url: 'https://www.starbitex.com/',
        keywords: ['tokens'],
    },
    token_jar: {
        name: 'token_jar',
        label: 'TokenJar',
        description: 'Matching order book relayer with free listing of many ERC-20 tokens and a huge token inventory.',
        logo_url: '/images/explore/tokenjar.svg',
        theme_color: '#000000',
        url: 'https://tokenjar.io/',
        keywords: ['tokens'],
    },
    tokenmom: {
        name: 'tokenmom',
        label: 'TokenMom',
        description: 'Matching order book relayer based in Korea with a highly developed referral system.',
        logo_url: '/images/explore/tokenmom.svg',
        theme_color: '#000000',
        url: 'https://www.tokenmom.com',
        keywords: ['tokens'],
    },
    lake_project: {
        name: 'lake_project',
        label: 'Lake Project',
        description: 'Open order book relayer headquartered in Toronto with a focus on AI wealth management.',
        logo_url: '/images/explore/lake_project.svg',
        theme_color: '#232428',
        url: 'https://trade.lakeproject.co/',
        keywords: ['tokens'],
    },
    ledgerdex: {
        name: 'ledgerdex',
        label: 'LedgerDex',
        description:
            'Open order book relayer that allows wallet to wallet trading and next generation token management.',
        logo_url: '/images/explore/ledgerdex.svg',
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
        label: 'ForDex',
        description: 'Open order book relayer that enables stablecoin arbitrage, supporting tokens like DAI and PAX.',
        logo_url: '/images/explore/fordex.svg',
        theme_color: '#080424',
        url: 'https://alpha.fordex.co/',
        keywords: ['tokens'],
    },
    ethfinex: {
        name: 'ethfinex',
        label: 'Ethfinex',
        description:
            'A hybrid relayer pulling volume from sister company and highly liquid centralized exchange Bitfinex.',
        logo_url: '/images/explore/ethfinex.svg',
        theme_color: '#222431',
        url: 'https://trustless.ethfinex.com',
        keywords: ['tokens'],
    },
    the_ocean: {
        name: 'the_ocean',
        label: 'The Ocean',
        description:
            'Matching order book relayer located in New York partnering with security token issuers like Harbor.',
        logo_url: '/images/explore/the_ocean.svg',
        theme_color: '#4375EA',
        url: 'https://app.theocean.trade/',
        keywords: ['tokens'],
    },
    fabrx: {
        name: 'fabrx',
        label: 'FabrX',
        description:
            'Platform as a service for developers, enabling them to easily integrate features from NFTs and DeFi.',
        logo_url: '/images/explore/fabrx.svg',
        theme_color: '#2A536C',
        url: 'https://www.fabrx.io/',
        keywords: ['infrastructure'],
    },
    ambo: {
        name: 'ambo',
        label: 'Ambo',
        description: 'Mobile app and wallet looking to serve as a portal to DeFi protocols, acquired by MyCrypto.',
        logo_url: '/images/explore/ambo.svg',
        theme_color: '#123A6F',
        url: 'https://ambo.io/downloads/',
        keywords: ['wallets'],
    },
    mobidex: {
        name: 'mobidex',
        label: 'Mobidex',
        description: 'Mobile application and open order book relayer based in San Francisco with an integrated wallet.',
        logo_url: '/images/explore/mobidex.svg',
        theme_color: '#F4B44C',
        url: 'https://mobidex.io/',
        keywords: ['wallets'],
    },
    imtoken: {
        name: 'imtoken',
        label: 'imToken',
        description: 'Chinese wallet and mobile application with a one-click trade interface for 0x orders.',
        logo_url: '/images/explore/imtoken.svg',
        theme_color: '#0791C0',
        url: 'https://token.im/',
        keywords: ['wallets'],
    },
    rex_relay: {
        name: 'rex_relay',
        label: 'Rex Relay',
        description: 'Relayer as a service made by enterprise company 8Base; build a relayer with no coding required.',
        logo_url: '/images/explore/rex_relay.svg',
        theme_color: '#1E1F20',
        url: 'https://www.rexrelay.com/',
        keywords: ['infrastructure'],
    },
    pixura: {
        name: 'pixura',
        label: 'Pixura',
        description:
            'NFT marketplace as a service, powering the exchange SuperRare, a place to collect scarce digital art.',
        logo_url: '/images/explore/pixura.svg',
        theme_color: '#1F5FF1',
        url: 'https://pixura.io/',
        keywords: ['infrastructure'],
    },
    zeroex_tracker: {
        name: 'zeroex_tracker',
        label: '0x Tracker',
        description: 'Data analytics for the 0x ecosystem, showing network volume, trades and news from key relayers.',
        logo_url: '/images/explore/zero_ex_tracker.svg',
        theme_color: '#0A0830',
        url: 'https://0xtracker.com/',
        keywords: ['infrastructure'],
    },
    gods_unchained: {
        name: 'gods_unchained',
        label: 'Gods Unchained',
        description: 'A next-generation trading card game pushing the boundaries of digital asset ownership.',
        logo_url: '/images/explore/gods_unchained.svg',
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
            'dydx',
            'radar_relay',
            'ethfinex',
            'paradex',
            'veil',
            'gods_unchained',
            'zeroex_tracker',
            'emoon',
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
            'dydx',
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
