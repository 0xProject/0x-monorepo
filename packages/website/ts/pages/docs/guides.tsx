import React from 'react';
import styled from 'styled-components';

import { Hero } from 'ts/components/docs/hero';
import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { ClearRefinements, Hits, InstantSearch } from 'react-instantsearch-dom';

import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

const resources = [
    {
        heading: '0x Mesh - your gateway to networked liquidity',
        description:
            'Learn about the 0x peer-to-peer network for sharing orders and how you can use it to tap into networked liquidity.',
        tags: ['Relayer'],
        url: 'https://0x.org',
        isCommunity: true,
    },
    {
        heading: '0x Mesh - your gateway to networked liquidity',
        description:
            'The Radar Relay SDK is a software development kit that simplifies the interactions with Radar Relay’s APIs',
        tags: ['Api explorer', 'Relayer'],
        url: 'https://0x.org',
    },
];

export const DocsGuides: React.FC = () => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title="Guides" />
            <Section maxWidth={'1030px'} isPadded={false} padding="0 0">
                <InstantSearch searchClient={searchClient} indexName="0x_guides_test">
                    <ClearRefinements />
                    <Columns>
                        <Filters filters={filters} />
                        <article>
                            <Hits hitComponent={Resource} />
                        </article>
                    </Columns>
                </InstantSearch>
            </Section>
        </SiteWrap>
    );
};

const Columns = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
    grid-row-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const filters = [
    {
        attribute: 'topic',
        heading: 'Topic',
    },
    {
        attribute: 'difficulty',
        heading: 'Level',
    },
];
