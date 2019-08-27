import { Link } from 'ts/components/documentation/shared/link';

import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import * as React from 'react';
import { Blockchain } from 'ts/blockchain';
import { DrawerMenu } from 'ts/components/portal/drawer_menu';
import { ProviderDisplay } from 'ts/components/top_bar/provider_display';
import { TopBarMenuItem } from 'ts/components/top_bar/top_bar_menu_item';
import { Container } from 'ts/components/ui/container';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ALink, Deco, Key, ProviderType, Styles, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

import { DocsInfo } from '../../utils/docs_info';

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
    sectionNameToLinks?: ObjectMap<ALink[]>;
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
    public componentDidUpdate(prevProps: TopBarProps): void {
        if (this.props.location.pathname !== prevProps.location.pathname) {
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
        const bottomBorderStyle = this._shouldDisplayBottomBar() ? styles.bottomBar : {};
        const fullWidthClasses = isExpandedDisplayType ? 'pr4' : '';
        const logoUrl = isNightVersion ? '/images/protocol_logo_white.png' : '/images/protocol_logo_black.png';
        const menuClasses = `col col-${
            isExpandedDisplayType ? '4' : '6'
        } ${fullWidthClasses} lg-pr0 md-pr2 sm-hide xs-hide`;
        const menuIconStyle = {
            fontSize: 25,
            color: isNightVersion ? 'white' : 'black',
            cursor: 'pointer',
        };
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
                    <Link to={WebsitePaths.Home}>
                        <img src={logoUrl} height="30" />
                    </Link>
                    <div className="flex-auto" />
                    {!this._isViewingPortal() && (
                        <div className={menuClasses}>
                            <div className="flex items-center justify-between">
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.Blog, Deco.Cap)}
                                    path={constants.URL_BLOG}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                    shouldOpenInNewTab={true}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.About, Deco.Cap)}
                                    path={WebsitePaths.About}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.Careers, Deco.Cap)}
                                    path={WebsitePaths.Careers}
                                    style={styles.menuItem}
                                    isNightVersion={isNightVersion}
                                />
                                <TopBarMenuItem
                                    title={this.props.translate.get(Key.TradeCallToAction, Deco.Cap)}
                                    path={WebsitePaths.Portal}
                                    isPrimary={true}
                                    style={styles.menuItem}
                                    className={`${isExpandedDisplayType && 'md-hide'}`}
                                    isNightVersion={isNightVersion}
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
                    <div className="pl1 py1 mt3" style={{ backgroundColor: colors.lightGrey }}>
                        {this.props.translate.get(Key.Website, Deco.Cap)}
                    </div>
                    <Link to={WebsitePaths.Home}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Home, Deco.Cap)}</MenuItem>
                    </Link>
                    <Link to={WebsitePaths.Docs}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Docs, Deco.Cap)}</MenuItem>
                    </Link>
                    {!this._isViewingPortal() && (
                        <Link to={WebsitePaths.Portal}>
                            <MenuItem className="py2">
                                {this.props.translate.get(Key.PortalDApp, Deco.CapWords)}
                            </MenuItem>
                        </Link>
                    )}
                    <Link to={WebsitePaths.Whitepaper} shouldOpenInNewTab={true}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Whitepaper, Deco.Cap)}</MenuItem>
                    </Link>
                    <Link to={WebsitePaths.About}>
                        <MenuItem className="py2">{this.props.translate.get(Key.About, Deco.Cap)}</MenuItem>
                    </Link>
                    <Link to={WebsitePaths.Careers}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Careers, Deco.Cap)}</MenuItem>
                    </Link>
                    <Link to={constants.URL_BLOG} shouldOpenInNewTab={true}>
                        <MenuItem className="py2">{this.props.translate.get(Key.Blog, Deco.Cap)}</MenuItem>
                    </Link>
                </div>
            </Drawer>
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
    private _shouldDisplayBottomBar(): boolean {
        return this._isViewingPortal();
    }
} // tslint:disable:max-file-line-count
