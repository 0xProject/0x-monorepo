import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Link } from 'react-router-dom';
import ReactTooltip = require('react-tooltip');
import { Blockchain } from 'ts/blockchain';
import { PortalMenu } from 'ts/components/portal_menu';
import { ProviderDisplay } from 'ts/components/top_bar/provider_display';
import { TopBarMenuItem } from 'ts/components/top_bar/top_bar_menu_item';
import { DropDown } from 'ts/components/ui/drop_down';
import { Identicon } from 'ts/components/ui/identicon';
import { DocsInfo } from 'ts/pages/documentation/docs_info';
import { NestedSidebarMenu } from 'ts/pages/shared/nested_sidebar_menu';
import { Dispatcher } from 'ts/redux/dispatcher';
import { DocsMenu, MenuSubsectionsBySection, ProviderType, Styles, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';

interface TopBarProps {
    userAddress?: string;
    networkId?: number;
    injectedProviderName?: string;
    providerType?: ProviderType;
    onToggleLedgerDialog?: () => void;
    blockchain?: Blockchain;
    dispatcher?: Dispatcher;
    blockchainIsLoaded: boolean;
    location: Location;
    docsVersion?: string;
    availableDocVersions?: string[];
    menu?: DocsMenu;
    menuSubsectionsBySection?: MenuSubsectionsBySection;
    shouldFullWidth?: boolean;
    docsInfo?: DocsInfo;
    style?: React.CSSProperties;
    isNightVersion?: boolean;
}

interface TopBarState {
    isDrawerOpen: boolean;
}

const styles: Styles = {
    address: {
        marginRight: 12,
        overflow: 'hidden',
        paddingTop: 4,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: 70,
    },
    topBar: {
        backgroundcolor: colors.white,
        height: 59,
        width: '100%',
        position: 'relative',
        top: 0,
        zIndex: 1100,
        paddingBottom: 1,
    },
    bottomBar: {
        boxShadow: 'rgba(0, 0, 0, 0.187647) 0px 1px 3px',
    },
    menuItem: {
        fontSize: 14,
        color: colors.darkestGrey,
        paddingTop: 6,
        paddingBottom: 6,
        marginTop: 17,
        cursor: 'pointer',
        fontWeight: 400,
    },
};

export class TopBar extends React.Component<TopBarProps, TopBarState> {
    public static defaultProps: Partial<TopBarProps> = {
        shouldFullWidth: false,
        style: {},
        isNightVersion: false,
    };
    constructor(props: TopBarProps) {
        super(props);
        this.state = {
            isDrawerOpen: false,
        };
    }
    public render() {
        const isNightVersion = this.props.isNightVersion;
        const isFullWidthPage = this.props.shouldFullWidth;
        const parentClassNames = `flex mx-auto ${isFullWidthPage ? 'pl2' : 'max-width-4'}`;
        const developerSectionMenuItems = [
            <Link key="subMenuItem-zeroEx" to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="0x.js" />
            </Link>,
            <Link key="subMenuItem-smartContracts" to={WebsitePaths.SmartContracts} className="text-decoration-none">
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="Smart Contracts" />
            </Link>,
            <Link key="subMenuItem-0xconnect" to={WebsitePaths.Connect} className="text-decoration-none">
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="0x Connect" />
            </Link>,
            <a
                key="subMenuItem-standard-relayer-api"
                target="_blank"
                className="text-decoration-none"
                href={constants.URL_STANDARD_RELAYER_API_GITHUB}
            >
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="Standard Relayer API" />
            </a>,
            <a
                key="subMenuItem-github"
                target="_blank"
                className="text-decoration-none"
                href={constants.URL_GITHUB_ORG}
            >
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="GitHub" />
            </a>,
            <a
                key="subMenuItem-whitePaper"
                target="_blank"
                className="text-decoration-none"
                href={`${WebsitePaths.Whitepaper}`}
            >
                <MenuItem style={{ fontSize: styles.menuItem.fontSize }} primaryText="Whitepaper" />
            </a>,
        ];
        const bottomBorderStyle = this._shouldDisplayBottomBar() ? styles.bottomBar : {};
        const fullWidthClasses = isFullWidthPage ? 'pr4' : '';
        const logoUrl = isNightVersion ? '/images/protocol_logo_white.png' : '/images/protocol_logo_black.png';
        const menuClasses = `col col-${isFullWidthPage ? '4' : '5'} ${fullWidthClasses} lg-pr0 md-pr2 sm-hide xs-hide`;
        const menuIconStyle = {
            fontSize: 25,
            color: isNightVersion ? 'white' : 'black',
            cursor: 'pointer',
            paddingTop: 16,
        };
        const hoverActiveNode = (
            <div className="flex relative" style={{ color: menuIconStyle.color }}>
                <div style={{ paddingRight: 10 }}>Developers</div>
                <div className="absolute" style={{ paddingLeft: 3, right: 3, top: -2 }}>
                    <i className="zmdi zmdi-caret-right" style={{ fontSize: 22 }} />
                </div>
            </div>
        );
        const popoverContent = <Menu style={{ color: colors.darkGrey }}>{developerSectionMenuItems}</Menu>;
        return (
            <div style={{ ...styles.topBar, ...bottomBorderStyle, ...this.props.style }} className="pb1">
                <div className={parentClassNames}>
                    <div className="col col-2 sm-pl2 md-pl2 lg-pl0" style={{ paddingTop: 15 }}>
                        <Link to={`${WebsitePaths.Home}`} className="text-decoration-none">
                            <img src={logoUrl} height="30" />
                        </Link>
                    </div>
                    <div className={`col col-${isFullWidthPage ? '8' : '9'} lg-hide md-hide`} />
                    <div className={`col col-${isFullWidthPage ? '6' : '5'} sm-hide xs-hide`} />
                    {!this._isViewingPortal() && (
                        <div className={menuClasses}>
                            <div className="flex justify-between">
                                <DropDown
                                    hoverActiveNode={hoverActiveNode}
                                    popoverContent={popoverContent}
                                    anchorOrigin={{ horizontal: 'middle', vertical: 'bottom' }}
                                    targetOrigin={{ horizontal: 'middle', vertical: 'top' }}
                                    style={styles.menuItem}
                                />
                                <TopBarMenuItem
                                    title="Wiki"
                                    path={`${WebsitePaths.Wiki}`}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                                <TopBarMenuItem
                                    title="Blog"
                                    path={constants.URL_BLOG}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={true}
                                />
                                <TopBarMenuItem
                                    title="About"
                                    path={`${WebsitePaths.About}`}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                                <TopBarMenuItem
                                    title="Portal DApp"
                                    path={`${WebsitePaths.Portal}`}
                                    isPrimary={true}
                                    style={styles.menuItem}
                                    className={`${isFullWidthPage && 'md-hide'}`}
                                    isNightVersion={isNightVersion}
                                    isExternal={false}
                                />
                            </div>
                        </div>
                    )}
                    {this.props.blockchainIsLoaded && (
                        <div className="sm-hide xs-hide col col-5">
                            <ProviderDisplay
                                dispatcher={this.props.dispatcher}
                                userAddress={this.props.userAddress}
                                networkId={this.props.networkId}
                                injectedProviderName={this.props.injectedProviderName}
                                providerType={this.props.providerType}
                                onToggleLedgerDialog={this.props.onToggleLedgerDialog}
                                blockchain={this.props.blockchain}
                            />
                        </div>
                    )}
                    <div className={`col ${isFullWidthPage ? 'col-2 pl2' : 'col-1'} md-hide lg-hide`}>
                        <div style={menuIconStyle}>
                            <i className="zmdi zmdi-menu" onClick={this._onMenuButtonClick.bind(this)} />
                        </div>
                    </div>
                </div>
                {this._renderDrawer()}
            </div>
        );
    }
    private _renderDrawer() {
        return (
            <Drawer
                open={this.state.isDrawerOpen}
                docked={false}
                openSecondary={true}
                onRequestChange={this._onMenuButtonClick.bind(this)}
            >
                <div className="clearfix">
                    {this._renderPortalMenu()}
                    {this._renderDocsMenu()}
                    {this._renderWiki()}
                    <div className="pl1 py1 mt3" style={{ backgroundColor: colors.lightGrey }}>
                        Website
                    </div>
                    <Link to={WebsitePaths.Home} className="text-decoration-none">
                        <MenuItem className="py2">Home</MenuItem>
                    </Link>
                    <Link to={`${WebsitePaths.Wiki}`} className="text-decoration-none">
                        <MenuItem className="py2">Wiki</MenuItem>
                    </Link>
                    {!this._isViewing0xjsDocs() && (
                        <Link to={WebsitePaths.ZeroExJs} className="text-decoration-none">
                            <MenuItem className="py2">0x.js Docs</MenuItem>
                        </Link>
                    )}
                    {!this._isViewingConnectDocs() && (
                        <Link to={WebsitePaths.Connect} className="text-decoration-none">
                            <MenuItem className="py2">0x Connect Docs</MenuItem>
                        </Link>
                    )}
                    {!this._isViewingSmartContractsDocs() && (
                        <Link to={WebsitePaths.SmartContracts} className="text-decoration-none">
                            <MenuItem className="py2">Smart Contract Docs</MenuItem>
                        </Link>
                    )}
                    {!this._isViewingPortal() && (
                        <Link to={`${WebsitePaths.Portal}`} className="text-decoration-none">
                            <MenuItem className="py2">Portal DApp</MenuItem>
                        </Link>
                    )}
                    <a className="text-decoration-none" target="_blank" href={`${WebsitePaths.Whitepaper}`}>
                        <MenuItem className="py2">Whitepaper</MenuItem>
                    </a>
                    <Link to={`${WebsitePaths.About}`} className="text-decoration-none">
                        <MenuItem className="py2">About</MenuItem>
                    </Link>
                    <a className="text-decoration-none" target="_blank" href={constants.URL_BLOG}>
                        <MenuItem className="py2">Blog</MenuItem>
                    </a>
                    <Link to={`${WebsitePaths.FAQ}`} className="text-decoration-none">
                        <MenuItem className="py2" onTouchTap={this._onMenuButtonClick.bind(this)}>
                            FAQ
                        </MenuItem>
                    </Link>
                </div>
            </Drawer>
        );
    }
    private _renderDocsMenu(): React.ReactNode {
        if (
            (!this._isViewing0xjsDocs() && !this._isViewingSmartContractsDocs() && !this._isViewingConnectDocs()) ||
            _.isUndefined(this.props.menu)
        ) {
            return undefined;
        }

        const sectionTitle = `${this.props.docsInfo.displayName} Docs`;
        return (
            <div className="lg-hide md-hide">
                <NestedSidebarMenu
                    topLevelMenu={this.props.menu}
                    menuSubsectionsBySection={this.props.menuSubsectionsBySection}
                    title={this.props.docsInfo.displayName}
                    shouldDisplaySectionHeaders={false}
                    onMenuItemClick={this._onMenuButtonClick.bind(this)}
                    selectedVersion={this.props.docsVersion}
                    docPath={this.props.docsInfo.websitePath}
                    versions={this.props.availableDocVersions}
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
                    title="Wiki"
                    shouldDisplaySectionHeaders={false}
                    onMenuItemClick={this._onMenuButtonClick.bind(this)}
                />
            </div>
        );
    }
    private _renderPortalMenu(): React.ReactNode {
        if (!this._isViewingPortal()) {
            return undefined;
        }

        return (
            <div className="lg-hide md-hide">
                <div className="pl1 py1" style={{ backgroundColor: colors.lightGrey }}>
                    Portal DApp
                </div>
                <PortalMenu menuItemStyle={{ color: 'black' }} onClick={this._onMenuButtonClick.bind(this)} />
            </div>
        );
    }
    private _renderUser() {
        const userAddress = this.props.userAddress;
        const identiconDiameter = 26;
        return (
            <div className="flex right lg-pr0 md-pr2 sm-pr2" style={{ paddingTop: 16 }}>
                <div style={styles.address} data-tip={true} data-for="userAddressTooltip">
                    {!_.isEmpty(userAddress) ? userAddress : ''}
                </div>
                <ReactTooltip id="userAddressTooltip">{userAddress}</ReactTooltip>
                <div>
                    <Identicon address={userAddress} diameter={identiconDiameter} />
                </div>
            </div>
        );
    }
    private _onMenuButtonClick() {
        this.setState({
            isDrawerOpen: !this.state.isDrawerOpen,
        });
    }
    private _isViewingPortal() {
        return _.includes(this.props.location.pathname, WebsitePaths.Portal);
    }
    private _isViewingFAQ() {
        return _.includes(this.props.location.pathname, WebsitePaths.FAQ);
    }
    private _isViewing0xjsDocs() {
        return _.includes(this.props.location.pathname, WebsitePaths.ZeroExJs);
    }
    private _isViewingConnectDocs() {
        return _.includes(this.props.location.pathname, WebsitePaths.Connect);
    }
    private _isViewingSmartContractsDocs() {
        return _.includes(this.props.location.pathname, WebsitePaths.SmartContracts);
    }
    private _isViewingWiki() {
        return _.includes(this.props.location.pathname, WebsitePaths.Wiki);
    }
    private _shouldDisplayBottomBar() {
        return (
            this._isViewingWiki() ||
            this._isViewing0xjsDocs() ||
            this._isViewingFAQ() ||
            this._isViewingSmartContractsDocs() ||
            this._isViewingConnectDocs()
        );
    }
}
