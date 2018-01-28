import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';
import DocumentTitle = require('react-document-title');
import { scroller } from 'react-scroll';
import { TopBar } from 'ts/components/top_bar/top_bar';
import { MarkdownSection } from 'ts/pages/shared/markdown_section';
import { NestedSidebarMenu } from 'ts/pages/shared/nested_sidebar_menu';
import { SectionHeader } from 'ts/pages/shared/section_header';
import { Article, ArticlesBySection, HeaderSizes, Styles, WebsitePaths } from 'ts/types';
import { colors } from 'ts/utils/colors';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

const WIKI_NOT_READY_BACKOUT_TIMEOUT_MS = 5000;

export interface WikiProps {
    source: string;
    location: Location;
}

interface WikiState {
    articlesBySection: ArticlesBySection;
}

const styles: Styles = {
    mainContainers: {
        position: 'absolute',
        top: 1,
        left: 0,
        bottom: 0,
        right: 0,
        overflowZ: 'hidden',
        overflowY: 'scroll',
        minHeight: 'calc(100vh - 1px)',
        WebkitOverflowScrolling: 'touch',
    },
    menuContainer: {
        borderColor: colors.grey300,
        maxWidth: 330,
        marginLeft: 20,
    },
};

export class Wiki extends React.Component<WikiProps, WikiState> {
    private _wikiBackoffTimeoutId: number;
    constructor(props: WikiProps) {
        super(props);
        this.state = {
            articlesBySection: undefined,
        };
    }
    public componentWillMount() {
        // tslint:disable-next-line:no-floating-promises
        this._fetchArticlesBySectionAsync();
    }
    public componentWillUnmount() {
        clearTimeout(this._wikiBackoffTimeoutId);
    }
    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.articlesBySection)
            ? {}
            : this._getMenuSubsectionsBySection(this.state.articlesBySection);
        return (
            <div>
                <DocumentTitle title="0x Protocol Wiki" />
                <TopBar
                    blockchainIsLoaded={false}
                    location={this.props.location}
                    menuSubsectionsBySection={menuSubsectionsBySection}
                    shouldFullWidth={true}
                />
                {_.isUndefined(this.state.articlesBySection) ? (
                    <div className="col col-12" style={styles.mainContainers}>
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
                    <div className="mx-auto flex" style={{ color: colors.grey800, height: 43 }}>
                        <div className="relative col md-col-3 lg-col-3 lg-pl0 md-pl1 sm-hide xs-hide">
                            <div
                                className="border-right absolute pt2"
                                style={{ ...styles.menuContainer, ...styles.mainContainers }}
                            >
                                <NestedSidebarMenu
                                    topLevelMenu={menuSubsectionsBySection}
                                    menuSubsectionsBySection={menuSubsectionsBySection}
                                    isSectionHeaderClickable={true}
                                />
                            </div>
                        </div>
                        <div className="relative col lg-col-9 md-col-9 sm-col-12 col-12">
                            <div id="documentation" style={styles.mainContainers} className="absolute">
                                <div id="0xProtocolWiki" />
                                <h1 className="md-pl2 sm-pl3">
                                    <a href={constants.URL_GITHUB_WIKI} target="_blank">
                                        0x Protocol Wiki
                                    </a>
                                </h1>
                                <div id="wiki">{this._renderWikiArticles()}</div>
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
    private _renderSection(sectionName: string) {
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
                    <div className="mb4 mt3 p3 center" style={{ backgroundColor: colors.lightestGrey }}>
                        See a way to make this article better?{' '}
                        <a href={githubLink} target="_blank">
                            Edit here →
                        </a>
                    </div>
                </div>
            );
        });
        return (
            <div key={`section-${sectionName}`} className="py2 pr3 md-pl2 sm-pl3">
                <SectionHeader sectionName={sectionName} headerSize={HeaderSizes.H1} />
                {renderedArticles}
            </div>
        );
    }
    private _scrollToHash(): void {
        const hashWithPrefix = this.props.location.hash;
        let hash = hashWithPrefix.slice(1);
        if (_.isEmpty(hash)) {
            hash = '0xProtocolWiki'; // scroll to the top
        }

        scroller.scrollTo(hash, {
            duration: 0,
            offset: 0,
            containerId: 'documentation',
        });
    }
    private async _fetchArticlesBySectionAsync(): Promise<void> {
        const endpoint = `${configs.BACKEND_BASE_URL}${WebsitePaths.Wiki}`;
        const response = await fetch(endpoint);
        if (response.status === constants.HTTP_NO_CONTENT_STATUS_CODE) {
            // We need to backoff and try fetching again later
            this._wikiBackoffTimeoutId = window.setTimeout(() => {
                // tslint:disable-next-line:no-floating-promises
                this._fetchArticlesBySectionAsync();
            }, WIKI_NOT_READY_BACKOUT_TIMEOUT_MS);
            return;
        }
        if (response.status !== 200) {
            // TODO: Show the user an error message when the wiki fail to load
            const errMsg = await response.text();
            utils.consoleLog(`Failed to load wiki: ${response.status} ${errMsg}`);
            return;
        }
        const articlesBySection = await response.json();
        this.setState(
            {
                articlesBySection,
            },
            () => {
                this._scrollToHash();
            },
        );
    }
    private _getMenuSubsectionsBySection(articlesBySection: ArticlesBySection) {
        const sectionNames = _.keys(articlesBySection);
        const menuSubsectionsBySection: { [section: string]: string[] } = {};
        for (const sectionName of sectionNames) {
            const articles = articlesBySection[sectionName];
            const articleNames = _.map(articles, article => article.title);
            menuSubsectionsBySection[sectionName] = articleNames;
        }
        return menuSubsectionsBySection;
    }
}
