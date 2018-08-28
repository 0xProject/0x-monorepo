import { DocsInfo, DocsMenu } from '@0xproject/react-docs';
import {
    colors,
    constants as sharedConstants,
    MenuSubsectionsBySection,
    NestedSidebarMenu,
    Styles,
} from '@0xproject/react-shared';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Blockchain } from 'ts/blockchain';
import { DrawerMenu } from 'ts/components/portal/drawer_menu';
import { ProviderDisplay } from 'ts/components/top_bar/provider_display';
import { TopBarMenuItem } from 'ts/components/top_bar/top_bar_menu_item';
import { Container } from 'ts/components/ui/container';
import { DropDown } from 'ts/components/ui/drop_down';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Deco, Key, ProviderType, WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export enum TopBarDisplayType {
    Default,
    Expanded,
}

export interface TopBarProps {
    userAddress?: string;
    networkId?: number;
    injectedProviderName?: string;
    providerType?: ProviderType;
    onToggleLedgerDialog?: () => void;
    blockchain?: Blockchain;
    dispatcher?: Dispatcher;
    blockchainIsLoaded: boolean;
    location: Location;
    translate: Translate;
    docsVersion?: string;
    availableDocVersions?: string[];
    menu?: DocsMenu;
    menuSubsectionsBySection?: MenuSubsectionsBySection;
    displayType?: TopBarDisplayType;
    docsInfo?: DocsInfo;
    style?: React.CSSProperties;
    isNightVersion?: boolean;
    onVersionSelected?: (semver: string) => void;
    sidebarHeader?: React.ReactNode;
    maxWidth?: number;
    paddingLeft?: number;
    paddingRight?: number;
}

interface TopBarState {
    isDrawerOpen: boolean;
}

const styles: Styles = {
    topBar: {
        backgroundColor: colors.white,
        width: '100%',
        position: 'relative',
        top: 0,
        paddingBottom: 1,
        zIndex: 1,
    },
    bottomBar: {
        boxShadow: 'rgba(0, 0, 0, 0.187647) 0px 1px 3px',
    },
    menuItem: {
        fontSize: 14,
        color: colors.darkestGrey,
        paddingTop: 6,
        paddingBottom: 6,
        cursor: 'pointer',
        fontWeight: 400,
    },
};

const DOC_WEBSITE_PATHS_TO_KEY = {
    [WebsitePaths.SolCov]: Key.SolCov,
    [WebsitePaths.SmartContracts]: Key.SmartContracts,
    [WebsitePaths.Web3Wrapper]: Key.Web3Wrapper,
    [WebsitePaths.SolCompiler]: Key.SolCompiler,
    [WebsitePaths.JSONSchemas]: Key.JsonSchemas,
    [WebsitePaths.Subproviders]: Key.Subproviders,
    [WebsitePaths.ContractWrappers]: Key.ContractWrappers,
    [WebsitePaths.Connect]: Key.Connect,
    [WebsitePaths.ZeroExJs]: Key.ZeroExJs,
    [WebsitePaths.OrderUtils]: Key.OrderUtils,
    [WebsitePaths.OrderWatcher]: Key.OrderWatcher,
};

const DEFAULT_HEIGHT = 68;
const EXPANDED_HEIGHT = 75;

