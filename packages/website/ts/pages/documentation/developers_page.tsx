import { colors, constants as sharedConstants } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { DocsLogo } from 'ts/components/documentation/docs_logo';
import { DocsTopBar } from 'ts/components/documentation/docs_top_bar';
import { Container } from 'ts/components/ui/container';
import { Dispatcher } from 'ts/redux/dispatcher';
import { ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const THROTTLE_TIMEOUT = 100;
const TOP_BAR_HEIGHT = 80;
const SCROLLER_WIDTH = 4;

export interface DevelopersPageProps {
    location: Location;
    translate: Translate;
    screenWidth: ScreenWidths;
    dispatcher: Dispatcher;
    mainContent: React.ReactNode;
    sidebar: React.ReactNode;
}

export interface DevelopersPageState {
    isHoveringSidebar: boolean;
    isHoveringMainContent: boolean;
    isSidebarScrolling: boolean;
}

export class DevelopersPage extends React.Component<DevelopersPageProps, DevelopersPageState> {
    private readonly _throttledScreenWidthUpdate: () => void;
    private readonly _throttledSidebarScrolling: () => void;
    private _sidebarScrollClearingInterval: number;
    constructor(props: DevelopersPageProps) {
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
        const sidebarPadding = 22;
        return (
            <Container
                className="flex items-center overflow-hidden"
                width="100%"
                background={`linear-gradient(to right, ${colors.grey100} 0%, ${colors.grey100} 50%, ${
                    colors.white
                } 50%, ${colors.white} 100%)`}
            >
                <DocumentTitle title="0x Docs DevelopersPage" />
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
                            <Container paddingTop="30px" paddingLeft="10px" paddingBottom="8px">
                                <DocsLogo height={36} />
                            </Container>
                        </Container>
                        <div
                            style={{
                                ...scrollableContainerStyles,
                                paddingTop: 27,
                                overflow: this.state.isHoveringSidebar ? 'auto' : 'hidden',
                            }}
                            onMouseEnter={this._onSidebarHover.bind(this, true)}
                            onMouseLeave={this._onSidebarHover.bind(this, false)}
                            onWheel={this._throttledSidebarScrolling}
                        >
                            <div
                                style={{
                                    paddingBottom: 100,
                                    paddingLeft: sidebarPadding,
                                    paddingRight: this.state.isHoveringSidebar
                                        ? sidebarPadding - SCROLLER_WIDTH
                                        : sidebarPadding,
                                }}
                            >
                                {this.props.sidebar}
                            </div>
                        </div>
                    </Container>
                    <Container
                        className="relative"
                        width={isSmallScreen ? '100vw' : 786}
                        paddingBottom="100px"
                        backgroundColor={colors.white}
                    >
                        <Container paddingLeft={mainContentPadding} paddingRight={mainContentPadding}>
                            <DocsTopBar
                                location={this.props.location}
                                translate={this.props.translate}
                                sidebar={this.props.sidebar}
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
                            {this.props.mainContent}
                        </div>
                    </Container>
                </Container>
            </Container>
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
