import {
    ALink,
    colors,
    constants as sharedConstants,
    HeaderSizes,
    Link,
    MarkdownSection,
    utils as sharedUtils,
} from '@0x/react-shared';
import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';
import CircularProgress from 'material-ui/CircularProgress';
import * as React from 'react';
import { SidebarHeader } from 'ts/components/documentation/sidebar_header';
import { NestedSidebarMenu } from 'ts/components/nested_sidebar_menu';
import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { DevelopersPage } from 'ts/pages/documentation/developers_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { Article, ArticlesBySection, Deco, Key, ScreenWidths } from 'ts/types';
import { backendClient } from 'ts/utils/backend_client';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';
import { utils } from 'ts/utils/utils';

const WIKI_NOT_READY_BACKOUT_TIMEOUT_MS = 5000;

export interface WikiProps {
    source: string;
    location: Location;
    dispatcher: Dispatcher;
    translate: Translate;
    screenWidth: ScreenWidths;
}

interface WikiState {
    articlesBySection: ArticlesBySection;
    isHoveringSidebar: boolean;
}

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
    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._fetchArticlesBySectionAsync();
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
        clearTimeout(this._wikiBackoffTimeoutId);
    }
    public render(): React.ReactNode {
        const sectionNameToLinks = _.isUndefined(this.state.articlesBySection)
            ? {}
            : this._getSectionNameToLinks(this.state.articlesBySection);

        const mainContent = _.isUndefined(this.state.articlesBySection) ? (
            <div className="flex justify-center">{this._renderLoading()}</div>
        ) : (
            <div id="wiki" style={{ paddingRight: 2 }}>
                {this._renderWikiArticles()}
            </div>
        );
        const isSmallScreen = this.props.screenWidth === ScreenWidths.Sm;
        const sidebar = _.isUndefined(this.state.articlesBySection) ? (
            <div />
        ) : (
            <NestedSidebarMenu
                sidebarHeader={isSmallScreen ? this._renderSidebarHeader() : undefined}
                sectionNameToLinks={sectionNameToLinks}
            />
        );
        return (
            <DevelopersPage
                sidebar={sidebar}
                mainContent={mainContent}
                location={this.props.location}
                screenWidth={this.props.screenWidth}
                translate={this.props.translate}
                dispatcher={this.props.dispatcher}
            />
        );
    }
    private _renderSidebarHeader(): React.ReactNode {
        const menuItems = _.map(constants.DEVELOPER_TOPBAR_LINKS, menuItemInfo => {
            return (
                <Link
                    key={`menu-item-${menuItemInfo.title}`}
                    to={menuItemInfo.to}
                    shouldOpenInNewTab={menuItemInfo.shouldOpenInNewTab}
                >
                    <Button
                        borderRadius="4px"
                        padding="0.4em 0.375em"
                        width="100%"
                        fontColor={colors.grey800}
                        fontSize="14px"
                        textAlign="left"
                    >
                        {this.props.translate.get(menuItemInfo.title as Key, Deco.Cap)}
                    </Button>
                </Link>
            );
        });
        const wikiTitle = this.props.translate.get(Key.Wiki, Deco.Cap);
        return (
            <Container>
                <SidebarHeader screenWidth={this.props.screenWidth} title={wikiTitle} />
                {menuItems}
            </Container>
        );
    }
    private _renderLoading(): React.ReactNode {
        return (
            <Container className="pt4">
                <Container className="center pb2">
                    <CircularProgress size={40} thickness={5} />
                </Container>
                <Container className="center pt2" paddingBottom="11px">
                    Loading wiki...
                </Container>
            </Container>
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
                </div>
            );
        });
        return <div key={`section-${sectionName}`}>{renderedArticles}</div>;
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
                        await utils.onPageLoadPromise;
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
    private _getSectionNameToLinks(articlesBySection: ArticlesBySection): ObjectMap<ALink[]> {
        const sectionNames = _.keys(articlesBySection);
        const sectionNameToLinks: ObjectMap<ALink[]> = {};
        for (const sectionName of sectionNames) {
            const articles = articlesBySection[sectionName];
            const articleLinks = _.map(articles, article => {
                return {
                    to: sharedUtils.getIdFromName(article.title),
                    title: article.title,
                };
            });
            sectionNameToLinks[sectionName] = articleLinks;
        }
        return sectionNameToLinks;
    }
}
