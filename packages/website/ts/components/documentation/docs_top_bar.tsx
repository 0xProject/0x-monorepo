import { ALink, colors, Link, NestedSidebarMenu } from '@0xproject/react-shared';
import { ObjectMap } from '@0xproject/types';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import * as React from 'react';
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { Deco, Key, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export interface DocsTopBarProps {
    location: Location;
    translate: Translate;
    sectionNameToLinks?: ObjectMap<ALink[]>;
}

interface DocsTopBarState {
    isDrawerOpen: boolean;
}

interface MenuItemInfo {
    title: string;
    url: string;
    iconUrl: string;
    textStyle: React.CSSProperties;
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
                >
                    <Container className="flex">
                        <img src={menuItemInfo.iconUrl} width="18" />
                        <div className="flex items-center" style={{ ...menuItemInfo.textStyle, paddingLeft: 4 }}>
                            <Text fontSize="16px">{menuItemInfo.title}</Text>
                        </div>
                    </Container>
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
                <Container className="clearfix pl1">
                    <NestedSidebarMenu
                        sectionNameToLinks={this.props.sectionNameToLinks}
                        shouldDisplaySectionHeaders={true}
                        shouldReformatMenuItemNames={false}
                        onMenuItemClick={this._onMenuButtonClick.bind(this)}
                    />
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
