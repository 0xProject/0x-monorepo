import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import * as zeroExInstant from 'zeroExInstant';

import { Banner } from 'ts/components/banner';
import { DocumentTitle } from 'ts/components/document_title';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading } from 'ts/components/text';
import { Input as SearchInput } from 'ts/components/ui/search_textfield';
import { BY_NAME_ORDERINGS, EDITORIAL, FILTERS, ORDERINGS, PROJECTS } from 'ts/pages/explore/explore_content';
import { ExploreSettingsDropdown } from 'ts/pages/explore/explore_dropdown';
import { ExploreGrid } from 'ts/pages/explore/explore_grid';
import { EXPLORE_STATE_DIALOGS, ExploreGridDialogTile } from 'ts/pages/explore/explore_grid_state_tile';
import { Button as ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import {
    ExploreAnalyticAction,
    ExploreFilterMetadata,
    ExploreProject,
    ExploreProjectInstantMetadata,
    ExploreTile,
    ExploreTilesModifiers,
    ExploreTilesOrdering,
    ExploreTilesOrderingMetadata,
    ExploreTileVisibility,
    ExploreTileWidth,
} from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

export interface ExploreProps {}

interface ExploreModifierOptions {
    filter?: ExploreFilterMetadata;
    query?: string;
    isEditorialShown?: boolean;
    tilesOrdering?: ExploreTilesOrdering;
}

export class Explore extends React.Component<ExploreProps> {
    public state = {
        isTilesLoading: false,
        isContactModalOpen: false,
        tiles: [] as ExploreTile[],
        tilesOrdering: ExploreTilesOrdering.None,
        isEditorialShown: true,
        filters: FILTERS,
        query: '',
    };

    constructor(props: ExploreProps) {
        super(props);
    }

    public componentWillMount(): void {
        // tslint:disable-next-line:no-floating-promises
        this._loadEntriesAsync().then(() => {
            this._setFilter('all');
        });
    }

    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.EXPLORE} />
                <ExploreHero onSearch={this._changeSearchResults} />
                <Section padding={'0 0 120px 0'} maxWidth={'1150px'}>
                    <ExploreToolBar
                        onFilterClick={this._setFilter}
                        filters={this.state.filters}
                        editorial={this.state.isEditorialShown}
                        onEditorial={this._onEditorial}
                        orderings={ORDERINGS}
                        activeOrdering={this.state.tilesOrdering}
                        onOrdering={this._onOrdering}
                    />
                    <ExploreGrid tiles={this._generateTilesFromState()} />
                </Section>
                <Banner
                    heading="Working on a 0x project?"
                    subline="Lorem Ipsum something then that and say something more."
                    mainCta={{ text: 'Apply Now', onClick: this._onOpenContactModal }}
                    secondaryCta={{ text: 'Join Discord', href: 'https://discordapp.com/invite/d3FTX3M' }}
                />
                <ModalContact
                    isOpen={this.state.isContactModalOpen}
                    onDismiss={this._onDismissContactModal}
                    modalContactType={ModalContactType.Explore}
                />
            </SiteWrap>
        );
    }

    private readonly _onOpenContactModal = (): void => {
        this.setState({ isContactModalOpen: true });
    };

    private readonly _onDismissContactModal = (): void => {
        this.setState({ isContactModalOpen: false });
    };

    private readonly _onEditorial = (newValue: boolean): void => {
        // tslint:disable-next-line:no-floating-promises
        this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Editorial, {
            isEditorialShown: newValue,
        }).then(newTiles => {
            this.setState({ isEditorialShown: newValue, tiles: newTiles });
        });
    };

    private readonly _onOrdering = (newValue: string) => {
        this.setState({ tilesOrdering: newValue });
        // tslint:disable-next-line:no-floating-promises
        this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Ordering, {
            tilesOrdering: newValue as ExploreTilesOrdering,
        }).then(newTiles => {
            this.setState({ tilesOrdering: newValue, tiles: newTiles });
        });
    };

    private readonly _launchInstantAsync = (params: ExploreProjectInstantMetadata): void => {
        zeroExInstant.render(params, 'body');
    };

    private readonly _onAnalytics = (project: ExploreProject, action: ExploreAnalyticAction): void => {
        // Do Something
    };

    private _generateEditorialContent(): void {
        this.setState({ tiles: _.concat([], EDITORIAL, this.state.tiles) });
    }

    private readonly _generateTilesFromState = (): ExploreTile[] => {
        if (this.state.isTilesLoading) {
            return [
                {
                    name: 'loading',
                    component: <ExploreGridDialogTile {...EXPLORE_STATE_DIALOGS.LOADING} />,
                    visibility: ExploreTileVisibility.Visible,
                    width: ExploreTileWidth.FullWidth,
                },
            ];
        }
        if (_.isEmpty(this.state.tiles.filter(t => t.visibility !== ExploreTileVisibility.Hidden))) {
            return [
                {
                    name: 'empty',
                    component: <ExploreGridDialogTile {...EXPLORE_STATE_DIALOGS.EMPTY} />,
                    visibility: ExploreTileVisibility.Visible,
                    width: ExploreTileWidth.FullWidth,
                },
            ];
        }
        return this.state.tiles;
    };

    private readonly _changeSearchResults = (query: string): void => {
        const trimmedQuery = query.trim().toLowerCase();
        // tslint:disable-next-line:no-floating-promises
        this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Search, {
            query: trimmedQuery,
            filter: this.state.filters.find(f => f.active),
        })
            .then(async newTiles =>
                this._generateTilesWithModifier(newTiles, ExploreTilesModifiers.Editorial, {
                    isEditorialShown: _.isEmpty(trimmedQuery) ? this.state.isEditorialShown : false,
                }),
            )
            .then(newTiles => {
                this.setState({ query: trimmedQuery, tiles: newTiles });
            });
    };

    private readonly _setFilter = (filterName: string, active: boolean = true): void => {
        let updatedFilters: ExploreFilterMetadata[];
        updatedFilters = this.state.filters.map(f => {
            const newFilter = _.assign({}, f);
            newFilter.active = newFilter.name === filterName ? active : false;
            return newFilter;
        });
        // If no filters are enabled, default to all
        if (_.filter(updatedFilters, f => f.active).length === 0) {
            this._setFilter('all');
        } else {
            // tslint:disable-next-line:no-floating-promises
            this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Filter, {
                filter: updatedFilters.find(f => f.active),
            }).then(newTiles => {
                this.setState({ filters: updatedFilters, tiles: newTiles });
            });
        }
    };

    private readonly _verifyExploreTilesModifierOptions = (
        modifier: ExploreTilesModifiers,
        options: ExploreModifierOptions,
    ): boolean => {
        if (modifier === ExploreTilesModifiers.Ordering) {
            return _.has(options, 'tilesOrdering');
        }
        if (modifier === ExploreTilesModifiers.Editorial) {
            return _.has(options, 'isEditorialShown');
        }
        if (modifier === ExploreTilesModifiers.Search) {
            return _.has(options, 'filter') && _.has(options, 'query');
        }
        if (modifier === ExploreTilesModifiers.Filter) {
            return _.has(options, 'filter');
        }
        return false;
    };

    private readonly _generateTilesWithModifier = async (
        tiles: ExploreTile[],
        modifier: ExploreTilesModifiers,
        options: ExploreModifierOptions,
    ): Promise<ExploreTile[]> => {
        if (!this._verifyExploreTilesModifierOptions(modifier, options)) {
            return tiles;
        }
        if (modifier === ExploreTilesModifiers.Ordering) {
            if (!!BY_NAME_ORDERINGS[options.tilesOrdering]) {
                return _.sortBy(tiles, t => _.indexOf(BY_NAME_ORDERINGS[options.tilesOrdering], t.name));
            } else {
                return tiles;
            }
        }
        return _.concat([], tiles).map(t => {
            const newTile = _.assign({}, t);
            if (modifier === ExploreTilesModifiers.Filter || modifier === ExploreTilesModifiers.Search) {
                newTile.visibility =
                    (options.filter.name === 'all' && ExploreTileVisibility.Visible) || newTile.visibility;
                if (!(options.filter.name === 'all') && !!newTile.exploreProject) {
                    newTile.visibility =
                        (_.includes(newTile.exploreProject.keywords, options.filter.name) &&
                            ExploreTileVisibility.Visible) ||
                        ExploreTileVisibility.Hidden;
                }
            }
            if (
                !!newTile.exploreProject &&
                modifier === ExploreTilesModifiers.Search &&
                newTile.visibility === ExploreTileVisibility.Visible
            ) {
                newTile.visibility =
                    (_.startsWith(newTile.exploreProject.label.toLowerCase(), options.query) &&
                        ExploreTileVisibility.Visible) ||
                    ExploreTileVisibility.Hidden;
            }
            if (modifier === ExploreTilesModifiers.Editorial) {
                if (_.startsWith(t.name, 'editorial')) {
                    newTile.visibility = options.isEditorialShown
                        ? ExploreTileVisibility.Visible
                        : ExploreTileVisibility.Hidden;
                }
            }
            return newTile;
        });
    };

    // For future versions, the load entries function can be async
    private readonly _loadEntriesAsync = async (): Promise<void> => {
        this.setState({ isEntriesLoading: true });
        const rawProjects = _.values(PROJECTS);
        const tiles = rawProjects.map((e: ExploreProject) => {
            const exploreProject = _.assign({}, e);
            if (!!exploreProject.instant) {
                exploreProject.onInstantClick = this._launchInstantAsync.bind(this, exploreProject.instant);
            }
            return {
                name: e.name,
                exploreProject,
                visibility: ExploreTileVisibility.Visible,
                width: ExploreTileWidth.OneThird,
                onAnalytics: this._onAnalytics.bind(this, exploreProject),
            };
        });
        const orderedTiles = await this._generateTilesWithModifier(tiles, ExploreTilesModifiers.Ordering, {
            tilesOrdering: this.state.tilesOrdering,
        });
        this.setState({ tiles: orderedTiles, isEntriesLoading: false }, () => {
            this._generateEditorialContent();
        });
    };
}

const ExploreHeroContentWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

interface ExploreHeroProps {
    onSearch(query: string): void;
}

const ExploreHero = (props: ExploreHeroProps) => {
    // tslint:disable-next-line:no-unbound-method
    const onSearchDebounce = _.debounce(props.onSearch, 300);
    const onChange = (e: any) => {
        onSearchDebounce(e.target.value);
    };
    return (
        <Section maxWidth={'1150px'}>
            <ExploreHeroContentWrapper>
                <Heading isNoMargin={true} size="large">
                    Explore 0x
                </Heading>
                <SearchInput onChange={onChange} width={'28rem'} placeholder="Search tokens, relayers, and dApps..." />
            </ExploreHeroContentWrapper>
        </Section>
    );
};

const ExploreToolBarWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const ExploreToolBarContentWrapper = styled.div`
    display: flex;
    padding: 2rem 0;
    & > * {
        margin: 0 0.3rem;
    }
    & *:first-child {
        margin-left: 0;
    }
    & *:last-child {
        margin-right: 0;
    }
`;

interface ExploreToolBarProps {
    filters: ExploreFilterMetadata[];
    activeOrdering: ExploreTilesOrdering;
    orderings: ExploreTilesOrderingMetadata[];
    editorial: boolean;
    onOrdering: (newValue: string) => void;
    onEditorial: (newValue: boolean) => void;
    onFilterClick(filterName: string, active: boolean): void;
}

const ExploreToolBar = (props: ExploreToolBarProps) => {
    return (
        <ExploreToolBarWrapper>
            <ExploreToolBarContentWrapper>
                {!!props.filters &&
                    props.filters.map(f => {
                        const onClick = () => {
                            props.onFilterClick(f.name, !f.active);
                        };
                        return (
                            <ExploreTagButton onClick={onClick} active={f.active} key={f.name}>
                                {f.label}
                            </ExploreTagButton>
                        );
                    })}
            </ExploreToolBarContentWrapper>
            <ExploreToolBarContentWrapper>
                <ExploreSettingsDropdown {...props} />
            </ExploreToolBarContentWrapper>
        </ExploreToolBarWrapper>
    );
};
