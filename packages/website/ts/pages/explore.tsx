import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { DocumentTitle } from 'ts/components/document_title';
import { Icon } from 'ts/components/icon';
import { ModalContact, ModalContactType } from 'ts/components/modals/modal_contact';
import { Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading } from 'ts/components/text';
import { Input as SearchInput } from 'ts/components/ui/search_textfield';
import { ExploreGrid } from 'ts/pages/explore/explore_grid';
import { Button as ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import { colors } from 'ts/style/colors';
import { ExploreEntry, ExploreEntryVisibility, ExploreFilterMetadata, ExploreFilterType, RicherExploreEntry } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

export interface ExploreProps {}

const PROJECTS: { [s: string]: ExploreEntry } = {
    paradex: {
        label: 'Paradex',
        description: 'Paradex is a matching relayer with a focus on stable coins that is now a part of Coinbase.',
        logo_url: '/images/explore/paradex.png',
        theme_color: '#151628',
        url: 'https://paradex.io/',
        keywords: ['relayer'],
        instant: {
            orderSource: '',
        },
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
    None = 'NONE',
}

export class Explore extends React.Component<ExploreProps> {
    public state = {
        isContactModalOpen: false,
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
                    <ExploreGrid entries={this.state.entries} />
                </Section>
                <Banner
                    heading="Have a 0x project?"
                    subline="Lorem Ipsum something then that and say something more."
                    mainCta={{ text: 'Apply Now', onClick: this._onOpenContactModal }}
                    secondaryCta={{ text: 'Join Discord', href: 'https://discordapp.com/invite/d3FTX3M' }}
                />
                <ModalContact
                    isOpen={this.state.isContactModalOpen}
                    onDismiss={this._onDismissContactModal}
                    modalContactType={ModalContactType.Credits}
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

    private _launchInstantAsync = async (): Promise<void> => {

    };

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
        let newEntries: RicherExploreEntry[];
        if (modifier === ExploreEntriesModifiers.Filter || modifier === ExploreEntriesModifiers.Search) {
            const activeFilters = _.filter(this.state.filters, f => f.active);
            if (activeFilters.length === 1 && activeFilters[0].name === 'all') {
                newEntries = _.concat([], this.state.entries).map(e => {
                    const newEntry = _.assign({}, e);
                    newEntry.visibility = ExploreEntryVisibility.Visible;
                    if (modifier === ExploreEntriesModifiers.Search && newEntry.visibility === ExploreEntryVisibility.Visible) {
                        newEntry.visibility = (_.includes(newEntry.label.toLowerCase(), this.state.query) && ExploreEntryVisibility.Visible) || ExploreEntryVisibility.Hidden;
                    }
                    return newEntry;
                });
            } else {
                newEntries = _.concat([], this.state.entries).map(e => {
                    const newEntry = _.assign({}, e);
                    newEntry.visibility = _.intersectionWith(activeFilters, newEntry.keywords, (f, k) => k === f.name).length !== 0 ? ExploreEntryVisibility.Visible : ExploreEntryVisibility.Hidden;
                    if (modifier === ExploreEntriesModifiers.Search && newEntry.visibility === ExploreEntryVisibility.Visible) {
                        newEntry.visibility = (_.includes(newEntry.label.toLowerCase(), this.state.query) && ExploreEntryVisibility.Visible) || ExploreEntryVisibility.Hidden;
                    }
                    return newEntry;
                });
            }
        }
        this.setState({ entries: newEntries});
    };

    // For future versions, ordering can be determined by async processes
    private _setEntriesOrderingAsync = async (entries: RicherExploreEntry[]): Promise<RicherExploreEntry[]> => {
        switch (this.state.entriesOrdering) {
            default: return entries;
        }
    }

    // For future versions, the load entries function can be async
    private _loadEntriesAsync = async (): Promise<void> => {
        const rawEntries = _.values(PROJECTS).map(e => _.assign(e, { visibility: ExploreEntryVisibility.Visible})) as RicherExploreEntry[];
        const entries = await this._setEntriesOrderingAsync(rawEntries);
        this.setState({ entries });
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

const SettingsIconWrapper = styled.div`
    padding-right: 0.4rem;
    display: inline;
    & > * {
        transform: translateY(2px);
    }
`;

const ExploreToolBar = (props: ExploreToolBarProps) => {
    return <ExploreToolBarWrapper>
        <ExploreToolBarContentWrapper>
            {!!props.filters && props.filters.map(f => {
                const onClick = () => { props.onFilterClick(f.name, !f.active); };
                return <ExploreTagButton onClick={onClick} active={f.active} key={f.name}>{f.label}</ExploreTagButton>;
            })}
        </ExploreToolBarContentWrapper>
        <ExploreToolBarContentWrapper>
            <ExploreTagButton disableHover={true}>
                <SettingsIconWrapper>
                    <Icon color={colors.grey} name="settings" size={16} />
                </SettingsIconWrapper>
                Featured
            </ExploreTagButton>
        </ExploreToolBarContentWrapper>
    </ExploreToolBarWrapper>;
};
