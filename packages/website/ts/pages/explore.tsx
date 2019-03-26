import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import * as zeroExInstant from 'zeroExInstant';

import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading } from 'ts/components/text';
import { Input as SearchInput } from 'ts/components/ui/search_textfield';
import {
    AVAILABLE_ASSET_DATAS,
    BY_NAME_ORDERINGS,
    EDITORIAL,
    FILTERS,
    ORDERINGS,
    PROJECTS,
} from 'ts/pages/explore/explore_content';
import { ExploreSettingsDropdown } from 'ts/pages/explore/explore_dropdown';
import { ExploreGrid } from 'ts/pages/explore/explore_grid';
import { EXPLORE_STATE_DIALOGS, ExploreGridDialogTile } from 'ts/pages/explore/explore_grid_state_tile';
import { ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import { analytics } from 'ts/utils/analytics';

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
        tiles: [] as ExploreTile[],
        tilesOrdering: ExploreTilesOrdering.Popular,
        isEditorialShown: true,
        filters: FILTERS,
        query: '',
    };

    private readonly _debouncedChangeSearchResults: (query: string) => void;

    constructor(props: ExploreProps) {
        super(props);
        this._debouncedChangeSearchResults = _.debounce(this._changeSearchResults, 300);
    }

    // tslint:disable-next-line:async-suffix
    public async componentDidMount(): Promise<void> {
        await this._loadEntriesAsync();
        await this._setFilter('all');
    }

    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.EXPLORE} />
                <ExploreHero query={this.state.query} onSearch={this._setNewQuery} />
                <Section isPadded={false} padding={'0 0 60px 0'} maxWidth={'1150px'}>
                    <ExploreToolBar
                        onFilterClick={this._setFilter}
                        filters={this.state.filters}
                        // editorial={this.state.isEditorialShown}
                        // onEditorial={this._onEditorial}
                        orderings={ORDERINGS}
                        activeOrdering={this.state.tilesOrdering}
                        onOrdering={this._onOrdering}
                    />
                    <ExploreGrid tiles={this._generateTilesFromState()} />
                </Section>
            </SiteWrap>
        );
    }

    // tslint:disable-next-line:no-unused-variable
    private readonly _onEditorial = async (newValue: boolean): Promise<void> => {
        const newTiles = await this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Editorial, {
            isEditorialShown: newValue,
        });
        this.setState({ isEditorialShown: newValue, tiles: newTiles });
    };

    private readonly _onOrdering = async (newValue: string): Promise<void> => {
        this.setState({ tilesOrdering: newValue });
        const newTiles = await this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Ordering, {
            tilesOrdering: newValue as ExploreTilesOrdering,
        });
        this.setState({ tilesOrdering: newValue, tiles: newTiles });
    };

    private readonly _launchInstantAsync = (params: ExploreProjectInstantMetadata): void => {
        zeroExInstant.render(params, 'body');
    };

    private readonly _onAnalytics = (project: ExploreProject, action: ExploreAnalyticAction): void => {
        switch (action) {
            case ExploreAnalyticAction.InstantClick:
                analytics.track('Explore - Instant - Clicked', { name: project.name });
                break;
            case ExploreAnalyticAction.LinkClick:
                analytics.track('Explore - Link - Clicked', { name: project.name });
                break;
            default:
                break;
        }
    };

    // tslint:disable-next-line:no-unused-variable
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

    private readonly _setNewQuery = (query: string): void => {
        this.setState({ query });
        this._debouncedChangeSearchResults(query);
    };

    private readonly _changeSearchResults = async (query: string): Promise<void> => {
        const searchedTiles = await this._generateTilesWithModifier(this.state.tiles, ExploreTilesModifiers.Search, {
            query,
            filter: this.state.filters.find(f => f.active),
        });
        // const newTiles = this._generateTilesWithModifier(searchedTiles, ExploreTilesModifiers.Editorial, {
        //     isEditorialShown: _.isEmpty(query) ? this.state.isEditorialShown : false,
        // })
        this.setState({ tiles: searchedTiles });
    };

    private readonly _setFilter = async (filterName: string, active: boolean = true): Promise<void> => {
        let updatedFilters: ExploreFilterMetadata[];
        updatedFilters = this.state.filters.map(f => {
            const newFilter = _.assign({}, f);
            newFilter.active = newFilter.name === filterName ? active : false;
            return newFilter;
        });
        // If no filters are enabled, default to all
        if (_.filter(updatedFilters, f => f.active).length === 0) {
            await this._setFilter('all');
        } else {
            const newTiles = await this._generateTilesWithModifier(
                this.state.tiles,
                _.isEmpty(this.state.query) ? ExploreTilesModifiers.Filter : ExploreTilesModifiers.Search,
                {
                    filter: updatedFilters.find(f => f.active),
                    query: this.state.query,
                },
            );
            this.setState({ filters: updatedFilters, tiles: newTiles });
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
        const trimmedQuery = modifier === ExploreTilesModifiers.Search ? options.query.trim().toLowerCase() : '';
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
                    (_.startsWith(newTile.exploreProject.label.toLowerCase(), trimmedQuery) &&
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
                exploreProject.instant = _.assign({}, exploreProject.instant, {
                    availableAssetDatas: AVAILABLE_ASSET_DATAS,
                });
                exploreProject.onInstantClick = this._launchInstantAsync.bind(this, exploreProject.instant);
            }
            exploreProject.onAnalytics = this._onAnalytics.bind(this, exploreProject);
            return {
                name: e.name,
                exploreProject,
                visibility: ExploreTileVisibility.Visible,
                width: ExploreTileWidth.OneThird,
            };
        });
        const orderedTiles = await this._generateTilesWithModifier(tiles, ExploreTilesModifiers.Ordering, {
            tilesOrdering: this.state.tilesOrdering,
        });
        this.setState({ tiles: orderedTiles, isEntriesLoading: false }, () => {
            // this._generateEditorialContent();
        });
    };
}

const ExploreHeroContentWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 100px 0;
    @media (max-width: 36rem) {
        display: block;
        padding: 50px 0;
    }
`;

const ExploreSearchInputWrapper = styled.div`
    width: 22rem;
    @media (max-width: 52rem) {
        width: 16rem;
    }
    @media (max-width: 36rem) {
        margin-top: 10px;
        padding-left: 5px;
        width: 100%;
    }
`;

interface ExploreHeroProps {
    query: string;
    onSearch(query: string): void;
}

const ExploreHero = (props: ExploreHeroProps) => {
    const onChange = (e: any) => {
        props.onSearch(e.target.value);
    };
    return (
        <Section maxWidth={'1150px'} isPadded={false}>
            <ExploreHeroContentWrapper>
                <Heading isNoMargin={true} size="large">
                    Explore 0x
                </Heading>
                <ExploreSearchInputWrapper>
                    <SearchInput value={props.query} onChange={onChange} placeholder="Search..." />
                </ExploreSearchInputWrapper>
            </ExploreHeroContentWrapper>
        </Section>
    );
};

const ExploreToolBarWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    @media (max-width: 36rem) {
        display: block;
    }
`;

const ExploreToolBarContentWrapper = styled.div`
    display: flex;
    padding-bottom: 2rem;
    @media (max-width: 36rem) {
        display: none;
    }
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
    editorial?: boolean;
    onOrdering: (newValue: string) => void;
    onEditorial?: (newValue: boolean) => void;
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
            <ExploreSettingsDropdown {...props} />
        </ExploreToolBarWrapper>
    );
};
