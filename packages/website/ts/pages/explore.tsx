import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import * as zeroExInstant from 'zeroExInstant';

import { Banner } from 'ts/components/banner';
import { DocumentTitle } from 'ts/components/document_title';
import { Icon } from 'ts/components/icon';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading } from 'ts/components/text';
import { Input as SearchInput } from 'ts/components/ui/search_textfield';
import { ExploreGrid, ExploreGridListTile, ExploreGridListTileVisibility, ExploreGridListTileWidth } from 'ts/pages/explore/explore_grid';
import { EXPLORE_STATE_DIALOGS, ExploreGridDialogTile } from 'ts/pages/explore/explore_grid_state_tile';
import { Button as ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import { colors } from 'ts/style/colors';
import { ExploreEntry, ExploreEntryInstantMetadata, RicherExploreEntry } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';
import { ExploreSettingsDropdown } from 'ts/pages/explore/explore_dropdown';

export interface ExploreProps {}

const PROJECTS: { [s: string]: ExploreEntry } = {
    paradex: {
        label: 'Paradex',
        description: 'Paradex is a matching relayer with a focus on stable coins that is now a part of Coinbase.',
        logo_url: '/images/explore/paradex.png',
        theme_color: '#151628',
        url: 'https://paradex.io/',
        keywords: ['relayer'],
    },
    veil: {
        label: 'Veil',
        description: 'Veil is a non-custodial trading platform for blockchain-based derivatives and prediction markets.',
        logo_url: '/images/explore/veil.png',
        theme_color: '#0204EB',
        url: 'https://veil.co/',
        keywords: ['relayer'],
    },
    radar_relay: {
        label: 'Radar Relay',
        description: 'Radar Relay is an open order book relayer made by an international team based in Colorado.',
        logo_url: '/images/explore/radar_relay.png',
        theme_color: '#262626',
        url: 'https://radarrelay.com/',
        keywords: ['relayer'],
        instant: {
            orderSource: 'https://api.radarrelay.com/0x/v2/',
        },
    },
    emoon: {
        label: 'Emoon',
        description: 'Emoon is a peer-to-peer marketplace for the exchange of ERC-20 and ERC-721 crypto assets.',
        logo_url: '/images/explore/emoon.png',
        theme_color: '#3F89E7',
        url: 'https://www.emoon.io/',
        keywords: ['relayer', 'collectibles'],
    },
    openrelay: {
        label: 'OpenRelay',
        description: 'Open Relay is an open order book relayer with a focus on scalable and open source backend infrastructure.',
        logo_url: '/images/explore/open_relay.png',
        theme_color: '#163AAB',
        url: 'https://openrelay.xyz/',
        keywords: ['relayer'],
    },
    boxswap: {
        label: 'BoxSwap',
        description: 'OTC relayer made for swapping ERC-20 and ERC-721 assets in a marketplace communities.',
        logo_url: '/images/explore/box_swap.png',
        theme_color: '#FF99DF',
        url: 'https://boxswap.io/',
        keywords: ['relayer', 'collectibles'],
    },
};

enum ExploreFilterType {
    All = 'ALL',
    Keyword = 'Keyword',
}

interface ExploreFilterMetadata {
    label: string;
    filterType: ExploreFilterType;
    name: string;
    keyword?: string;
    active?: boolean;
}

const FILTERS: ExploreFilterMetadata[] = [{
    label: 'All',
    name: 'all',
    filterType: ExploreFilterType.All,
}, {
    label: 'Relayer',
    name: 'relayer',
    filterType: ExploreFilterType.Keyword,
    keyword: 'relayer',
}, {
    label: 'Collectibles',
    name: 'collectibles',
    filterType: ExploreFilterType.Keyword,
    keyword: 'ERC-721',
}];

enum ExploreEntriesModifiers {
    Filter = 'FILTER',
    Search = 'SEARCH',
}

enum ExploreEntriesOrdering {
    None = 'None',
    Latest = 'Latest',
    Popular = 'Popular',
}

const ORDERINGS = [ExploreEntriesOrdering.None, ExploreEntriesOrdering.Latest, ExploreEntriesOrdering.Popular];

export class Explore extends React.Component<ExploreProps> {
    public state = {
        isEntriesLoading: false,
        isContactModalOpen: false,
        tiles: [] as ExploreGridListTile[],
        entries: [] as RicherExploreEntry[],
        entriesOrdering: ExploreEntriesOrdering.None,
        filters: FILTERS,
        query: '',
    };

    constructor(props: ExploreProps) {
        super(props);
    }

    public componentWillMount(): void {
        // tslint:disable-next-line:no-empty
        this._loadEntriesAsync().then(() => {
            this._setFilter('all');
        });
    }

    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.EXPLORE} />
                <ExploreHero  onSearch={this._changeSearchResults} />
                <Section padding={'0 0 120px 0'} maxWidth={'1150px'}>
                    <ExploreToolBar onFilterClick={this._setFilter} filters={this.state.filters} />
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

    private _launchInstantAsync = (params: ExploreEntryInstantMetadata): void => {
        zeroExInstant.render(params, 'body');
    };

    private _generateTilesFromState = (): ExploreGridListTile[] => {
        if (this.state.isEntriesLoading) {
            return [{
                name: 'loading',
                component: <ExploreGridDialogTile {...EXPLORE_STATE_DIALOGS.LOADING} />,
                visibility: ExploreGridListTileVisibility.Visible,
                width: ExploreGridListTileWidth.FullWidth,
            }];
        }
        if (_.isEmpty(this.state.tiles.filter(t => !!t.exploreEntry && t.visibility !== ExploreGridListTileVisibility.Hidden))) {
            return [{
                name: 'empty',
                component: <ExploreGridDialogTile {...EXPLORE_STATE_DIALOGS.EMPTY} />,
                visibility: ExploreGridListTileVisibility.Visible,
                width: ExploreGridListTileWidth.FullWidth,
            }];
        }
        return this.state.tiles;
    }

    private _changeSearchResults = (query: string): void => {
        this.setState({ query: query.trim().toLowerCase() }, () => {
            this._setEntriesModifier(ExploreEntriesModifiers.Search);
        });
    }

    private _setFilter = (filterName: string, active: boolean = true): void => {
        let updatedFilters: ExploreFilterMetadata[];
        if (filterName === 'all') {
            updatedFilters = this.state.filters.map(f => {
                const newFilter = _.assign({}, f);
                newFilter.active = newFilter.name === 'all' ? active : false;
                return newFilter;
            });
        } else {
            updatedFilters = this.state.filters.map(f => {
                const newFilter = _.assign({}, f);
                newFilter.active = newFilter.name === filterName ? active : newFilter.active;
                newFilter.active = newFilter.name === 'all' ? false : newFilter.active;
                return newFilter;
            });
        }
        // If no filters are enabled, default to all
        if (_.filter(updatedFilters, f => f.active).length === 0) {
            this._setFilter('all');
        } else {
            this.setState({ filters: updatedFilters }, () => {
                this._setEntriesModifier(ExploreEntriesModifiers.Filter);
            });
        }
    };

    private _setEntriesModifier = async (modifier: ExploreEntriesModifiers): Promise<void>  => {
        let newTiles: ExploreGridListTile[];
        if (modifier === ExploreEntriesModifiers.Filter || modifier === ExploreEntriesModifiers.Search) {
            const activeFilters = _.filter(this.state.filters, f => f.active);
            if (activeFilters.length === 1 && activeFilters[0].name === 'all') {
                newTiles = _.concat([], this.state.tiles).map(t => {
                    const newTile = _.assign({}, t);
                    newTile.visibility = ExploreGridListTileVisibility.Visible;
                    if (modifier === ExploreEntriesModifiers.Search && !!newTile.exploreEntry) {
                        newTile.visibility = (_.includes(newTile.exploreEntry.label.toLowerCase(), this.state.query) && ExploreGridListTileVisibility.Visible) || ExploreGridListTileVisibility.Hidden;
                    }
                    return newTile;
                });
            } else {
                newTiles = _.concat([], this.state.tiles).map(t => {
                    const newTile = _.assign({}, t);
                    if (!!newTile.exploreEntry) {
                        newTile.visibility = _.intersectionWith(activeFilters, newTile.exploreEntry.keywords, (f, k) => k === f.name).length !== 0 ? ExploreGridListTileVisibility.Visible : ExploreGridListTileVisibility.Hidden;
                        if (modifier === ExploreEntriesModifiers.Search && newTile.visibility === ExploreGridListTileVisibility.Visible) {
                            newTile.visibility = (_.includes(newTile.exploreEntry.label.toLowerCase(), this.state.query) && ExploreGridListTileVisibility.Visible) || ExploreGridListTileVisibility.Hidden;
                        }
                    }
                    return newTile;
                });
            }
        }
        this.setState({ tiles: newTiles });
    };

    // For future versions, ordering can be determined by async processes
    private _setEntriesOrderingAsync = async (entries: RicherExploreEntry[]): Promise<RicherExploreEntry[]> => {
        switch (this.state.entriesOrdering) {
            default: return entries;
        }
    }

    // For future versions, the load entries function can be async
    private _loadEntriesAsync = async (): Promise<void> => {
        this.setState({ isEntriesLoading: true });
        const rawEntries = _.values(PROJECTS);
        const tiles = (await this._setEntriesOrderingAsync(rawEntries)).map(e => {
            const richExploreEntry = _.assign({}, e) as RicherExploreEntry;
            if (!!richExploreEntry.instant) {
                richExploreEntry.onInstantClick = () => this._launchInstantAsync(richExploreEntry.instant);
            }
            return {
                name: e.label.toLowerCase(),
                exploreEntry: richExploreEntry,
                visibility: ExploreGridListTileVisibility.Visible,
                width: ExploreGridListTileWidth.OneThird,
            };
        });
        this.setState({ entries: rawEntries, tiles, isEntriesLoading: false  });
    }
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
    const onSearchDebounce = _.debounce(props.onSearch, 300);
    const onChange = (e: any) => { onSearchDebounce(e.target.value); };
    return <Section maxWidth={'1150px'}>
        <ExploreHeroContentWrapper>
            <Heading isNoMargin={true} size="large">Explore 0x</Heading>
            <SearchInput onChange={onChange} width={'28rem'} placeholder="Search tokens, relayers, and dApps..."/>
        </ExploreHeroContentWrapper>
    </Section>;
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
    onFilterClick(filterName: string, active: boolean): void;
}

const ExploreToolBar = (props: ExploreToolBarProps) => {
    return <ExploreToolBarWrapper>
        <ExploreToolBarContentWrapper>
            {!!props.filters && props.filters.map(f => {
                const onClick = () => { props.onFilterClick(f.name, !f.active); };
                return <ExploreTagButton onClick={onClick} active={f.active} key={f.name}>{f.label}</ExploreTagButton>;
            })}
        </ExploreToolBarContentWrapper>
        <ExploreToolBarContentWrapper>
            <ExploreSettingsDropdown orderings={ORDERINGS}/>
        </ExploreToolBarContentWrapper>
    </ExploreToolBarWrapper>;
};
