import { colors, NestedSidebarMenu } from '@0xproject/react-shared';
import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import * as React from 'react';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { Container } from 'ts/components/ui/container';
import { Link } from 'ts/components/ui/link';
import { ALink, Deco, Key, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export interface DocsContentTopBarProps {
    location: Location;
    translate: Translate;
    sectionNameToLinks?: ObjectMap<ALink[]>;
}

interface DocsContentTopBarState {
    isDrawerOpen: boolean;
}

interface MenuItemInfo {
    title: string;
    url: string;
    iconUrl: string;
    textStyle: React.CSSProperties;
}

export class DocsContentTopBar extends React.Component<DocsContentTopBarProps, DocsContentTopBarState> {
    constructor(props: DocsContentTopBarProps) {
        super(props);
        this.state = {
            isDrawerOpen: false,
        };
    }
    public componentWillReceiveProps(nextProps: DocsContentTopBarProps): void {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.setState({
                isDrawerOpen: false,
            });
        }
    }
    public render(): React.ReactNode {
        const menuItemInfos: MenuItemInfo[] = [
            {
                title: this.props.translate.get(Key.Github, Deco.Cap),
                url: constants.URL_GITHUB_ORG,
                iconUrl: '/images/developers/github_icon.svg',
                textStyle: { color: colors.linkSectionGrey },
            },
            {
                title: this.props.translate.get(Key.Forum, Deco.Cap),
                url: constants.URL_FORUM,
                iconUrl: '/images/developers/forum_icon.svg',
                textStyle: { color: colors.linkSectionGrey },
            },
            {
                title: this.props.translate.get(Key.LiveChat, Deco.Cap),
                url: constants.URL_ZEROEX_CHAT,
                iconUrl: '/images/developers/chat_icon.svg',
                textStyle: { color: colors.lightLinkBlue, fontWeight: 'bold' },
            },
        ];
        return (
            <Container height={80}>
                <Container className="flex items-center lg-pt3 md-pt3 sm-pt1 relative" width="100%">
                    <div className="col col-2 sm-hide xs-hide">
                        <Link
                            to={WebsitePaths.Home}
                            style={{ color: colors.linkSectionGrey }}
                            className="flex items-center text-decoration-none"
                        >
                            <i className="zmdi zmdi-chevron-left bold" style={{ fontSize: 16 }} />
                            <div className="pl1" style={{ fontSize: 16 }}>
                                0xproject.com
                            </div>
                        </Link>
                    </div>
                    <div className="col col-4 md-hide sm-hide xs-hide" />
                    <div className="col col-6 md-pl4 md-ml4 sm-hide xs-hide">
                        <div className="flex items-center justify-between right" style={{ width: 300 }}>
                            {this._renderMenuItems(menuItemInfos)}
                        </div>
                    </div>
                    <div className="lg-hide md-hide">
                        <DocsLogo height={30} containerStyle={{ paddingTop: 6, paddingLeft: 18 }} />
                    </div>
                    <div className="md-hide lg-hide absolute" style={{ right: 18, top: 12 }}>
                        <div
                            style={{
                                fontSize: 30,
                                color: 'black',
                                cursor: 'pointer',
                            }}
                        >
                            <i
                                className="zmdi zmdi-menu"
                                style={{ color: colors.grey700 }}
                                onClick={this._onMenuButtonClick.bind(this)}
                            />
                        </div>
                    </div>
                </Container>
                <div
                    style={{
                        width: '100%',
                        height: 1,
                        backgroundColor: colors.grey300,
                        marginTop: 11,
                    }}
                />
                {this._renderDrawer()}
            </Container>
        );
    }
    private _renderMenuItems(menuItemInfos: MenuItemInfo[]): React.ReactNode {
        const menuItems = _.map(menuItemInfos, menuItemInfo => {
            return (
                <a
                    key={`menu-item-${menuItemInfo.title}`}
                    href={menuItemInfo.url}
                    target="_blank"
                    className="text-decoration-none"
                    style={{
                        fontSize: 16,
                    }}
                >
                    <div className="flex">
                        <img src={menuItemInfo.iconUrl} width="18" />
                        <div className="flex items-center" style={{ ...menuItemInfo.textStyle, paddingLeft: 4 }}>
                            {menuItemInfo.title}
                        </div>
                    </div>
                </a>
            );
        });
        return menuItems;
    }
    private _renderDrawer(): React.ReactNode {
        return (
            <Drawer
                open={this.state.isDrawerOpen}
                docked={false}
                openSecondary={true}
                onRequestChange={this._onMenuButtonClick.bind(this)}
            >
                <div className="clearfix pl1">
                    TODO
                    {/* <NestedSidebarMenu
                        topLevelMenu={this.props.menu}
                        shouldDisplaySectionHeaders={true}
                        shouldReformatMenuItemNames={false}
                        onMenuItemClick={this._onMenuButtonClick.bind(this)}
                    /> */}
                </div>
            </Drawer>
        );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isDrawerOpen: !this.state.isDrawerOpen,
        });
    }
}
