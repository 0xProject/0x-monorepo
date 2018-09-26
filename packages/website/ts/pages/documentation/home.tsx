import { colors, NestedSidebarMenu } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { DocsContentTopBar } from 'ts/components/documentation/docs_content_top_bar';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { TutorialButton } from 'ts/components/documentation/tutorial_button';
import { Container } from 'ts/components/ui/container';
import { Link } from 'ts/components/ui/link';
import { Text } from 'ts/components/ui/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Deco, Key, ScreenWidths, TutorialInfo, WebsitePaths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

interface Package {
    name: string;
    description: string;
    to: string;
    isExternal?: boolean;
    shouldOpenInNewTab?: boolean;
}

const THROTTLE_TIMEOUT = 100;
const TUTORIALS: TutorialInfo[] = [
    {
        title: Key.DevelopOnEthereum,
        iconUrl: '/images/developers/tutorials/develop_on_ethereum.svg',
        description: Key.DevelopOnEthereumDescription,
        location: `${WebsitePaths.Wiki}#Ethereum-Development`,
    },
    {
        title: Key.BuildARelayer,
        iconUrl: '/images/developers/tutorials/build_a_relayer.svg',
        description: Key.BuildARelayerDescription,
        location: `${WebsitePaths.Wiki}#Build-A-Relayer`,
    },
    {
        title: Key.OrderBasics,
        iconUrl: '/images/developers/tutorials/0x_order_basics.svg',
        description: Key.OrderBasicsDescription,
        location: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
    },
    {
        title: Key.UseSharedLiquidity,
        iconUrl: '/images/developers/tutorials/use_shared_liquidity.svg',
        description: Key.UseSharedLiquidityDescription,
        location: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
    },
];
const CATEGORY_TO_PACKAGES: { [category: string]: Package[] } = {
    '0x Protocol': [
        {
            name: '0x.js',
            description:
                'A library for interacting with the 0x protocol. It is a high level package which combines a number of smaller specific-purpose packages such as `order-utils` and `contract-wrappers`.',
            to: WebsitePaths.ZeroExJs,
        },
        {
            name: '0x starter project',
            description:
                'A Typescript starter project that will walk you through the basics of how to interact with 0x Protocol and trade of an SRA relayer',
            to: 'https://github.com/0xProject/0x-starter-project',
            isExternal: true,
            shouldOpenInNewTab: true,
        },
        {
            name: '@0xproject/connect',
            description:
                'An http & websocket client for interacting with relayers that have implemented the Standard Relayer API',
            to: WebsitePaths.Connect,
        },
        {
            name: '@0xproject/contract-wrappers',
            description:
                'Typescript/Javascript wrappers of the 0x protocol Ethereum smart contracts. Use this library to call methods on the 0x smart contracts, subscribe to contract events and to fetch information stored in the contracts.',
            to: WebsitePaths.ContractWrappers,
        },
        {
            name: '@0xproject/json-schemas',
            description:
                'A collection of 0x-related JSON-schemas (incl. SRA request/response schemas, 0x order message format schema, etc...)',
            to: WebsitePaths.JSONSchemas,
        },
        {
            name: '@0xproject/order-utils',
            description:
                'A set of utils for working with 0x orders. It includes utilities for creating, signing, validating 0x orders, encoding/decoding assetData and much more.',
            to: WebsitePaths.OrderUtils,
        },
        {
            name: '@0xproject/order-watcher',
            description:
                "A daemon that watches a set of 0x orders and emits events when an order's fillability has changed. Can be used by a relayer to prune their orderbook or by a trader to keep their view of the market up-to-date.",
            to: WebsitePaths.OrderWatcher,
        },
        {
            name: '@0xproject/sra-spec',
            description:
                'Contains the Standard Relayer API OpenAPI Spec. The package distributes both a javascript object version and a json version.',
            to: 'https://github.com/0xProject/0x-monorepo/tree/development/packages/sra-spec',
            isExternal: true,
            shouldOpenInNewTab: true,
        },
    ],
    Ethereum: [
        {
            name: 'abi-gen',
            description:
                "This package allows you to generate TypeScript contract wrappers from ABI files. It's heavily inspired by Geth abigen but takes a different approach. You can write your custom handlebars templates which will allow you to seamlessly integrate the generated code into your existing codebase with existing conventions.",
            to: 'https://github.com/0xProject/0x-monorepo/tree/development/packages/abi-gen',
            isExternal: true,
            shouldOpenInNewTab: true,
        },
        {
            name: 'ethereum-types',
            description:
                'A collection of Typescript types that are useful when working on an Ethereum-based project (e.g RawLog, Transaction, TxData, SolidityTypes, etc...).',
            to: WebsitePaths.EthereumTypes,
        },
        {
            name: '@0xproject/sol-compiler',
            description:
                'A wrapper around `solc-js` that adds smart re-compilation, ability to compile an entire project, Solidity version specific compilation, standard input description support and much more.',
            to: WebsitePaths.SolCompiler,
        },
        {
            name: '@0xproject/sol-cov',
            description:
                'A Solidity code coverage tool. Sol-cov uses transaction traces to figure out which lines of your code has been covered by your tests.',
            to: WebsitePaths.SolCov,
        },
        {
            name: '@0xproject/subproviders',
            description:
                'A collection of subproviders to use with `web3-provider-engine` (e.g subproviders for interfacing with Ledger hardware wallet, Mnemonic wallet, private key wallet, etc...)',
            to: WebsitePaths.Subproviders,
        },
        {
            name: '@0xproject/web3-wrapper',
            description:
                'A raw Ethereum JSON RPC client to simplify interfacing with Ethereum nodes. Also includes some convenience functions for awaiting transactions to be mined, converting between token units, etc...',
            to: WebsitePaths.Web3Wrapper,
        },
    ],
    'Community Maintained': [
        {
            name: '0x Event Extractor',
            description:
                'NodeJS worker originally built for 0x Tracker which extracts 0x fill events from the Ethereum blockchain and persists them to MongoDB. Support for both V1 and V2 of the 0x protocol is included with events tagged against the protocol version they belong to.',
            to: 'https://github.com/0xTracker/0x-event-extractor',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: '0x Tracker Worker',
            description:
                'NodeJS worker built for 0x Tracker which performs various ETL tasks related to the 0x protocol trading data and other information used on 0x Tracker.',
            to: 'https://github.com/0xTracker/0x-tracker-worker',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'Aquaduct',
            description:
                "ERCdex's Javascript SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            to: 'https://www.npmjs.com/package/aqueduct',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'Aquaduct Server SDK',
            description:
                'SDKs for automation using Aqueduct & ERC dEX. Aqueduct Server is a lightweight, portable and secure server that runs locally on any workstation. The server exposes a small number of foundational endpoints that enable working with the decentralized Aqueduct liquidity pool from any context or programming language.',
            to: 'https://github.com/ERCdEX/aqueduct-server-sdk',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'DDEX Node.js SDK',
            description: 'A node.js SDK for trading on the DDEX relayer',
            to: 'https://www.npmjs.com/package/ddex-api',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'ERCdex Widget',
            description: "The ERC dEX Trade Widget let's any website provide token liquidity to it's users",
            to: 'https://github.com/ERCdEX/widget',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'ERCdex Java SDK',
            description: "ERCdex's Java SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            to: 'https://github.com/ERCdEX/java',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'ERCdex Python SDK',
            description: "ERCdex's Python SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            to: 'https://github.com/ERCdEX/python',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'Massive',
            description:
                'A set of command-line tools for creating command-line scripts for interacting with the Ethereum blockchain in general, and 0x in particular',
            to: 'https://github.com/NoteGio/massive',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'OpenRelay',
            description: 'An open-source API-only Relayer written in Go',
            to: 'https://github.com/NoteGio/openrelay',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'OpenRelay.js',
            description:
                'A JavaScript Library for Interacting with OpenRelay.xyz and other 0x Standard Relayer API Implementations',
            to: 'https://github.com/NoteGio/openrelay.js',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'Radar SDK',
            description:
                'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
            to: 'https://github.com/RadarRelay/sdk',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'The Ocean Javascript SDK',
            description:
                'The Ocean provides a simple REST API, WebSockets API, and JavaScript library to help you integrate decentralized trading into your existing trading strategy.',
            to: 'https://github.com/TheOceanTrade/theoceanx-javascript',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'Tokenlon Javascript SDK',
            description: "Tokenlon SDK provides APIs for developers to trade of imToken's relayer",
            to: 'https://www.npmjs.com/package/tokenlon-sdk',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
        {
            name: 'AssetData decoder library in Java',
            description: 'A small library that implements the 0x order assetData encoding/decoding in Java',
            to: 'https://github.com/wildnothing/asset-data-decoder',
            shouldOpenInNewTab: true,
            isExternal: true,
        },
    ],
};

export interface HomeProps {
    location: Location;
    translate: Translate;
    screenWidth: ScreenWidths;
    dispatcher: Dispatcher;
}

export interface HomeState {}

export class Home extends React.Component<HomeProps, HomeState> {
    private readonly _throttledScreenWidthUpdate: () => void;
    constructor(props: HomeProps) {
        super(props);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
    }
    public componentWillUnmount(): void {
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
    }
    public render(): React.ReactNode {
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const mainContentPadding = isSmallScreen ? 0 : 50;
        return (
            <Container
                className="flex items-center"
                width="100%"
                background={`linear-gradient(to right, ${colors.grey100} 0%, ${colors.grey100} 50%, ${
                    colors.white
                } 50%, ${colors.white} 100%)`}
            >
                <DocumentTitle title="0x Docs Home" />
                <div className="flex mx-auto">
                    <Container
                        className="sm-hide xs-hide"
                        width={234}
                        paddingLeft={22}
                        paddingRight={22}
                        paddingTop={2}
                        backgroundColor={colors.grey100}
                    >
                        <DocsLogo height={36} containerStyle={{ paddingTop: 28 }} />
                    </Container>
                    <Container
                        width={isSmallScreen ? '100vw' : 716}
                        paddingBottom="100px"
                        paddingLeft={mainContentPadding}
                        paddingRight={mainContentPadding}
                        backgroundColor={colors.white}
                    >
                        <DocsContentTopBar location={this.props.location} translate={this.props.translate} />
                        <div>
                            {this._renderSectionTitle('Start building on 0x')}
                            <Container paddingTop="12px">
                                {this._renderSectionDescription(
                                    'Follow one of our "Getting started" guides to learn more about building ontop of 0x.',
                                )}
                                <Container marginTop="36px">
                                    {_.map(TUTORIALS, tutorialInfo => (
                                        <TutorialButton
                                            translate={this.props.translate}
                                            tutorialInfo={tutorialInfo}
                                            key={`tutorial-${tutorialInfo.title}`}
                                        />
                                    ))}
                                </Container>
                            </Container>
                        </div>
                        <div className="mt4">
                            {this._renderSectionTitle(this.props.translate.get(Key.LibrariesAndTools, Deco.CapWords))}
                            <Container paddingTop="12px">
                                {this._renderSectionDescription(
                                    'A list of available tools maintained by the 0x core developers and wider community for building on top of 0x Protocol and Ethereum',
                                )}
                                <Container marginTop="36px">
                                    {_.map(CATEGORY_TO_PACKAGES, (pkgs, category) =>
                                        this._renderPackageCategory(category, pkgs),
                                    )}
                                </Container>
                            </Container>
                        </div>
                    </Container>
                </div>
            </Container>
        );
    }
    private _renderPackageCategory(category: string, pkgs: Package[]): React.ReactNode {
        return (
            <div key={`category-${category}`}>
                <Text fontSize="18px">{category}</Text>
                <div>{_.map(pkgs, pkg => this._renderPackage(pkg))}</div>
            </div>
        );
    }
    private _renderPackage(pkg: Package): React.ReactNode {
        return (
            <div className="pb2" key={`package-${pkg.name}`}>
                <div
                    style={{
                        width: '100%',
                        height: 1,
                        backgroundColor: colors.grey300,
                        marginTop: 11,
                    }}
                />
                <div className="clearfix mt2 pt1">
                    <div className="col col-4">
                        <Link
                            to={pkg.to}
                            className="text-decoration-none"
                            style={{ color: colors.lightLinkBlue }}
                            isExternal={!!pkg.isExternal}
                            shouldOpenInNewTab={!!pkg.shouldOpenInNewTab}
                        >
                            <Text Tag="div" fontColor={colors.lightLinkBlue} fontWeight="bold">
                                {pkg.name}
                            </Text>
                        </Link>
                    </div>
                    <div className="col col-6">
                        <Text Tag="div" fontColor={colors.grey700}>
                            {pkg.description}
                        </Text>
                    </div>
                    <div className="col col-2 relative">
                        <Link
                            to={pkg.to}
                            className="text-decoration-none absolute"
                            style={{ right: 0, color: colors.lightLinkBlue }}
                            isExternal={!!pkg.isExternal}
                            shouldOpenInNewTab={!!pkg.shouldOpenInNewTab}
                        >
                            <div className="flex">
                                <div>{this.props.translate.get(Key.More, Deco.Cap)}</div>
                                <Container paddingTop="1px" paddingLeft="6px">
                                    <i
                                        className="zmdi zmdi-chevron-right bold"
                                        style={{ fontSize: 18, color: colors.lightLinkBlue }}
                                    />
                                </Container>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    private _renderSectionTitle(text: string): React.ReactNode {
        return (
            <Text fontColor="#333333" fontSize="30px" fontWeight="bold">
                {text}
            </Text>
        );
    }
    private _renderSectionDescription(text: string): React.ReactNode {
        return (
            <Text fontColor="#999999" fontSize="18px" fontFamily="Roboto Mono">
                {text}
            </Text>
        );
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
}
