import React from 'react';
import styled from 'styled-components';

import { Hero } from 'ts/components/docs/hero';
import { Resource } from 'ts/components/docs/resource/resource';
import { Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';

import { documentConstants } from 'ts/utils/document_meta_constants';

import { Hits, InstantSearch } from 'react-instantsearch-dom';

import algoliasearch from 'algoliasearch/lite';

const searchClient = algoliasearch('39X6WOJZKW', '6acba761a34d99781628c6178af1e16c');

export const DocsGuides: React.FC = () => (
    <SiteWrap theme="light">
        <DocumentTitle {...documentConstants.DOCS} />
        <Hero title="Guides" />
        <Section maxWidth="1030px" isPadded={false}>
            <InstantSearch searchClient={searchClient} indexName="0x_guides_test">
                <Columns>
                    <Filters filters={filters} />
                    <Hits hitComponent={Resource} />
                </Columns>
            </InstantSearch>
        </Section>
    </SiteWrap>
);

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
        attribute: 'topics',
        heading: 'Topic',
    },
    {
        attribute: 'difficulty',
        heading: 'Level',
    },
];
