import { ALink, colors, Link } from '@0x/react-shared';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import * as React from 'react';
import { OverviewContent } from 'ts/components/documentation/overview_content';
import { NestedSidebarMenu } from 'ts/components/nested_sidebar_menu';
import { Button } from 'ts/components/ui/button';
import { DevelopersPage } from 'ts/pages/documentation/developers_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Categories, Deco, Key, Package, ScreenWidths, TutorialInfo, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

const TUTORIALS: TutorialInfo[] = [
    {
        iconUrl: '/images/developers/tutorials/develop_on_ethereum.svg',
        description: Key.DevelopOnEthereumDescription,
        link: {
            title: Key.DevelopOnEthereum,
            to: `${WebsitePaths.Wiki}#Ethereum-Development`,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/build_a_relayer.svg',
        description: Key.BuildARelayerDescription,
        link: {
            title: Key.BuildARelayer,
            to: `${WebsitePaths.Wiki}#Build-A-Relayer`,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/0x_order_basics.svg',
        description: Key.OrderBasicsDescription,
        link: {
            title: Key.OrderBasics,
            to: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/use_shared_liquidity.svg',
        description: Key.UseNetworkedLiquidityDescription,
        link: {
            title: Key.UseNetworkedLiquidity,
            to: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
        },
    },
];

const CATEGORY_TO_PACKAGES: ObjectMap<Package[]> = {
    [Categories.ZeroExProtocol]: [
        {
            description:
                'A library for interacting with the 0x protocol. It is a high level package which combines a number of smaller specific-purpose packages such as [order-utils](https://0xproject.com/docs/order-utils) and [contract-wrappers](https://0xproject.com/docs/contract-wrappers).',
            link: {
                title: '0x.js',
                to: WebsitePaths.ZeroExJs,
            },
        },
        {
            description:
                'A Typescript starter project that will walk you through the basics of how to interact with 0x Protocol and trade of an SRA relayer',
            link: {
                title: '0x starter project',
                to: 'https://github.com/0xProject/0x-starter-project',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'An http & websocket client for interacting with relayers that have implemented the [Standard Relayer API](https://github.com/0xProject/standard-relayer-api)',
            link: {
                title: '@0x/connect',
                to: WebsitePaths.Connect,
            },
        },
        {
            description:
                'Typescript/Javascript wrappers of the 0x protocol Ethereum smart contracts. Use this library to call methods on the 0x smart contracts, subscribe to contract events and to fetch information stored in contracts.',
            link: {
                title: '@0x/contract-wrappers',
                to: WebsitePaths.ContractWrappers,
            },
        },
        {
            description:
                'A collection of 0x-related JSON-schemas (incl. SRA request/response schemas, 0x order message format schema, etc...)',
            link: {
                title: '@0x/json-schemas',
                to: WebsitePaths.JSONSchemas,
            },
        },
        {
            description:
                'A set of utils for working with 0x orders. It includes utilities for creating, signing, validating 0x orders, encoding/decoding assetData and much more.',
            link: {
                title: '@0x/order-utils',
                to: WebsitePaths.OrderUtils,
            },
        },
        {
            description:
                "A daemon that watches a set of 0x orders and emits events when an order's fillability has changed. Can be used by a relayer to prune their orderbook or by a trader to keep their view of the market up-to-date.",
            link: {
                title: '@0x/order-watcher',
                to: WebsitePaths.OrderWatcher,
            },
        },
        {
            description:
                'Contains the Standard Relayer API OpenAPI Spec. The package distributes both a javascript object version and a json version.',
            link: {
                title: '@0x/sra-spec',
                to: 'https://github.com/0xProject/0x-monorepo/tree/development/packages/sra-spec',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'Convenience package for buying assets represented on the Ethereum blockchain using 0x. In its simplest form, the package helps in the usage of the [0x forwarder contract](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarder-specification.md), which allows users to execute [Wrapped Ether](https://weth.io/) based 0x orders without having to set allowances, wrap Ether or own ZRX, meaning they can buy tokens with Ether alone. Given some liquidity (0x signed orders), it helps estimate the Ether cost of buying a certain asset (giving a range) and then buying that asset.',
            link: {
                title: '@0x/asset-buyer',
                to: WebsitePaths.AssetBuyer,
            },
        },
    ],
    [Categories.Ethereum]: [
        {
            description:
                "This package allows you to generate TypeScript contract wrappers from ABI files. It's heavily inspired by Geth abigen but takes a different approach. You can write your custom handlebars templates which will allow you to seamlessly integrate the generated code into your existing codebase with existing conventions.",
            link: {
                title: 'abi-gen',
                to: 'https://github.com/0xProject/0x-monorepo/tree/development/packages/abi-gen',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A collection of Typescript types that are useful when working on an Ethereum-based project (e.g RawLog, Transaction, TxData, SolidityTypes, etc...).',
            link: {
                title: 'ethereum-types',
                to: WebsitePaths.EthereumTypes,
            },
        },
        {
            description:
                'A wrapper around [solc-js](https://github.com/ethereum/solc-js) that adds smart re-compilation, ability to compile an entire project, Solidity version specific compilation, standard input description support and much more.',
            link: {
                title: '@0x/sol-compiler',
                to: WebsitePaths.SolCompiler,
            },
        },
        {
            description:
                'A Solidity code coverage tool. Sol-cov uses transaction traces to figure out which lines of your code has been covered by your tests.',
            link: {
                title: '@0x/sol-cov',
                to: WebsitePaths.SolCov,
            },
        },
        {
            description:
                'A collection of subproviders to use with [web3-provider-engine](https://www.npmjs.com/package/web3-provider-engine) (e.g subproviders for interfacing with Ledger hardware wallet, Mnemonic wallet, private key wallet, etc...)',
            link: {
                title: '@0x/subproviders',
                to: WebsitePaths.Subproviders,
            },
        },
        {
            description:
                'A raw Ethereum JSON RPC client to simplify interfacing with Ethereum nodes. Also includes some convenience functions for awaiting transactions to be mined, converting between token units, etc...',
            link: {
                title: '@0x/web3-wrapper',
                to: WebsitePaths.Web3Wrapper,
            },
        },
    ],
    [Categories.CommunityMaintained]: [
        {
            description:
                'Node.js worker originally built for 0x Tracker which extracts 0x fill events from the Ethereum blockchain and persists them to MongoDB. Support for both V1 and V2 of the 0x protocol is included with events tagged against the protocol version they belong to.',
            link: {
                title: '0x Event Extractor',
                to: 'https://github.com/0xTracker/0x-event-extractor',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'Node.js worker built for 0x Tracker which performs various ETL tasks related to the 0x protocol trading data and other information used on 0x Tracker.',
            link: {
                title: '0x Tracker Worker',
                to: 'https://github.com/0xTracker/0x-tracker-worker',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                "ERCdEX's Javascript SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                title: 'Aquaduct',
                to: 'https://www.npmjs.com/package/aqueduct',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'SDKs for automation using Aqueduct & ERC dEX. Aqueduct Server is a lightweight, portable and secure server that runs locally on any workstation. The server exposes a small number of foundational endpoints that enable working with the decentralized Aqueduct liquidity pool from any context or programming language.',
            link: {
                title: 'Aquaduct Server SDK',
                to: 'https://github.com/ERCdEX/aqueduct-server-sdk',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'A node.js SDK for trading on the DDEX relayer',
            link: {
                to: 'https://www.npmjs.com/package/ddex-api',
                title: 'DDEX Node.js SDK',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: "The ERCdEX Trade Widget let's any website provide token liquidity to it's users",
            link: {
                to: 'https://github.com/ERCdEX/widget',
                title: 'ERCdEX Widget',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: "ERCdEX's Java SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                to: 'https://github.com/ERCdEX/java',
                title: 'ERCdEX Java SDK',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: "ERCdEX's Python SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                to: 'https://github.com/ERCdEX/python',
                title: 'ERCdEX Python SDK',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A set of command-line tools for creating command-line scripts for interacting with the Ethereum blockchain in general, and 0x in particular',
            link: {
                title: 'Massive',
                to: 'https://github.com/NoteGio/massive',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'An open-source API-only Relayer written in Go',
            link: {
                to: 'https://github.com/NoteGio/openrelay',
                title: 'OpenRelay',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A JavaScript Library for Interacting with OpenRelay.xyz and other 0x Standard Relayer API Implementations',
            link: {
                title: 'OpenRelay.js',
                to: 'https://github.com/NoteGio/openrelay.js',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
            link: {
                title: 'Radar SDK',
                to: 'https://github.com/RadarRelay/sdk',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'The Ocean provides a simple REST API, WebSockets API, and JavaScript library to help you integrate decentralized trading into your existing trading strategy.',
            link: {
                title: 'The Ocean Javascript SDK',
                to: 'https://github.com/TheOceanTrade/theoceanx-javascript',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: "Tokenlon SDK provides APIs for developers to trade of imToken's relayer",
            link: {
                to: 'https://www.npmjs.com/package/tokenlon-sdk',
                title: 'Tokenlon Javascript SDK',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'A small library that implements the 0x order assetData encoding/decoding in Java',
            link: {
                to: 'https://github.com/wildnothing/asset-data-decoder',
                title: 'AssetData decoder library in Java',
                shouldOpenInNewTab: true,
            },
        },
    ],
};

export interface DocsHomeProps {
    location: Location;
    translate: Translate;
    screenWidth: ScreenWidths;
    tutorials: TutorialInfo[];
    categoryToPackages: ObjectMap<Package[]>;
    dispatcher: Dispatcher;
}

export interface DocsHomeState {}

export class DocsHome extends React.Component<DocsHomeProps, DocsHomeState> {
    public render(): React.ReactNode {
        const sectionNameToLinks: ObjectMap<ALink[]> = {
            'Starter guides': _.map(TUTORIALS, tutorialInfo => {
                return {
                    ...tutorialInfo.link,
                    title: this.props.translate.get(tutorialInfo.link.title as Key, Deco.Cap),
                };
            }),
            [Categories.ZeroExProtocol]: _.map(CATEGORY_TO_PACKAGES[Categories.ZeroExProtocol], pkg => pkg.link),
            [Categories.Ethereum]: _.map(CATEGORY_TO_PACKAGES[Categories.Ethereum], pkg => pkg.link),
            [Categories.CommunityMaintained]: _.map(
                CATEGORY_TO_PACKAGES[Categories.CommunityMaintained],
                pkg => pkg.link,
            ),
        };
        const mainContent = (
            <OverviewContent
                translate={this.props.translate}
                tutorials={TUTORIALS}
                categoryToPackages={CATEGORY_TO_PACKAGES}
            />
        );
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const sidebar = (
            <NestedSidebarMenu
                sidebarHeader={isSmallScreen ? this._renderSidebarHeader() : undefined}
                sectionNameToLinks={sectionNameToLinks}
                shouldReformatMenuItemNames={false}
            />
        );
        return (
            <DevelopersPage
                mainContent={mainContent}
                sidebar={sidebar}
                location={this.props.location}
                screenWidth={this.props.screenWidth}
                translate={this.props.translate}
                dispatcher={this.props.dispatcher}
            />
        );
    }
    private _renderSidebarHeader(): React.ReactNode {
        const menuItems = _.map(constants.DEVELOPER_TOPBAR_LINKS, menuItemInfo => {
            return (
                <Link
                    key={`menu-item-${menuItemInfo.title}`}
                    to={menuItemInfo.to}
                    shouldOpenInNewTab={menuItemInfo.shouldOpenInNewTab}
                >
                    <Button
                        borderRadius="4px"
                        padding="0.4em 0.375em"
                        width="100%"
                        fontColor={colors.grey800}
                        fontSize="14px"
                        textAlign="left"
                    >
                        {this.props.translate.get(menuItemInfo.title as Key, Deco.Cap)}
                    </Button>
                </Link>
            );
        });
        return menuItems;
    }
}
