import { utils as sharedUtils } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { keyframes } from 'styled-components';

import { CommunityLink, CommunityLinkProps } from 'ts/components/docs/community_link';
import { Hero } from 'ts/components/docs/hero';
import { SearchInput } from 'ts/components/docs/search_input';
import { LinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { StepLinkConfig } from 'ts/components/docs/step_link';
import { StepLinks } from 'ts/components/docs/step_links';
import { DocumentTitle } from 'ts/components/document_title';
import { Section, SectionProps } from 'ts/components/newLayout';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';
import { WebsitePaths } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

interface Props {
    location: Location;
    theme: {
        bgColor: string;
        textColor: string;
        linkColor: string;
    };
}

const shortcuts: LinkProps[] = [
    {
        heading: 'Core Concepts',
        description: 'Understand the fundamentals of 0x development',
        icon: '0x-coreConcepts',
        url: '/docs/core-concepts',
    },
    {
        heading: 'API Explorer',
        description: 'Browse and filter through all the open-source 0x developer tools',
        icon: 'apiExplorer',
        url: '/docs/core-concepts',
    },
    {
        heading: 'Guides',
        description: 'Dive into intermediate and advanced 0x development  topics',
        icon: 'getStarted',
        url: '/docs/get-started',
    },
    {
        heading: 'Tools',
        description: 'Explore the core 0x library and how to use it',
        icon: 'tools',
        url: '/docs/core-concepts',
    },
];

const usefulLinks: StepLinkConfig[] = [
    {
        title: 'Core Concepts',
        url: '/docs/core-concepts',
    },
    {
        title: 'API Explorer',
        url: '/docs/core-concepts',
    },
    {
        title: 'Guides',
        url: '/docs/get-started',
    },
    {
        title: 'Tools',
        url: '/docs/core-concepts',
    },
];

const communityShortcuts: CommunityLinkProps[] = [
    {
        heading: 'Discord',
        description: 'Chat with the 0x community',
        icon: '0x-coreConcepts',
        url: '/docs/core-concepts',
    },
    {
        heading: 'Forum',
        description: 'Nerd out with 0x researchers',
        icon: 'apiExplorer',
        url: '/docs/core-concepts',
    },
    {
        heading: 'GitHub',
        description: 'Contribute to development',
        icon: 'getStarted',
        url: '/docs/get-started',
    },
];

export class DocsHome extends React.Component<Props> {
    public state = {};
    public componentDidMount(): void {}
    public render(): React.ReactNode {
        return (
            <SiteWrap theme="light">
                <DocumentTitle {...documentConstants.DOCS} />
                <Hero isHome={true} title="0x Docs" />
                <Section maxWidth={'1150px'} isPadded={false} padding="0 0">
                    <ShortcutsWrapper>
                        {shortcuts.map((shortcut, index) => (
                            <ShortcutLink key={`shortcut-${index}`} {...shortcut} />
                        ))}
                    </ShortcutsWrapper>
                    <Separator />
                    <Columns>
                        <div>
                            <Heading size="default">Get Started</Heading>
                        </div>
                        <div>
                            <Heading size="default">Useful Links</Heading>
                            <StepLinks links={usefulLinks} />
                        </div>
                    </Columns>
                    <Separator />
                    <CommunityWrapper>
                        {communityShortcuts.map((shortcut, index) => (
                            <CommunityLink key={`communityLink-${index}`} {...shortcut} />
                        ))}
                    </CommunityWrapper>
                </Section>
            </SiteWrap>
        );
    }
}

const ShortcutsWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 30px;
    grid-row-gap: 30px;
`;

const CommunityWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-column-gap: 30px;
    grid-row-gap: 30px;
`;

const Columns = styled.div<{ count?: number }>`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 70px;
    grid-row-gap: 30px;
`;

Columns.defaultProps = {
    count: 2,
};

const Separator = styled.hr`
    border-width: 0 0 1px;
    border-color: #e4e4e4;
    height: 0;
    margin-top: 60px;
    margin-bottom: 60px;
`;
