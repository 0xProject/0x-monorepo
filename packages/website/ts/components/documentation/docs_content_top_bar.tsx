import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import Drawer from 'material-ui/Drawer';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { TopBarMenuItem } from 'ts/components/top_bar/top_bar_menu_item';
import { Container } from 'ts/components/ui/container';
import { Deco, Key, WebsitePaths } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

export interface DocsContentTopBarProps {
    location: Location;
    translate: Translate;
}

interface DocsContentTopBarState {
    isDrawerOpen: boolean;
}

const styles: Styles = {
    menuItem: {
        fontSize: 14,
        color: colors.darkestGrey,
        paddingTop: 6,
        paddingBottom: 6,
        cursor: 'pointer',
        fontWeight: 400,
    },
};

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
        const menuIconStyle = {
            fontSize: 25,
            color: 'black',
            cursor: 'pointer',
        };
        return (
            <div style={{ height: 75, color: colors.linkSectionGrey }} className="pb1 flex items-center">
                <Container className="flex items-center" width="100%">
                    <div className="col col-2">
                        <i className="zmdi zmdi-chevron-left" /> 0xproject.com
                    </div>
                    <div className="col col-10">
                        <div className="flex items-center justify-between right" style={{ width: 300 }}>
                            <TopBarMenuItem
                                title={this.props.translate.get(Key.Github, Deco.Cap)}
                                path={constants.URL_GITHUB_ORG}
                                style={styles.menuItem}
                                isNightVersion={false}
                                isExternal={true}
                            />
                            <TopBarMenuItem
                                title={this.props.translate.get(Key.Forum, Deco.Cap)}
                                path={constants.URL_FORUM}
                                style={styles.menuItem}
                                isNightVersion={false}
                                isExternal={true}
                            />
                            <TopBarMenuItem
                                title={this.props.translate.get(Key.LiveChat, Deco.Cap)}
                                path={constants.URL_ZEROEX_CHAT}
                                style={styles.menuItem}
                                isNightVersion={false}
                                isExternal={true}
                            />
                        </div>
                    </div>
                    <div className={'md-hide lg-hide'}>
                        <div style={menuIconStyle}>
                            <i className="zmdi zmdi-menu" onClick={this._onMenuButtonClick.bind(this)} />
                        </div>
                    </div>
                </Container>
                {this._renderDrawer()}
            </div>
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
                <div className="clearfix">TODO</div>
            </Drawer>
        );
    }
    private _onMenuButtonClick(): void {
        this.setState({
            isDrawerOpen: !this.state.isDrawerOpen,
        });
    }
}
