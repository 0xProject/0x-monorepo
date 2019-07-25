import React from 'react';
import styled from 'styled-components';

import { CommunityLinks, ICommunityLinkProps } from 'ts/components/docs/community_links';
import { GetStartedLink, IGetStartedLinkProps } from 'ts/components/docs/get_started_link';
import { IShortcutLinkProps, ShortcutLink } from 'ts/components/docs/shortcut_link';
import { IStepLinkProps, StepLinks } from 'ts/components/docs/step_links';

import { Separator } from 'ts/components/docs/separator';
import { Heading } from 'ts/components/text';

import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';

import { constants } from 'ts/utils/constants';

import { WebsitePaths } from 'ts/types';

const SEPARATOR_MARGIN = '60px 0';

export const DocsHome: React.FC = () => {
    return (
        <DocsPageLayout isHome={true} title="0x Docs">
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
            <CommunityLinks links={communityLinks} />
        </DocsPageLayout>
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

const shortcuts: IShortcutLinkProps[] = [
    {
        heading: 'Core Concepts',
        description: 'Understand the fundamentals of 0x development',
        icon: 'coreConcepts',
        url: WebsitePaths.DocsCoreConcepts,
    },
    {
        heading: 'API Explorer',
        description: 'Browse and filter through all the open-source 0x developer tools',
        icon: 'apiExplorer',
        url: WebsitePaths.DocsApiExplorer,
    },
    {
        heading: 'Guides',
        description: 'Dive into intermediate and advanced 0x development  topics',
        icon: 'getStarted',
        url: WebsitePaths.DocsGuides,
    },
    {
        heading: 'Tools',
        description: 'Explore the core 0x library and how to use it',
        icon: 'tools',
        url: WebsitePaths.DocsTools,
    },
];

const usefulLinks: IStepLinkProps[] = [
    {
        title: 'Core Concepts',
        url: WebsitePaths.DocsCoreConcepts,
    },
    {
        title: 'API Explorer',
        url: WebsitePaths.DocsApiExplorer,
    },
    {
        title: 'Guides',
        url: WebsitePaths.DocsGuides,
    },
    {
        title: 'Tools',
        url: WebsitePaths.DocsTools,
    },
];

const getStartedLinks: IGetStartedLinkProps[] = [
    {
        heading: 'Launch an exchange in 30 seconds',
        description: 'Learn how to spin up an exchange or marketplace in seconds.',
        url: WebsitePaths.DocsCoreConcepts,
    },
    {
        heading: 'Tap into contract-fillable liquidity',
        description: 'Source contract-fillable liquidity at the best prices from 0x.',
        url: WebsitePaths.DocsApiExplorer,
    },
    {
        heading: 'Launch your in-game marketplace',
        description: 'Make your in-game items tradable with minimal effort.',
        url: WebsitePaths.DocsGuides,
    },
    {
        heading: 'Predict the future with 0x',
        description: 'Build a prediction market end-to-end using 0x and Augur.',
        url: WebsitePaths.DocsTools,
    },
];

const communityLinks: ICommunityLinkProps[] = [
    {
        heading: 'Discord',
        description: 'Chat with the 0x community',
        icon: 'chat',
        url: constants.URL_ZEROEX_CHAT,
    },
    {
        heading: 'Forum',
        description: 'Nerd out with 0x researchers',
        icon: 'forum',
        url: constants.URL_FORUM,
    },
    {
        heading: 'GitHub',
        description: 'Contribute to development',
        icon: 'github',
        url: constants.URL_GITHUB_ORG,
    },
];
