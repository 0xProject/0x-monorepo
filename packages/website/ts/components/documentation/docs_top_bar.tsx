import { ALink, colors, Link, NestedSidebarMenu } from '@0xproject/react-shared';
import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import * as React from 'react';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { Deco, Key, ScreenWidths, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export interface DocsTopBarProps {
    location: Location;
    screenWidth: ScreenWidths;
    translate: Translate;
    sidebar?: React.ReactNode;
}

interface DocsTopBarState {
    isDrawerOpen: boolean;
}

interface MenuItemInfo {
    iconUrl: string;
    fontColor: string;
    fontWeight?: string;
    link: ALink;
}

export class DocsTopBar extends React.Component<DocsTopBarProps, DocsTopBarState> {
    constructor(props: DocsTopBarProps) {
        super(props);
        this.state = {
            isDrawerOpen: false,
        };
    }
    public componentWillReceiveProps(nextProps: DocsTopBarProps): void {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.setState({
                isDrawerOpen: false,
            });
        }
    }
    public render(): React.ReactNode {
        const menuItemInfos: MenuItemInfo[] = [
            {
                link: {
                    title: this.props.translate.get(Key.Wiki, Deco.Cap),
                    to: WebsitePaths.Wiki,
                },
                iconUrl: '/images/developers/github_icon.svg',
                fontColor: colors.linkSectionGrey,
            },
            {
                link: {
                    title: this.props.translate.get(Key.Forum, Deco.Cap),
                    to: constants.URL_FORUM,
                    shouldOpenInNewTab: true,
                },
                iconUrl: '/images/developers/forum_icon.svg',
                fontColor: colors.linkSectionGrey,
            },
            {
                link: {
                    title: this.props.translate.get(Key.LiveChat, Deco.Cap),
                    to: constants.URL_ZEROEX_CHAT,
                    shouldOpenInNewTab: true,
                },
                iconUrl: '/images/developers/chat_icon.svg',
                fontColor: colors.lightLinkBlue,
                fontWeight: 'bold',
            },
        ];
        return (
            <Container height={80}>
                <Container className="flex items-center lg-pt3 md-pt3 sm-pt1 relative" width="100%">
                    <Container className="col col-2 sm-hide xs-hide">
                        <Link
                            to={WebsitePaths.Home}
                            fontColor={colors.linkSectionGrey}
                            className="flex items-center text-decoration-none"
                        >
                            <i className="zmdi zmdi-chevron-left bold" style={{ fontSize: 16 }} />
                            <Container paddingLeft="8px">
                                <Text fontSize="16px" fontColor={colors.linkSectionGrey}>
                                    0xproject.com
                                </Text>
                            </Container>
                        </Link>
                    </Container>
                    <Container className="col col-4 md-hide sm-hide xs-hide" />
                    <Container className="col col-6 md-pl4 md-ml4 sm-hide xs-hide">
                        <Container className="flex items-center justify-between right" width="300px">
                            {this._renderMenuItems(menuItemInfos)}
                        </Container>
                    </Container>
                    <Container className="lg-hide md-hide">
                        <Container paddingTop="6px" paddingLeft="18px">
                            <DocsLogo height={30} />
                        </Container>
                    </Container>
                    <Container className="md-hide lg-hide absolute" right="18px" top="12px">
                        <i
                            className="zmdi zmdi-menu"
                            style={{
                                color: colors.grey700,
                                fontSize: 30,
                                cursor: 'pointer',
                            }}
                            onClick={this._onMenuButtonClick.bind(this)}
                        />
                    </Container>
                </Container>
                <Container width={'100%'} height={'1px'} backgroundColor={colors.grey300} marginTop={'11px'} />
                {this.props.screenWidth === ScreenWidths.Sm && this._renderDrawer()}
            </Container>
        );
    }
    private _renderMenuItems(menuItemInfos: MenuItemInfo[]): React.ReactNode {
        const menuItems = _.map(menuItemInfos, menuItemInfo => {
            return (
                <Link
                    key={`menu-item-${menuItemInfo.link.title}`}
                    to={menuItemInfo.link.to}
                    shouldOpenInNewTab={menuItemInfo.link.shouldOpenInNewTab}
                >
                    <Container className="flex">
                        <img src={menuItemInfo.iconUrl} width="18" />
                        <Container className="flex items-center" paddingLeft="4px">
                            <Text
                                fontSize="16px"
                                fontWeight={menuItemInfo.fontWeight || 'normal'}
                                fontColor={menuItemInfo.fontColor}
                            >
                                {menuItemInfo.link.title}
                            </Text>
                        </Container>
                    </Container>
                </Link>
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
                <Container className="clearfix pl1 pt2" onClick={this._onMenuButtonClick.bind(this)}>
                    {this.props.sidebar}
                </Container>
            </Drawer>
        );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isDrawerOpen: !this.state.isDrawerOpen,
        });
    }
}
