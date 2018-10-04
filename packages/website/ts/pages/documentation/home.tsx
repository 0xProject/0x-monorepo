import {
    ALink,
    colors,
    constants as sharedConstants,
    Link,
    LinkType,
    MarkdownLinkBlock,
    NestedSidebarMenu,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import * as ReactMarkdown from 'react-markdown';
import { Element as ScrollElement } from 'react-scroll';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { DocsTopBar } from 'ts/components/documentation/docs_top_bar';
import { TutorialButton } from 'ts/components/documentation/tutorial_button';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Deco, Key, ScreenWidths, TutorialInfo, WebsitePaths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const THROTTLE_TIMEOUT = 100;
const TOP_BAR_HEIGHT = 80;
const SCROLLER_WIDTH = 4;
const TUTORIALS: TutorialInfo[] = [
    {
        iconUrl: '/images/developers/tutorials/develop_on_ethereum.svg',
        description: Key.DevelopOnEthereumDescription,
        link: {
            title: Key.DevelopOnEthereum,
            to: `${WebsitePaths.Wiki}#Ethereum-Development`,
            shouldOpenInNewTab: true,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/build_a_relayer.svg',
        description: Key.BuildARelayerDescription,
        link: {
            title: Key.BuildARelayer,
            to: `${WebsitePaths.Wiki}#Build-A-Relayer`,
            shouldOpenInNewTab: true,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/0x_order_basics.svg',
        description: Key.OrderBasicsDescription,
        link: {
            title: Key.OrderBasics,
            to: `${WebsitePaths.Wiki}#Create,-Validate,-Fill-Order`,
            shouldOpenInNewTab: true,
        },
    },
    {
        iconUrl: '/images/developers/tutorials/use_shared_liquidity.svg',
        description: Key.UseSharedLiquidityDescription,
        link: {
            title: Key.UseSharedLiquidity,
            to: `${WebsitePaths.Wiki}#Find,-Submit,-Fill-Order-From-Relayer`,
            shouldOpenInNewTab: true,
        },
    },
];
enum Categories {
    ZeroExProtocol = '0x Protocol',
    Ethereum = 'Ethereum',
    CommunityMaintained = 'Community Maintained',
}
// TODO(fabio): Move this to it's own file
const CATEGORY_TO_PACKAGES: { [category: string]: Package[] } = {
    [Categories.ZeroExProtocol]: [
        {
            description:
                'A library for interacting with the 0x protocol. It is a high level package which combines a number of smaller specific-purpose packages such as [order-utils](https://0xproject.com/docs/order-utils) and [contract-wrappers](https://0xproject.com/docs/contract-wrappers).',
            link: {
                title: '0x.js',
                to: WebsitePaths.ZeroExJs,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A Typescript starter project that will walk you through the basics of how to interact with 0x Protocol and trade of an SRA relayer',
            link: {
                title: '0x starter project',
                to: 'https://github.com/0xProject/0x-starter-project',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'An http & websocket client for interacting with relayers that have implemented the [Standard Relayer API](https://github.com/0xProject/standard-relayer-api)',
            link: {
                title: '@0xproject/connect',
                to: WebsitePaths.Connect,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'Typescript/Javascript wrappers of the 0x protocol Ethereum smart contracts. Use this library to call methods on the 0x smart contracts, subscribe to contract events and to fetch information stored in contracts.',
            link: {
                title: '@0xproject/contract-wrappers',
                to: WebsitePaths.ContractWrappers,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A collection of 0x-related JSON-schemas (incl. SRA request/response schemas, 0x order message format schema, etc...)',
            link: {
                title: '@0xproject/json-schemas',
                to: WebsitePaths.JSONSchemas,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A set of utils for working with 0x orders. It includes utilities for creating, signing, validating 0x orders, encoding/decoding assetData and much more.',
            link: {
                title: '@0xproject/order-utils',
                to: WebsitePaths.OrderUtils,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                "A daemon that watches a set of 0x orders and emits events when an order's fillability has changed. Can be used by a relayer to prune their orderbook or by a trader to keep their view of the market up-to-date.",
            link: {
                title: '@0xproject/order-watcher',
                to: WebsitePaths.OrderWatcher,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'Contains the Standard Relayer API OpenAPI Spec. The package distributes both a javascript object version and a json version.',
            link: {
                title: '@0xproject/sra-spec',
                to: 'https://github.com/0xProject/0x-monorepo/tree/development/packages/sra-spec',
                shouldOpenInNewTab: true,
                type: LinkType.External,
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
                type: LinkType.External,
            },
        },
        {
            description:
                'A collection of Typescript types that are useful when working on an Ethereum-based project (e.g RawLog, Transaction, TxData, SolidityTypes, etc...).',
            link: {
                title: 'ethereum-types',
                to: WebsitePaths.EthereumTypes,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A wrapper around [solc-js](https://github.com/ethereum/solc-js) that adds smart re-compilation, ability to compile an entire project, Solidity version specific compilation, standard input description support and much more.',
            link: {
                title: '@0xproject/sol-compiler',
                to: WebsitePaths.SolCompiler,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A Solidity code coverage tool. Sol-cov uses transaction traces to figure out which lines of your code has been covered by your tests.',
            link: {
                title: '@0xproject/sol-cov',
                to: WebsitePaths.SolCov,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A collection of subproviders to use with [web3-provider-engine](https://www.npmjs.com/package/web3-provider-engine) (e.g subproviders for interfacing with Ledger hardware wallet, Mnemonic wallet, private key wallet, etc...)',
            link: {
                title: '@0xproject/subproviders',
                to: WebsitePaths.Subproviders,
                shouldOpenInNewTab: true,
            },
        },
        {
            description:
                'A raw Ethereum JSON RPC client to simplify interfacing with Ethereum nodes. Also includes some convenience functions for awaiting transactions to be mined, converting between token units, etc...',
            link: {
                title: '@0xproject/web3-wrapper',
                to: WebsitePaths.Web3Wrapper,
                shouldOpenInNewTab: true,
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
                type: LinkType.External,
            },
        },
        {
            description:
                'Node.js worker built for 0x Tracker which performs various ETL tasks related to the 0x protocol trading data and other information used on 0x Tracker.',
            link: {
                title: '0x Tracker Worker',
                to: 'https://github.com/0xTracker/0x-tracker-worker',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                "ERCdex's Javascript SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                title: 'Aquaduct',
                to: 'https://www.npmjs.com/package/aqueduct',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'SDKs for automation using Aqueduct & ERC dEX. Aqueduct Server is a lightweight, portable and secure server that runs locally on any workstation. The server exposes a small number of foundational endpoints that enable working with the decentralized Aqueduct liquidity pool from any context or programming language.',
            link: {
                title: 'Aquaduct Server SDK',
                to: 'https://github.com/ERCdEX/aqueduct-server-sdk',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: 'A node.js SDK for trading on the DDEX relayer',
            link: {
                to: 'https://www.npmjs.com/package/ddex-api',
                title: 'DDEX Node.js SDK',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: "The ERC dEX Trade Widget let's any website provide token liquidity to it's users",
            link: {
                to: 'https://github.com/ERCdEX/widget',
                title: 'ERCdex Widget',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: "ERCdex's Java SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                to: 'https://github.com/ERCdEX/java',
                title: 'ERCdex Java SDK',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: "ERCdex's Python SDK for trading on their relayer, as well as other Aquaduct partner relayers",
            link: {
                to: 'https://github.com/ERCdEX/python',
                title: 'ERCdex Python SDK',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'A set of command-line tools for creating command-line scripts for interacting with the Ethereum blockchain in general, and 0x in particular',
            link: {
                title: 'Massive',
                to: 'https://github.com/NoteGio/massive',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: 'An open-source API-only Relayer written in Go',
            link: {
                to: 'https://github.com/NoteGio/openrelay',
                title: 'OpenRelay',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'A JavaScript Library for Interacting with OpenRelay.xyz and other 0x Standard Relayer API Implementations',
            link: {
                title: 'OpenRelay.js',
                to: 'https://github.com/NoteGio/openrelay.js',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
            link: {
                title: 'Radar SDK',
                to: 'https://github.com/RadarRelay/sdk',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description:
                'The Ocean provides a simple REST API, WebSockets API, and JavaScript library to help you integrate decentralized trading into your existing trading strategy.',
            link: {
                title: 'The Ocean Javascript SDK',
                to: 'https://github.com/TheOceanTrade/theoceanx-javascript',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: "Tokenlon SDK provides APIs for developers to trade of imToken's relayer",
            link: {
                to: 'https://www.npmjs.com/package/tokenlon-sdk',
                title: 'Tokenlon Javascript SDK',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
        {
            description: 'A small library that implements the 0x order assetData encoding/decoding in Java',
            link: {
                to: 'https://github.com/wildnothing/asset-data-decoder',
                title: 'AssetData decoder library in Java',
                shouldOpenInNewTab: true,
                type: LinkType.External,
            },
        },
    ],
};

interface Package {
    description: string;
    link: ALink;
}

export interface HomeProps {
    location: Location;
    translate: Translate;
    screenWidth: ScreenWidths;
    dispatcher: Dispatcher;
}

export interface HomeState {
    isHoveringSidebar: boolean;
    isHoveringMainContent: boolean;
    isSidebarScrolling: boolean;
}

export class Home extends React.Component<HomeProps, HomeState> {
    private readonly _throttledScreenWidthUpdate: () => void;
    private readonly _throttledSidebarScrolling: () => void;
    private _sidebarScrollClearingInterval: number;
    constructor(props: HomeProps) {
        super(props);
        this._throttledScreenWidthUpdate = _.throttle(this._updateScreenWidth.bind(this), THROTTLE_TIMEOUT);
        this._throttledSidebarScrolling = _.throttle(this._onSidebarScroll.bind(this), THROTTLE_TIMEOUT);
        this.state = {
            isHoveringSidebar: false,
            isHoveringMainContent: false,
            isSidebarScrolling: false,
        };
    }
    public componentDidMount(): void {
        window.addEventListener('resize', this._throttledScreenWidthUpdate);
        window.scrollTo(0, 0);
        this._sidebarScrollClearingInterval = window.setInterval(() => {
            this.setState({
                isSidebarScrolling: false,
            });
        }, 1000);
    }
    public componentWillUnmount(): void {
        window.removeEventListener('resize', this._throttledScreenWidthUpdate);
        window.clearInterval(this._sidebarScrollClearingInterval);
    }
    public render(): React.ReactNode {
        const scrollableContainerStyles: React.CSSProperties = {
            position: 'absolute',
            top: 80,
            left: 0,
            bottom: 0,
            right: 0,
            overflowX: 'hidden',
            overflowY: 'scroll',
            minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
            WebkitOverflowScrolling: 'touch',
        };
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const mainContentPadding = isSmallScreen ? 20 : 50;
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
        return (
            <Container
                className="flex items-center overflow-hidden"
                width="100%"
                background={`linear-gradient(to right, ${colors.grey100} 0%, ${colors.grey100} 50%, ${
                    colors.white
                } 50%, ${colors.white} 100%)`}
            >
                <DocumentTitle title="0x Docs Home" />
                <Container className="flex mx-auto" height="100vh">
                    <Container
                        className="sm-hide xs-hide relative"
                        width={234}
                        paddingLeft={22}
                        paddingRight={22}
                        paddingTop={0}
                        backgroundColor={colors.grey100}
                    >
                        <Container
                            borderBottom={this.state.isSidebarScrolling ? `1px solid ${colors.grey300}` : 'none'}
                        >
                            <DocsLogo height={36} containerStyle={{ paddingTop: 30, paddingBottom: 10 }} />
                        </Container>
                        <div
                            style={{
                                ...scrollableContainerStyles,
                                paddingTop: 35,
                                overflow: this.state.isHoveringSidebar ? 'auto' : 'hidden',
                            }}
                            onMouseEnter={this._onSidebarHover.bind(this, true)}
                            onMouseLeave={this._onSidebarHover.bind(this, false)}
                            onWheel={this._throttledSidebarScrolling}
                        >
                            <Container paddingLeft="22px" paddingRight="22px" paddingBottom="100px">
                                <NestedSidebarMenu
                                    sectionNameToLinks={sectionNameToLinks}
                                    shouldReformatMenuItemNames={false}
                                />
                            </Container>
                        </div>
                    </Container>
                    <Container
                        className="relative"
                        width={isSmallScreen ? '100vw' : 716}
                        paddingBottom="100px"
                        backgroundColor={colors.white}
                    >
                        <Container paddingLeft={mainContentPadding} paddingRight={mainContentPadding}>
                            <DocsTopBar
                                location={this.props.location}
                                translate={this.props.translate}
                                sectionNameToLinks={sectionNameToLinks}
                            />
                        </Container>
                        <div
                            id={sharedConstants.SCROLL_CONTAINER_ID}
                            className="absolute"
                            style={{
                                ...scrollableContainerStyles,
                                paddingTop: 30,
                                paddingLeft: mainContentPadding,
                                paddingRight: this.state.isHoveringMainContent
                                    ? mainContentPadding - SCROLLER_WIDTH
                                    : mainContentPadding,
                                overflow: this.state.isHoveringMainContent ? 'auto' : 'hidden',
                            }}
                            onMouseEnter={this._onMainContentHover.bind(this, true)}
                            onMouseOver={this._onMainContentHover.bind(this, true)}
                            onMouseLeave={this._onMainContentHover.bind(this, false)}
                        >
                            <Container>
                                {this._renderSectionTitle(this.props.translate.get(Key.StartBuildOn0x, Deco.Cap))}
                                <Container paddingTop="12px">
                                    {this._renderSectionDescription(
                                        this.props.translate.get(Key.StartBuildOn0xDescription, Deco.Cap),
                                    )}
                                    <Container marginTop="36px">
                                        {_.map(TUTORIALS, tutorialInfo => (
                                            <ScrollElement
                                                name={sharedUtils.getIdFromName(
                                                    this.props.translate.get(tutorialInfo.link.title as Key, Deco.Cap),
                                                )}
                                                key={`tutorial-${tutorialInfo.link.title}`}
                                            >
                                                <TutorialButton
                                                    translate={this.props.translate}
                                                    tutorialInfo={tutorialInfo}
                                                />
                                            </ScrollElement>
                                        ))}
                                    </Container>
                                </Container>
                                <Container marginTop="32px" paddingBottom="100px">
                                    {this._renderSectionTitle(
                                        this.props.translate.get(Key.LibrariesAndTools, Deco.CapWords),
                                    )}
                                    <Container paddingTop="12px">
                                        {this._renderSectionDescription(
                                            this.props.translate.get(Key.LibrariesAndToolsDescription, Deco.Cap),
                                        )}
                                        <Container marginTop="36px">
                                            {_.map(CATEGORY_TO_PACKAGES, (pkgs, category) =>
                                                this._renderPackageCategory(category, pkgs),
                                            )}
                                        </Container>
                                    </Container>
                                </Container>
                            </Container>
                        </div>
                    </Container>
                </Container>
            </Container>
        );
    }
    private _renderPackageCategory(category: string, pkgs: Package[]): React.ReactNode {
        return (
            <Container key={`category-${category}`}>
                <Text fontSize="18px">{category}</Text>
                <Container>{_.map(pkgs, pkg => this._renderPackage(pkg))}</Container>
            </Container>
        );
    }
    private _renderPackage(pkg: Package): React.ReactNode {
        const id = sharedUtils.getIdFromName(pkg.link.title);
        return (
            <ScrollElement name={id} key={`package-${pkg.link.title}`}>
                <Container className="pb2">
                    <Container width="100%" height="1px" backgroundColor={colors.grey300} marginTop="11px" />
                    <Container className="clearfix mt2 pt1">
                        <Container className="md-col lg-col md-col-4 lg-col-4">
                            <Link
                                to={pkg.link.to}
                                style={{ color: colors.lightLinkBlue }}
                                type={pkg.link.type}
                                shouldOpenInNewTab={!!pkg.link.shouldOpenInNewTab}
                            >
                                <Text Tag="div" fontColor={colors.lightLinkBlue} fontWeight="bold">
                                    {pkg.link.title}
                                </Text>
                            </Link>
                        </Container>
                        <Container className="md-col lg-col md-col-6 lg-col-6 sm-py2">
                            <Text fontColor={colors.grey700}>
                                <ReactMarkdown
                                    source={pkg.description}
                                    renderers={{
                                        link: MarkdownLinkBlock,
                                    }}
                                />
                            </Text>
                        </Container>
                        <Container className="md-col lg-col md-col-2 lg-col-2 sm-pb2 relative">
                            <Link
                                to={pkg.link.to}
                                className="absolute"
                                style={{ right: 0, color: colors.lightLinkBlue }}
                                type={pkg.link.type}
                                shouldOpenInNewTab={!!pkg.link.shouldOpenInNewTab}
                            >
                                <Container className="flex">
                                    <Container>{this.props.translate.get(Key.More, Deco.Cap)}</Container>
                                    <Container paddingTop="1px" paddingLeft="6px">
                                        <i
                                            className="zmdi zmdi-chevron-right bold"
                                            style={{ fontSize: 18, color: colors.lightLinkBlue }}
                                        />
                                    </Container>
                                </Container>
                            </Link>
                        </Container>
                    </Container>
                </Container>
            </ScrollElement>
        );
    }
    private _renderSectionTitle(text: string): React.ReactNode {
        return (
            <Text fontColor={colors.projectsGrey} fontSize="30px" fontWeight="bold">
                {text}
            </Text>
        );
    }
    private _renderSectionDescription(text: string): React.ReactNode {
        return (
            <Text fontColor={colors.linkSectionGrey} fontSize="16px" fontFamily="Roboto Mono">
                {text}
            </Text>
        );
    }
    private _onSidebarHover(isHovering: boolean, _event: React.FormEvent<HTMLInputElement>): void {
        if (isHovering !== this.state.isHoveringSidebar) {
            this.setState({
                isHoveringSidebar: isHovering,
            });
        }
    }
    private _onMainContentHover(isHovering: boolean, _event: React.FormEvent<HTMLInputElement>): void {
        if (isHovering !== this.state.isHoveringMainContent) {
            this.setState({
                isHoveringMainContent: isHovering,
            });
        }
    }
    private _onSidebarScroll(_event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            isSidebarScrolling: true,
        });
    }
    private _updateScreenWidth(): void {
        const newScreenWidth = utils.getScreenWidth();
        this.props.dispatcher.updateScreenWidth(newScreenWidth);
    }
} // tslint:disable:max-file-line-count
