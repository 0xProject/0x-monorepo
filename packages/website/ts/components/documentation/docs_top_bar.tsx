import { ALink, colors, Link } from '@0xproject/react-shared';
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
        const menuItemLinks: ALink[] = [
            {
                title: this.props.translate.get(Key.Home, Deco.Cap),
                to: WebsitePaths.Home,
            },
            {
                title: this.props.translate.get(Key.Wiki, Deco.Cap),
                to: WebsitePaths.Wiki,
            },
            {
                title: this.props.translate.get(Key.Forum, Deco.Cap),
                to: constants.URL_FORUM,
                shouldOpenInNewTab: true,
            },
            {
                title: this.props.translate.get(Key.LiveChat, Deco.Cap),
                to: constants.URL_ZEROEX_CHAT,
                shouldOpenInNewTab: true,
            },
        ];
        return (
            <Container height={80}>
                <Container
                    className="flex items-center lg-pt3 md-pt3 sm-pt1 lg-mt1 md-mt1 sm-mt0 lg-justify-end md-justify-end sm-justify-start"
                    width="100%"
                >
                    <Container className="sm-hide xs-hide">
                        <Container className="flex items-center justify-between right" width="300px">
                            {this._renderMenuItems(menuItemLinks)}
                        </Container>
                    </Container>
                    <Container className="lg-hide md-hide">
                        <Container paddingTop="6px">
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
                <Container width={'100%'} height={'1px'} backgroundColor={colors.grey300} marginTop={'13px'} />
                {this.props.screenWidth === ScreenWidths.Sm && this._renderDrawer()}
            </Container>
        );
    }
    private _renderMenuItems(menuItemLinks: ALink[]): React.ReactNode {
        const menuItems = _.map(menuItemLinks, menuItemInfo => {
            return (
                <Link
                    key={`menu-item-${menuItemInfo.title}`}
                    to={menuItemInfo.to}
                    shouldOpenInNewTab={menuItemInfo.shouldOpenInNewTab}
                >
                    <Container className="flex items-center" paddingLeft="4px">
                        <Text fontSize="16px" fontColor={colors.lightLinkBlue} fontWeight="bold">
                            {menuItemInfo.title}
                        </Text>
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
