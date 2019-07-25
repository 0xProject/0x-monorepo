import React from 'react';

import { CommunityLinks } from 'ts/components/docs/home/community_links';
import { MiddleSection } from 'ts/components/docs/home/middle_section';
import { ShortcutLinks } from 'ts/components/docs/home/shortcut_links';

import { Separator } from 'ts/components/docs/separator';

import { DocsPageLayout } from 'ts/components/docs/layout/docs_page_layout';

import { constants } from 'ts/utils/constants';

import { WebsitePaths } from 'ts/types';

const SEPARATOR_MARGIN = '60px 0';

export const DocsHome: React.FC = () => {
    return (
        <DocsPageLayout isHome={true} title="0x Docs">
            <ShortcutLinks links={shortcutLinks} />
            <Separator margin={SEPARATOR_MARGIN} />
            <MiddleSection getStartedLinks={getStartedLinks} usefulLinks={usefulLinks} />
            <Separator margin={SEPARATOR_MARGIN} />
            <CommunityLinks links={communityLinks} />
        </DocsPageLayout>
    );
};

const shortcutLinks = [
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

const usefulLinks = [
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

const getStartedLinks = [
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

const communityLinks = [
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
