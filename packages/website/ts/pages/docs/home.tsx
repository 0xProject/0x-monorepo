import React from 'react';
import styled from 'styled-components';

import { CommunityLink, ICommunityLinkProps } from 'ts/components/docs/community_link';
import { GetStartedLink, IGetStartedLinkProps } from 'ts/components/docs/get_started_link';
import { Hero } from 'ts/components/docs/hero';
import { Separator } from 'ts/components/docs/separator';
import { IShortcutLinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
import { SiteWrap } from 'ts/components/docs/siteWrap';
import { IStepLinkConfig } from 'ts/components/docs/step_link';
import { StepLinks } from 'ts/components/docs/step_links';
import { DocumentTitle } from 'ts/components/document_title';
import { Section } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';

import { documentConstants } from 'ts/utils/document_meta_constants';

const SEPARATOR_MARGIN = '60px 0';

export const DocsHome: React.FC = () => {
    return (
        <SiteWrap theme="light">
            <DocumentTitle {...documentConstants.DOCS} />
            <Hero isHome={true} title="0x Docs" />
            <Section maxWidth="1150px" isPadded={false}>
                <ShortcutsWrapper>
                    {shortcuts.map((shortcut, index) => (
                        <ShortcutLink key={`shortcut-${index}`} {...shortcut} />
                    ))}
                </ShortcutsWrapper>
                <Separator margin={SEPARATOR_MARGIN} />
                <GetStartedWrapper>
                    <div>
                        <Heading size="default">Get Started</Heading>
                        {getStartedLinks.map((link, index) => (
                            <GetStartedLink key={`getStarted-${index}`} {...link} />
                        ))}
                    </div>
                    <div>
                        <Heading size="default">Useful Links</Heading>
                        <StepLinks links={usefulLinks} />
                    </div>
                </GetStartedWrapper>
                <Separator margin={SEPARATOR_MARGIN} />
                <CommunityWrapper>
                    {communityShortcuts.map((shortcut, index) => (
                        <CommunityLink key={`communityLink-${index}`} {...shortcut} />
                    ))}
                </CommunityWrapper>
            </Section>
        </SiteWrap>
    );
};

const ShortcutsWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 30px;
    grid-row-gap: 30px;

    @media (max-width: 500px) {
        grid-template-columns: 1fr;
    }
`;

const GetStartedWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 70px;
    grid-row-gap: 30px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const CommunityWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-column-gap: 30px;
    grid-row-gap: 30px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const shortcuts: IShortcutLinkProps[] = [
    {
        heading: 'Core Concepts',
        description: 'Understand the fundamentals of 0x development',
        icon: 'coreConcepts',
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

const usefulLinks: IStepLinkConfig[] = [
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

const getStartedLinks: IGetStartedLinkProps[] = [
    {
        heading: 'Launch an exchange in 30 seconds',
        description: 'Learn how to spin up an exchange or marketplace in seconds.',
        url: '/docs/core-concepts',
    },
    {
        heading: 'Tap into contract-fillable liquidity',
        description: 'Source contract-fillable liquidity at the best prices from 0x.',
        url: '/docs/api-explorer',
    },
    {
        heading: 'Launch your in-game marketplace',
        description: 'Make your in-game items tradable with minimal effort.',
        url: '/docs/get-started',
    },
    {
        heading: 'Predict the future with 0x',
        description: 'Build a prediction market end-to-end using 0x and Augur.',
        url: '/docs/core-concepts',
    },
];

const communityShortcuts: ICommunityLinkProps[] = [
    {
        heading: 'Discord',
        description: 'Chat with the 0x community',
        icon: 'chat',
        url: '/docs/core-concepts',
    },
    {
        heading: 'Forum',
        description: 'Nerd out with 0x researchers',
        icon: 'forum',
        url: '/docs/core-concepts',
    },
    {
        heading: 'GitHub',
        description: 'Contribute to development',
        icon: 'github',
        url: '/docs/get-started',
    },
];
