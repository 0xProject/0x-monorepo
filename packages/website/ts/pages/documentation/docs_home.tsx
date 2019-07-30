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
    {
        iconUrl: '/images/developers/tutorials/integrate_0x_instant.svg',
        description: Key.Integrate0xInstantDescription,
        link: {
            title: Key.Integrate0xInstant,
            to: `${WebsitePaths.Wiki}#Get-Started-With-Instant`,
        },
    },
];

const CATEGORY_TO_PACKAGES: ObjectMap<Package[]> = {
    [Categories.ZeroExProtocolTypescript]: [
        {
            description:
                'A library for interacting with the 0x protocol. It is a high level package which combines a number of smaller specific-purpose packages such as [order-utils](https://0x.org/docs/order-utils) and [contract-wrappers](https://0x.org/docs/contract-wrappers).',
            link: {
                title: '0x.js',
                to: WebsitePaths.ZeroExJs,
            },
        },
        {
            description:
                'Launch a 0x relayer API backend in under a minute with Launch Kit. `0x-launch-kit-backend` is an open-source, free-to-use 0x relayer template that you can use as a starting point for your own project.',
            link: {
                title: '0x launch kit',
                to: 'https://github.com/0xProject/0x-launch-kit-backend',
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'Reference documentation for the 0x smart contracts. Helpful for dApp developer wanting to integrate 0x at the smart contract level.',
            link: {
                title: '0x smart contracts',
                to: WebsitePaths.SmartContracts,
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
                "A package to deploy the 0x protocol's system of smart contracts to the testnet of your choice",
            link: {
                title: '@0x/migrations',
                to: WebsitePaths.Migrations,
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
                title: '@0x/order-watcher [Deprecated]',
                to: WebsitePaths.OrderWatcher,
            },
        },
        {
            description:
                'A tiny utility library for getting known deployed contract addresses for a particular network.',
            link: {
                title: '@0x/contract-addresses',
                to: 'https://www.npmjs.com/package/@0x/contract-addresses',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'Smart contract compilation artifacts for the latest version of the 0x protocol.',
            link: {
                title: '@0x/contract-artifacts',
                to: 'https://www.npmjs.com/package/@0x/contract-artifacts',
                shouldOpenInNewTab: true,
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
        {
            description: 'Coonvenience package for discovering and performing swaps for any ERC20 Assets',
            link: {
                title: '@0x/asset-swapper',
                to: WebsitePaths.AssetSwapper,
            },
        },
    ],
    [Categories.ZeroExProtocolPython]: [
        {
            description:
                "A library for interacting with 0x orders. Generate an orderHash, sign an order, validate it's signature and more.",
            link: {
                title: '0x-order-utils',
                to: 'https://pypi.org/project/0x-order-utils/',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'A Standard Relayer API client',
            link: {
                title: '0x-sra-client',
                to: 'https://pypi.org/project/0x-sra-client/',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'Package containing the addresses at which the 0x smart contracts have been deployed',
            link: {
                title: '0x-contract-addresses',
                to: 'https://pypi.org/project/0x-contract-addresses/',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'Package containing the 0x smart contract compilation artifacts',
            link: {
                title: '0x-contract-artifacts',
                to: 'https://pypi.org/project/0x-contract-artifacts/',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: '0x JSON schemas for those developing on top of 0x protocol',
            link: {
                title: '0x-json-schemas',
                to: 'https://pypi.org/project/0x-json-schemas/',
                shouldOpenInNewTab: true,
            },
        },
        {
            description: 'Demo project showing how to interact with the 0x smart contracts using Python',
            link: {
                title: '0x-contract-demo',
                to: 'https://github.com/0xProject/0x-monorepo/blob/development/python-packages/contract_demo/README.md',
                shouldOpenInNewTab: true,
            },
        },
    ],
    [Categories.Ethereum]: [
        {
            description:
                'A collection of subproviders to use with [web3-provider-engine](https://www.npmjs.com/package/web3-provider-engine) (e.g subproviders for interfacing with Ledger hardware wallet, Mnemonic wallet, private key wallet, etc...)',
            link: {
                title: '@0x/subproviders',
                to: WebsitePaths.Subproviders,
            },
        },
    ],
    [Categories.CommunityMaintained]: [
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
        {
            description:
                'Node.js worker originally built for 0x Tracker which extracts 0x fill events from the Ethereum blockchain and persists them to MongoDB. Support for both V1 and V2 of the 0x protocol is included with events tagged against the protocol version they belong to.',
            link: {
                title: '0x Event Extractor',
                to: 'https://github.com/0xTracker/0x-event-extractor',
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
            [Categories.ZeroExProtocolTypescript]: _.map(
                CATEGORY_TO_PACKAGES[Categories.ZeroExProtocolTypescript],
                pkg => pkg.link,
            ),
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
                screenWidth={this.props.screenWidth}
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
} // tslint:disable:max-file-line-count