export class TopBar extends React.Component<TopBarProps, TopBarState> {
    public static defaultProps: Partial<TopBarProps> = {
        displayType: TopBarDisplayType.Default,
        style: {},
        isNightVersion: false,
        paddingLeft: 20,
        paddingRight: 20,
    };
    public static heightForDisplayType(displayType: TopBarDisplayType): number {
        const result = displayType === TopBarDisplayType.Expanded ? EXPANDED_HEIGHT : DEFAULT_HEIGHT;
        return result + 1;
    }
    constructor(props: TopBarProps) {
        super(props);
        this.state = {
            isDrawerOpen: false,
        };
    }
    public componentWillReceiveProps(nextProps: TopBarProps): void {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.setState({
                isDrawerOpen: false,
            });
        }
    }
    public render(): React.ReactNode {
        const isNightVersion = this.props.isNightVersion;
        const isExpandedDisplayType = this.props.displayType === TopBarDisplayType.Expanded;
        const parentClassNames = !isExpandedDisplayType
            ? 'flex mx-auto items-center max-width-4'
            : 'flex mx-auto items-center';
        const height = isExpandedDisplayType ? EXPANDED_HEIGHT : DEFAULT_HEIGHT;
        const developerSectionMenuItems = [
            <Link key="subMenuItem-zeroEx" to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="0x.js" />
            </Link>,
            <Link key="subMenuItem-smartContracts" to={WebsitePaths.SmartContracts} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.SmartContract, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-0xconnect" to={WebsitePaths.Connect} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.Connect, Deco.CapWords)}
                />
            </Link>,
            <a
                key="subMenuItem-standard-relayer-api"
                target="_blank"
                className="text-decoration-none"
                href={constants.URL_STANDARD_RELAYER_API_GITHUB}
            >
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.StandardRelayerApi, Deco.CapWords)}
                />
            </a>,
            <Link key="subMenuItem-jsonSchema" to={WebsitePaths.JSONSchemas} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.JsonSchemas, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-subproviders" to={WebsitePaths.Subproviders} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.Subproviders, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-web3Wrapper" to={WebsitePaths.Web3Wrapper} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.Web3Wrapper, Deco.CapWords)}
                />
            </Link>,
            <Link
                key="subMenuItem-contractWrappers"
                to={WebsitePaths.ContractWrappers}
                className="text-decoration-none"
            >
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.ContractWrappers, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-orderUtils" to={WebsitePaths.OrderUtils} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.OrderUtils, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-orderWatcher" to={WebsitePaths.OrderWatcher} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.OrderWatcher, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-sol-compiler" to={WebsitePaths.SolCompiler} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.SolCompiler, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-sol-cov" to={WebsitePaths.SolCov} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.SolCov, Deco.CapWords)}
                />
            </Link>,
            <Link key="subMenuItem-ethereum-types" to={WebsitePaths.EthereumTypes} className="text-decoration-none">
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.EthereumTypes, Deco.CapWords)}
                />
            </Link>,
            <a
                key="subMenuItem-whitePaper"
                target="_blank"
                className="text-decoration-none"
                href={`${WebsitePaths.Whitepaper}`}
            >
                <MenuItem
                    style={{ fontSize: styles.menuItem.fontSize }}
                    primaryText={this.props.translate.get(Key.Whitepaper, Deco.CapWords)}
                />
            </a>,
            <a
                key="subMenuItem-github"
                target="_blank"
                className="text-decoration-none"
                href={constants.URL_GITHUB_ORG}
            >
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="GitHub" />
            </a>,
        ];
        const bottomBorderStyle = this._shouldDisplayBottomBar() ? styles.bottomBar : {};
        const fullWidthClasses = isExpandedDisplayType ? 'pr4' : '';
        const logoUrl = isNightVersion ? '/images/protocol_logo_white.png' : '/images/protocol_logo_black.png';
        const menuClasses = `col col-${
            isExpandedDisplayType ? '4' : '5'
        } ${fullWidthClasses} lg-pr0 md-pr2 sm-hide xs-hide`;
        const menuIconStyle = {
            fontSize: 25,
            color: isNightVersion ? 'white' : 'black',
            cursor: 'pointer',
        };
        const activeNode = (
            <div className="flex relative" style={{ color: menuIconStyle.color }}>
                <div style={{ paddingRight: 10 }}>{this.props.translate.get(Key.Developers, Deco.Cap)}</div>
                <div className="absolute" style={{ paddingLeft: 3, right: 3, top: -2 }}>
                    <i className="zmdi zmdi-caret-right" style={{ fontSize: 22 }} />
                </div>
            </div>
        );
        const popoverContent = <Menu style={{ color: colors.darkGrey }}>{developerSectionMenuItems}</Menu>;
        return (
            <div
                style={{ ...styles.topBar, ...bottomBorderStyle, ...this.props.style, ...{ height } }}
                className="pb1 flex items-center"
            >
                <Container
                    className={parentClassNames}
                    width="100%"
                    maxWidth={this.props.maxWidth}
                    paddingLeft={this.props.paddingLeft}
                    paddingRight={this.props.paddingRight}
                >
                    <Link to={`${WebsitePaths.Home}`} className="text-decoration-none">
                        <img src={logoUrl} height="30" />
                    </Link>
                    <div className="flex-auto" />
                    {!this._isViewingPortal() && (
                        <div className={menuClasses}>
                            <div className="flex items-center justify-between">
                                <DropDown
                                    activeNode={activeNode}
                                    popoverContent={popoverContent}
                                    anchorOrigin={{ horizontal: 'middle', vertical: 'bottom' }}
                                    targetOrigin={{ horizontal: 'middle', vertical: 'top' }}
                                    style={styles.menuItem}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.Wiki, Deco.Cap)}
                                    path={`${WebsitePaths.Wiki}`}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.Blog, Deco.Cap)}
                                    path={constants.URL_BLOG}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={true}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.About, Deco.Cap)}
                                    path={`${WebsitePaths.About}`}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.TradeCallToAction, Deco.Cap)}
                                    path={`${WebsitePaths.Portal}`}
                                    isPrimary={true}
                                    style={styles.menuItem}
                                    className={`${isExpandedDisplayType && 'md-hide'}`}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                            </div>
                        </div>
                    )}
                    {this._isViewingPortal() && (
                        <div className="sm-hide xs-hide">
                            <ProviderDisplay
                                dispatcher={this.props.dispatcher}
                                userAddress={this.props.userAddress}
                                networkId={this.props.networkId}
                                injectedProviderName={this.props.injectedProviderName}
                                providerType={this.props.providerType}
                                onToggleLedgerDialog={this.props.onToggleLedgerDialog}
                                blockchain={this.props.blockchain}
                                blockchainIsLoaded={this.props.blockchainIsLoaded}
                            />
                        </div>
                    )}
                    <div className={'md-hide lg-hide'}>
                        <div style={menuIconStyle}>
                            <i className="zmdi zmdi-menu" onClick={this._onMenuButtonClick.bind(this)} />
                        </div>
                    </div>
                </Container>
                {this._isViewingPortal() ? this._renderPortalDrawer() : this._renderDrawer()}
            </div>
        );
    }
    private _renderPortalDrawer(): React.ReactNode {
        return (
            <Drawer
                open={this.state.isDrawerOpen}
                docked={false}
                openSecondary={true}
                onRequestChange={this._onMenuButtonClick.bind(this)}
            >
                <DrawerMenu
                    selectedPath={this.props.location.pathname}
                    userAddress={this.props.userAddress}
                    injectedProviderName={this.props.injectedProviderName}
                    providerType={this.props.providerType}
                    blockchainIsLoaded={this.props.blockchainIsLoaded}
                    blockchain={this.props.blockchain}
                />
            </Drawer>
        );
    }
    private _renderDrawer(): React.ReactNode {
        return (
            <Drawer
                open={this.state.isDrawerOpen}
                docked={false}
                openSecondary={true}
                onRequestChange={this._onMenuButtonClick.bind(this)}
            >
                <div className="clearfix">
                    {this._renderDocsMenu()}
                    {this._renderWiki()}
                    <div className="pl1 py1 mt3" style={{ backgroundColor: colors.lightGrey }}>
                        {this.props.translate.get(Key.Website, Deco.Cap)}
                    </div>
                    <Link to={WebsitePaths.Home} className="text-decoration-none">
                        <MenuItem className="py2">{this.props.translate.get(Key.Home, Deco.Cap)}</MenuItem>
                    </Link>
                    <Link to={`${WebsitePaths.Wiki}`} className="text-decoration-none">
                        <MenuItem className="py2">{this.props.translate.get(Key.Wiki, Deco.Cap)}</MenuItem>
                    </Link>
                    {_.map(DOC_WEBSITE_PATHS_TO_KEY, (key, websitePath) => {
                        if (!this._doesUrlInclude(websitePath)) {
                            return (
                                <Link
                                    key={`drawer-menu-item-${websitePath}`}
                                    to={websitePath}
                                    className="text-decoration-none"
                                >
                                    <MenuItem className="py2">
                                        {this.props.translate.get(key, Deco.Cap)}{' '}
                                        {this.props.translate.get(Key.Docs, Deco.Cap)}
                                    </MenuItem>
                                </Link>
                            );
                        }
                        return null;
                    })}
                    {!this._isViewingPortal() && (
                        <Link to={`${WebsitePaths.Portal}`} className="text-decoration-none">
                            <MenuItem className="py2">
                                {this.props.translate.get(Key.PortalDApp, Deco.CapWords)}
                            </MenuItem>
                        </Link>
                    )}
                    <a className="text-decoration-none" target="_blank" href={`${WebsitePaths.Whitepaper}`}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Whitepaper, Deco.Cap)}</MenuItem>
                    </a>
                    <Link to={`${WebsitePaths.About}`} className="text-decoration-none">
                        <MenuItem className="py2">{this.props.translate.get(Key.About, Deco.Cap)}</MenuItem>
                    </Link>
                    <a className="text-decoration-none" target="_blank" href={constants.URL_BLOG}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Blog, Deco.Cap)}</MenuItem>
                    </a>
                    <Link to={`${WebsitePaths.FAQ}`} className="text-decoration-none">
                        <MenuItem className="py2" onClick={this._onMenuButtonClick.bind(this)}>
                            {this.props.translate.get(Key.Faq, Deco.Cap)}
                        </MenuItem>
                    </Link>
                </div>
            </Drawer>
        );
    }
    private _renderDocsMenu(): React.ReactNode {
        const isViewingDocsPage = _.some(DOC_WEBSITE_PATHS_TO_KEY, (_key, websitePath) => {
            return this._doesUrlInclude(websitePath);
        });
        // HACK: We need to make sure the SCROLL_CONTAINER is loaded before rendering the Sidebar
        // because the sidebar renders `react-scroll` links which depend on the scroll container already
        // being rendered.
        const documentationContainer = document.getElementById(sharedConstants.SCROLL_CONTAINER_ID);
        if (!isViewingDocsPage || _.isUndefined(this.props.menu) || _.isNull(documentationContainer)) {
            return undefined;
        }
        return (
            <div className="lg-hide md-hide">
                <NestedSidebarMenu
                    topLevelMenu={this.props.menu}
                    menuSubsectionsBySection={this.props.menuSubsectionsBySection}
                    sidebarHeader={this.props.sidebarHeader}
                    shouldDisplaySectionHeaders={false}
                    onMenuItemClick={this._onMenuButtonClick.bind(this)}
                    selectedVersion={this.props.docsVersion}
                    versions={this.props.availableDocVersions}
                    onVersionSelected={this.props.onVersionSelected}
                />
            </div>
        );
    }
    private _renderWiki(): React.ReactNode {
        if (!this._isViewingWiki()) {
            return undefined;
        }

        return (
            <div className="lg-hide md-hide">
                <NestedSidebarMenu
                    topLevelMenu={this.props.menuSubsectionsBySection}
                    menuSubsectionsBySection={this.props.menuSubsectionsBySection}
                    sidebarHeader={this.props.sidebarHeader}
                    shouldDisplaySectionHeaders={false}
                    onMenuItemClick={this._onMenuButtonClick.bind(this)}
                />
            </div>
        );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isDrawerOpen: !this.state.isDrawerOpen,
        });
    }
    private _isViewingPortal(): boolean {
        return _.includes(this.props.location.pathname, WebsitePaths.Portal);
    }
    private _isViewingDocs(): boolean {
        return _.includes(this.props.location.pathname, WebsitePaths.Docs);
    }
    private _isViewingFAQ(): boolean {
        return _.includes(this.props.location.pathname, WebsitePaths.FAQ);
    }
    private _doesUrlInclude(aPath: string): boolean {
        return _.includes(this.props.location.pathname, aPath);
    }
    private _isViewingWiki(): boolean {
        return _.includes(this.props.location.pathname, WebsitePaths.Wiki);
    }
    private _shouldDisplayBottomBar(): boolean {
        const isViewingDocsPage = _.some(DOC_WEBSITE_PATHS_TO_KEY, (_key, websitePath) => {
            return this._doesUrlInclude(websitePath);
        });
        return (
            isViewingDocsPage ||
            this._isViewingWiki() ||
            this._isViewingFAQ() ||
            this._isViewingDocs() ||
            this._isViewingPortal()
        );
    }
} // tslint:disable:max-file-line-count
