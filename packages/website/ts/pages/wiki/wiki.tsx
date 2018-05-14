import {
    colors,
    constants as sharedConstants,
    HeaderSizes,
    MarkdownSection,
    NestedSidebarMenu,
    SectionHeader,
    Styles,
    utils as sharedUtils,
} from '@0xproject/react-shared';
import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { scroller } from 'react-scroll';
import { SidebarHeader } from 'ts/components/sidebar_header';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Article, ArticlesBySection, WebsitePaths } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const TOP_BAR_HEIGHT = 60;
const WIKI_NOT_READY_BACKOUT_TIMEOUT_MS = 5000;

export interface WikiProps {
    source: string;
    location: Location;
    dispatcher: Dispatcher;
    translate: Translate;
}

interface WikiState {
    articlesBySection: ArticlesBySection;
    isHoveringSidebar: boolean;
}

const styles: Styles = {
    mainContainers: {
        position: 'absolute',
        top: 1,
        left: 0,
        bottom: 0,
        right: 0,
        overflow: 'hidden',
        height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        WebkitOverflowScrolling: 'touch',
    },
    menuContainer: {
        borderColor: colors.grey300,
        maxWidth: 330,
        backgroundColor: colors.gray40,
    },
};

export class Wiki extends React.Component<WikiProps, WikiState> {
    private _wikiBackoffTimeoutId: number;
    private _isUnmounted: boolean;
    constructor(props: WikiProps) {
        super(props);
        this._isUnmounted = false;
        this.state = {
            articlesBySection: undefined,
            isHoveringSidebar: false,
        };
    }
    public componentDidMount(): void {
        window.addEventListener('hashchange', this._onHashChanged.bind(this), false);
    }
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchArticlesBySectionAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
        clearTimeout(this._wikiBackoffTimeoutId);
        window.removeEventListener('hashchange', this._onHashChanged.bind(this), false);
    }
    public render(): React.ReactNode {
        const menuSubsectionsBySection = _.isUndefined(this.state.articlesBySection)
            ? {}
            : this._getMenuSubsectionsBySection(this.state.articlesBySection);
        const mainContainersStyle: React.CSSProperties = {
            ...styles.mainContainers,
            overflow: this.state.isHoveringSidebar ? 'auto' : 'hidden',
        };
        const sidebarHeader = <SidebarHeader title="Wiki" iconUrl="/images/doc_icons/wiki.png" />;
        return (
            <div>
                <DocumentTitle title="0x Protocol Wiki" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    translate={this.props.translate}
                    sidebarHeader={sidebarHeader}
                />
                {_.isUndefined(this.state.articlesBySection) ? (
                    <div className="col col-12" style={mainContainersStyle}>
                        <div
                            className="relative sm-px2 sm-pt2 sm-m1"
                            style={{ height: 122, top: '50%', transform: 'translateY(-50%)' }}
                        >
                            <div className="center pb2">
                                <CircularProgress size={40} thickness={5} />
                            </div>
                            <div className="center pt2" style={{ paddingBottom: 11 }}>
                                Loading wiki...
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: colors.gray40 }}>
                        <div
                            className="mx-auto max-width-4 flex"
                            style={{ color: colors.grey800, height: `calc(100vh - ${TOP_BAR_HEIGHT}px)` }}
                        >
                            <div
                                className="relative lg-pl0 md-pl1 sm-hide xs-hide"
                                style={{ height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`, width: '36%' }}
                            >
                                <div
                                    className="absolute"
                                    style={{
                                        ...styles.menuContainer,
                                        ...mainContainersStyle,
                                        height: 'calc(100vh - 76px)',
                                    }}
                                    onMouseEnter={this._onSidebarHover.bind(this)}
                                    onMouseLeave={this._onSidebarHoverOff.bind(this)}
                                >
                                    <NestedSidebarMenu
                                        topLevelMenu={menuSubsectionsBySection}
                                        menuSubsectionsBySection={menuSubsectionsBySection}
                                        sidebarHeader={sidebarHeader}
                                    />
                                </div>
                            </div>
                            <div
                                className="relative"
                                style={{
                                    width: '100%',
                                    height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
                                    backgroundColor: 'white',
                                }}
                            >
                                <div
                                    id={sharedConstants.SCROLL_CONTAINER_ID}
                                    style={{ ...mainContainersStyle, overflow: 'auto' }}
                                    className="absolute"
                                >
                                    <div id={sharedConstants.SCROLL_TOP_ID} />
                                    <div id="wiki" style={{ paddingRight: 2 }}>
                                        {this._renderWikiArticles()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    private _renderWikiArticles(): React.ReactNode {
        const sectionNames = _.keys(this.state.articlesBySection);
        const sections = _.map(sectionNames, sectionName => this._renderSection(sectionName));
        return sections;
    }
    private _renderSection(sectionName: string): React.ReactNode {
        const articles = this.state.articlesBySection[sectionName];
        const renderedArticles = _.map(articles, (article: Article) => {
            const githubLink = `${constants.URL_GITHUB_WIKI}/edit/master/${sectionName}/${article.fileName}`;
            return (
                <div key={`markdown-section-${article.title}`}>
                    <MarkdownSection
                        sectionName={article.title}
                        markdownContent={article.content}
                        headerSize={HeaderSizes.H2}
                        githubLink={githubLink}
                    />
                    <div className="clearfix mb3 mt2 p3 mx-auto lg-flex md-flex sm-pb4" style={{ maxWidth: 390 }}>
                        <div className="sm-col sm-col-12 sm-center" style={{ opacity: 0.4, lineHeight: 2.5 }}>
                            See a way to improve this article?
                        </div>
                        <div className="sm-col sm-col-12 lg-col-7 md-col-7 sm-center sm-pt2">
                            <RaisedButton href={githubLink} target="_blank" label="Edit on Github" />
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div key={`section-${sectionName}`} className="py2 md-px1 sm-px0">
                {renderedArticles}
            </div>
        );
    }
    private async _fetchArticlesBySectionAsync(): Promise<void> {
        try {
            const articlesBySection = await backendClient.getWikiArticlesBySectionAsync();
            if (!this._isUnmounted) {
                this.setState(
                    {
                        articlesBySection,
                    },
                    async () => {
                        await utils.onPageLoadAsync();
                        const hash = this.props.location.hash.slice(1);
                        sharedUtils.scrollToHash(hash, sharedConstants.SCROLL_CONTAINER_ID);
                    },
                );
            }
        } catch (err) {
            const errMsg = `${err}`;
            if (_.includes(errMsg, `${constants.HTTP_NO_CONTENT_STATUS_CODE}`)) {
                // We need to backoff and try fetching again later
                this._wikiBackoffTimeoutId = window.setTimeout(() => {
                    // tslint:disable-next-line:no-floating-promises
                    this._fetchArticlesBySectionAsync();
                }, WIKI_NOT_READY_BACKOUT_TIMEOUT_MS);
                return;
            }
        }
    }
    private _getMenuSubsectionsBySection(articlesBySection: ArticlesBySection): { [section: string]: string[] } {
        const sectionNames = _.keys(articlesBySection);
        const menuSubsectionsBySection: { [section: string]: string[] } = {};
        for (const sectionName of sectionNames) {
            const articles = articlesBySection[sectionName];
            const articleNames = _.map(articles, article => article.title);
            menuSubsectionsBySection[sectionName] = articleNames;
        }
        return menuSubsectionsBySection;
    }
    private _onSidebarHover(event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            isHoveringSidebar: true,
        });
    }
    private _onSidebarHoverOff(): void {
        this.setState({
            isHoveringSidebar: false,
        });
    }
    private _onHashChanged(event: any): void {
        const hash = window.location.hash.slice(1);
        sharedUtils.scrollToHash(hash, sharedConstants.SCROLL_CONTAINER_ID);
    }
}
