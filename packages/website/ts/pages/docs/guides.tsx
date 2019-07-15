import React from 'react';
import styled from 'styled-components';

import { Hero } from 'ts/components/docs/hero';
import { Resource } from 'ts/components/docs/resource/resource';
import { FilterGroup, Filters } from 'ts/components/docs/sidebar/filters';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { documentConstants } from 'ts/utils/document_meta_constants';

export const DocsGuides: React.FC = () => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero title="Guides" />
            <Section maxWidth={'1030px'} isPadded={false} padding="0 0">
                <Columns>
                    <Filters groups={filterGroups} />
                    <article>
                        {resources.map((resource, index) => (
                            <Resource key={`resource-${index}`} {...resource} />
                        ))}
                    </article>
                </Columns>
            </Section>
        </SiteWrap>
    );
};

const Columns = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-column-gap: 98px;
    grid-row-gap: 30px;
`;

const filterGroups: FilterGroup[] = [
    {
        heading: 'Topic',
        name: 'topic',
        filters: [
            {
                value: 'Mesh',
                label: 'Mesh',
            },
            {
                value: 'Testing',
                label: 'Testing',
            },
            {
                value: 'Coordinator Model',
                label: 'Coordinator Model',
            },
            {
                value: 'Protocol developer',
                label: 'Protocol developer',
            },
        ],
    },
    {
        heading: 'Level',
        name: 'level',
        filters: [
            {
                value: 'Beginner',
                label: 'Beginner',
            },
            {
                value: 'Intermediate',
                label: 'Intermediate',
            },
            {
                value: 'Advanced',
                label: 'Advanced',
            },
        ],
    },
];

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
